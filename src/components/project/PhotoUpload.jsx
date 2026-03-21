import React, { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabaseClient';
import { Camera, Trash2, Loader2, ImageOff, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── Supabase helpers ──────────────────────────────────────────────────────────

async function fetchPhotos(projectId) {
  const { data, error } = await supabase
    .from('project_photos')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function uploadPhoto({ projectId, file, caption, uploadedBy }) {
  const ext = file.name.split('.').pop();
  const path = `${projectId}/${Date.now()}.${ext}`;

  const { error: storageError } = await supabase.storage
    .from('project-photos')
    .upload(path, file, { upsert: false });
  if (storageError) throw storageError;

  const { data: { publicUrl } } = supabase.storage
    .from('project-photos')
    .getPublicUrl(path);

  const { data, error: dbError } = await supabase
    .from('project_photos')
    .insert({ project_id: projectId, url: publicUrl, caption, uploaded_by: uploadedBy })
    .select()
    .single();
  if (dbError) throw dbError;
  return data;
}

async function deletePhoto({ id, url }) {
  // Extract storage path from URL
  const path = url.split('/project-photos/')[1];
  if (path) {
    await supabase.storage.from('project-photos').remove([path]);
  }
  const { error } = await supabase.from('project_photos').delete().eq('id', id);
  if (error) throw error;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PhotoUpload({ projectId, uploadedBy }) {
  const { t, i18n } = useTranslation();
  const isRTL = ['he', 'ar'].includes(i18n.language);
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [caption, setCaption] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [lightbox, setLightbox] = useState(null);

  const queryKey = ['project_photos', projectId];

  const { data: photos = [], isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => fetchPhotos(projectId),
    enabled: !!projectId,
  });

  const uploadMutation = useMutation({
    mutationFn: (file) => uploadPhoto({ projectId, file, caption, uploadedBy }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setCaption('');
      setErrorMsg('');
    },
    onError: () => setErrorMsg(t('photos_error_upload')),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePhoto,
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    uploadMutation.mutate(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-500" />
          {t('photos_title')}
        </h2>
        <span className="text-sm text-gray-400 dark:text-slate-500">{photos.length}</span>
      </div>

      {/* Upload area */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-blue-300 dark:border-blue-700 p-5 space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          className="hidden"
          onChange={handleFileChange}
          aria-label={t('photos_select')}
        />
        <input
          type="text"
          value={caption}
          onChange={e => setCaption(e.target.value)}
          placeholder={t('photos_caption_placeholder')}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-sm text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadMutation.isPending}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
        >
          {uploadMutation.isPending ? (
            <><Loader2 className="w-4 h-4 ml-2 animate-spin" />{t('photos_uploading')}</>
          ) : (
            <><Upload className="w-4 h-4 ml-2" />{t('photos_upload')}</>
          )}
        </Button>
        {errorMsg && (
          <p className="text-sm text-red-500 text-right">{errorMsg}</p>
        )}
      </div>

      {/* Gallery */}
      {isLoading && (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        </div>
      )}

      {isError && (
        <div className="text-center py-10 text-red-500 text-sm">{t('photos_error_load')}</div>
      )}

      {!isLoading && !isError && photos.length === 0 && (
        <div className="text-center py-12 space-y-2">
          <ImageOff className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-600" />
          <p className="text-gray-500 dark:text-slate-400 font-medium">{t('photos_empty')}</p>
          <p className="text-gray-400 dark:text-slate-500 text-sm">{t('photos_empty_desc')}</p>
        </div>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map(photo => (
            <div
              key={photo.id}
              className="relative group rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-700 aspect-square cursor-pointer"
              onClick={() => setLightbox(photo)}
            >
              <img
                src={photo.url}
                alt={photo.caption || t('photos_title')}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                loading="lazy"
              />
              {/* Caption overlay */}
              {photo.caption && (
                <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs px-2 py-1 text-right truncate">
                  {photo.caption}
                </div>
              )}
              {/* Delete button */}
              <button
                aria-label={t('photos_delete')}
                onClick={e => { e.stopPropagation(); deleteMutation.mutate({ id: photo.id, url: photo.url }); }}
                disabled={deleteMutation.isPending}
                className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-opacity shadow"
              >
                {deleteMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="max-w-3xl w-full space-y-2" onClick={e => e.stopPropagation()}>
            <img
              src={lightbox.url}
              alt={lightbox.caption || ''}
              className="w-full rounded-xl max-h-[80vh] object-contain"
            />
            {lightbox.caption && (
              <p className="text-white text-sm text-right px-1">{lightbox.caption}</p>
            )}
            <Button variant="outline" onClick={() => setLightbox(null)} className="w-full text-white border-white/30 hover:bg-white/10">
              {t('close')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
