import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const parseDurationDays = (duration) => {
  if (!duration) return 30;
  const monthMatch = duration.match(/(\d+)(?:-(\d+))?\s*חודש/);
  if (monthMatch) {
    const avg = monthMatch[2] ? (parseInt(monthMatch[1]) + parseInt(monthMatch[2])) / 2 : parseInt(monthMatch[1]);
    return Math.round(avg * 30);
  }
  const weekMatch = duration.match(/(\d+)(?:-(\d+))?\s*שבוע/);
  if (weekMatch) {
    const avg = weekMatch[2] ? (parseInt(weekMatch[1]) + parseInt(weekMatch[2])) / 2 : parseInt(weekMatch[1]);
    return Math.round(avg * 7);
  }
  return 30;
};

const addDays = (date, days) => { const d = new Date(date); d.setDate(d.getDate() + days); return d; };
const formatDate = (date) => date.toISOString().split('T')[0];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action = 'sync', projectId, syncMode = 'two_way' } = body;

    // Get Google Calendar access token
    let accessToken;
    try {
      accessToken = await base44.asServiceRole.connectors.getAccessToken('googlecalendar');
    } catch (e) {
      return Response.json({ error: 'לא מחובר ל-Google Calendar. אנא חבר את החשבון בהגדרות.' }, { status: 401 });
    }

    if (!accessToken) {
      return Response.json({ error: 'לא מחובר ל-Google Calendar. אנא חבר את החשבון בהגדרות.' }, { status: 401 });
    }

    const gcalBase = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
    const authHeaders = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    const gcalFetch = async (url, options = {}) => {
      const res = await fetch(url, { ...options, headers: authHeaders });
      if (res.status === 204) return null;
      if (res.status === 404) return null;
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Google Calendar API error ${res.status}: ${text}`);
      }
      return res.json();
    };

    const projects = await base44.entities.Project.filter({ created_by: user.email });
    if (!projects.length) return Response.json({ error: 'לא נמצא פרויקט' }, { status: 404 });
    const project = projectId ? (projects.find(p => p.id === projectId) || projects[0]) : projects[0];

    const [stages, tasks] = await Promise.all([
      base44.asServiceRole.entities.Stage.filter({ project_id: project.id }),
      base44.asServiceRole.entities.Task.filter({ created_by: user.email }),
    ]);

    // Build stage dates sequentially
    let runningDate = project.start_date ? new Date(project.start_date) : new Date();
    const stagesWithDates = [...stages]
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(stage => {
        const startDate = new Date(runningDate);
        const durationDays = parseDurationDays(stage.duration);
        const endDate = addDays(startDate, durationDays);
        runningDate = new Date(endDate);
        return { ...stage, startDate, endDate };
      });

    // ── SYNC (one-way or two-way) ─────────────────────────────────────────────
    if (action === 'sync') {
      const stats = { created: 0, updated: 0, updatedInApp: 0, errors: [] };

      // Fetch existing GCal events for this project
      const timeMin = new Date(); timeMin.setFullYear(timeMin.getFullYear() - 1);
      const timeMax = new Date(); timeMax.setFullYear(timeMax.getFullYear() + 3);
      const searchUrl = `${gcalBase}?q=${encodeURIComponent(project.name)}&timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}&singleEvents=true&maxResults=500`;
      const gcalData = await gcalFetch(searchUrl);
      const gcalEvents = gcalData?.items || [];
      const gcalEventMap = {};
      for (const ev of gcalEvents) gcalEventMap[ev.id] = ev;

      // ── Sync Stages ──
      for (const stage of stagesWithDates) {
        try {
          const eventBody = {
            summary: `🏗️ ${stage.title} — ${project.name}`,
            description: `שלב בפרויקט: ${project.name}\nמשך: ${stage.duration || 'לא מוגדר'}\nעדיפות: ${stage.priority || 'לא מוגדרת'}\nסטטוס: ${stage.completed ? 'הושלם ✅' : 'בתהליך'}`,
            start: { date: formatDate(stage.startDate) },
            end: { date: formatDate(addDays(stage.endDate, 1)) },
            colorId: stage.priority === 'גבוהה' ? '11' : stage.priority === 'בינונית' ? '5' : '9',
            reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 7 * 24 * 60 }, { method: 'popup', minutes: 24 * 60 }] },
          };

          if (stage.google_event_id && gcalEventMap[stage.google_event_id]) {
            const gcalEv = gcalEventMap[stage.google_event_id];

            if (syncMode === 'two_way') {
              const gcalUpdated = new Date(gcalEv.updated);
              const appUpdated = new Date(stage.updated_date || 0);

              if (gcalUpdated > appUpdated) {
                // GCal is newer → update app
                const gcalTitle = gcalEv.summary?.replace(/^🏗️\s+/, '').replace(/\s+—.*$/, '').trim();
                if (gcalTitle && gcalTitle !== stage.title) {
                  await base44.asServiceRole.entities.Stage.update(stage.id, { title: gcalTitle });
                  stats.updatedInApp++;
                }
              } else {
                // App is newer → update GCal
                await gcalFetch(`${gcalBase}/${stage.google_event_id}`, { method: 'PUT', body: JSON.stringify(eventBody) });
                stats.updated++;
              }
            } else {
              // One-way: always push app → GCal
              await gcalFetch(`${gcalBase}/${stage.google_event_id}`, { method: 'PUT', body: JSON.stringify(eventBody) });
              stats.updated++;
            }
          } else {
            // Create new event in GCal
            const result = await gcalFetch(gcalBase, { method: 'POST', body: JSON.stringify(eventBody) });
            if (result?.id) {
              await base44.asServiceRole.entities.Stage.update(stage.id, { google_event_id: result.id });
              stats.created++;
            }
          }
        } catch (e) {
          stats.errors.push(`שלב "${stage.title}": ${e.message}`);
        }
      }

      // ── Sync Tasks ──
      for (const stage of stagesWithDates) {
        const stageTasks = tasks.filter(t => t.stage_id === stage.id);
        for (const task of stageTasks) {
          try {
            const taskEventBody = {
              summary: `✅ ${task.text} — ${stage.title}`,
              description: `משימה בשלב: ${stage.title}\nפרויקט: ${project.name}\nעדיפות: ${task.priority || 'לא מוגדרת'}\nסטטוס: ${task.done ? 'הושלמה ✅' : 'פתוחה'}`,
              start: { date: formatDate(stage.endDate) },
              end: { date: formatDate(addDays(stage.endDate, 1)) },
              colorId: task.priority === 'גבוהה' ? '11' : task.priority === 'בינונית' ? '5' : '9',
              reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 24 * 60 }] },
            };

            if (task.google_event_id && gcalEventMap[task.google_event_id]) {
              const gcalEv = gcalEventMap[task.google_event_id];

              if (syncMode === 'two_way') {
                const gcalUpdated = new Date(gcalEv.updated);
                const appUpdated = new Date(task.updated_date || 0);

                if (gcalUpdated > appUpdated) {
                  const isDoneInGcal = gcalEv.description?.includes('הושלמה ✅');
                  if (isDoneInGcal !== undefined && isDoneInGcal !== task.done) {
                    await base44.asServiceRole.entities.Task.update(task.id, { done: isDoneInGcal });
                    stats.updatedInApp++;
                  }
                } else {
                  await gcalFetch(`${gcalBase}/${task.google_event_id}`, { method: 'PUT', body: JSON.stringify(taskEventBody) });
                  stats.updated++;
                }
              } else {
                await gcalFetch(`${gcalBase}/${task.google_event_id}`, { method: 'PUT', body: JSON.stringify(taskEventBody) });
                stats.updated++;
              }
            } else {
              const result = await gcalFetch(gcalBase, { method: 'POST', body: JSON.stringify(taskEventBody) });
              if (result?.id) {
                await base44.asServiceRole.entities.Task.update(task.id, { google_event_id: result.id });
                stats.created++;
              }
            }
          } catch (e) {
            stats.errors.push(`משימה "${task.text}": ${e.message}`);
          }
        }
      }

      // Update last_synced in CalendarSettings
      try {
        const settings = await base44.asServiceRole.entities.CalendarSettings.filter({ user_email: user.email, project_id: project.id });
        if (settings.length) {
          await base44.asServiceRole.entities.CalendarSettings.update(settings[0].id, { last_synced: new Date().toISOString() });
        }
      } catch (e) { /* ignore */ }

      return Response.json({ action: 'sync', ...stats, total: stats.created + stats.updated + stats.updatedInApp });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});