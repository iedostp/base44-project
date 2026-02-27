import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { projectId } = await req.json();

        if (!projectId) {
            return Response.json({ error: 'Project ID is required' }, { status: 400 });
        }

        // Get Google Drive access token
        const accessToken = await base44.asServiceRole.connectors.getAccessToken('googledrive');

        // Fetch all documents for the project
        const documents = await base44.entities.Document.filter({ project_id: projectId });

        if (documents.length === 0) {
            return Response.json({ success: true, message: 'אין מסמכים לגיבוי', backedUp: 0 });
        }

        const results = [];

        // Create a folder for this project
        const folderMetadata = {
            name: `בונים בית - גיבוי מסמכים`,
            mimeType: 'application/vnd.google-apps.folder'
        };

        const folderResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(folderMetadata)
        });

        const folder = await folderResponse.json();
        const folderId = folder.id;

        // Upload each document
        for (const doc of documents) {
            try {
                // Download the file from the URL
                const fileResponse = await fetch(doc.file_url);
                const fileBlob = await fileResponse.blob();
                const arrayBuffer = await fileBlob.arrayBuffer();

                // Upload to Google Drive
                const metadata = {
                    name: doc.name,
                    parents: [folderId]
                };

                const form = new FormData();
                form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
                form.append('file', new Blob([arrayBuffer], { type: doc.file_type || 'application/octet-stream' }));

                const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    },
                    body: form
                });

                const uploadResult = await uploadResponse.json();

                results.push({
                    document: doc.name,
                    success: true,
                    driveId: uploadResult.id
                });
            } catch (error) {
                results.push({
                    document: doc.name,
                    success: false,
                    error: error.message
                });
            }
        }

        const successCount = results.filter(r => r.success).length;

        return Response.json({
            success: true,
            message: `גיבוי הושלם בהצלחה: ${successCount} מתוך ${documents.length} מסמכים`,
            folderId: folderId,
            folderUrl: `https://drive.google.com/drive/folders/${folderId}`,
            results: results,
            backedUp: successCount
        });

    } catch (error) {
        return Response.json({ 
            error: error.message,
            success: false
        }, { status: 500 });
    }
});