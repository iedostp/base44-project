import React, { useState, useEffect } from "react";
import {
  CalendarDays, Loader2, RefreshCw, Plus, X, ExternalLink,
  AlertCircle, WifiOff, Trash2, CheckCircle2, Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";

// ── Quick Event Creator ────────────────────────────────────────────────────
function QuickEventForm({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
    allDay: true,
    colorId: "1",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const COLOR_OPTIONS = [
    { id: "1", label: "כחול", color: "bg-blue-500" },
    { id: "2", label: "ירוק", color: "bg-green-500" },
    { id: "5", label: "צהוב", color: "bg-yellow-400" },
    { id: "11", label: "אדום", color: "bg-red-500" },
    { id: "9", label: "כחול כהה", color: "bg-indigo-600" },
    { id: "6", label: "כתום", color: "bg-orange-500" },
  ];

  const handleCreate = async () => {
    if (!form.title.trim()) { setError("נא להזין כותרת לאירוע"); return; }
    setLoading(true); setError(null);
    try {
      const res = await base44.functions.invoke('createCalendarEvent', form);
      if (res.data.error) throw new Error(res.data.error);
      onCreated(res.data);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-slate-700">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
          <h3 className="font-bold text-gray-800 dark:text-slate-100">יצירת אירוע ביומן</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">כותרת האירוע *</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="לדוגמה: ישיבת תיאום עם קבלן"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500"
             
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">תיאור (אופציונלי)</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="פרטים נוספים..."
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 resize-none"
             
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">תאריך התחלה</label>
              <input type="date" value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value, endDate: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">תאריך סיום</label>
              <input type="date" value={form.endDate} min={form.startDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">צבע האירוע</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map(c => (
                <button key={c.id} onClick={() => setForm(f => ({ ...f, colorId: c.id }))}
                  className={`w-8 h-8 rounded-full ${c.color} flex items-center justify-center transition-transform ${form.colorId === c.id ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : 'hover:scale-110'}`} title={c.label}>
                  {form.colorId === c.id && <Check className="w-3 h-3 text-white" />}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-600 text-start">{error}</p>}
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <Button onClick={onClose} variant="outline" className="flex-1">ביטול</Button>
          <Button onClick={handleCreate} disabled={loading} className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 me-1" />צור אירוע</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────────────────
export default function CalendarSyncPanel({ user, project }) {
  const [settings, setSettings] = useState(null);
  const [settingsId, setSettingsId] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [showQuickEvent, setShowQuickEvent] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  useEffect(() => {
    if (!user?.email || !project?.id) return;
    loadSettings();
  }, [user?.email, project?.id]);

  // Auto-sync on load if enabled
  useEffect(() => {
    if (enabled && settings?.auto_sync && project?.id) {
      // Only auto-sync if last sync was more than 30 min ago
      const lastSync = settings?.last_synced ? new Date(settings.last_synced) : null;
      const now = new Date();
      const diffMinutes = lastSync ? (now - lastSync) / 60000 : Infinity;
      if (diffMinutes > 30) {
        handleSync(true);
      }
    }
  }, [enabled]);

  const loadSettings = async () => {
    setLoadingSettings(true);
    try {
      const results = await base44.entities.CalendarSettings.filter({ project_id: project.id });
      if (results.length) {
        const s = results[0];
        setSettings(s);
        setSettingsId(s.id);
        setEnabled(s.enabled ?? false);
      }
    } catch (e) { /* ignore */ }
    finally { setLoadingSettings(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { user_email: user.email, project_id: project.id, enabled, sync_mode: 'one_way_to_gcal', auto_sync: true };
      if (settingsId) {
        await base44.entities.CalendarSettings.update(settingsId, data);
      } else {
        const created = await base44.entities.CalendarSettings.create(data);
        setSettingsId(created.id);
      }
      setSettings({ ...settings, ...data });
      if (enabled) {
        await handleSync(true);
      }
    } catch (e) {
      alert('שגיאה בשמירה: ' + e.message);
    } finally { setSaving(false); }
  };

  const handleDisconnect = async () => {
    setSaving(true);
    try {
      if (settingsId) {
        await base44.entities.CalendarSettings.update(settingsId, { enabled: false });
      }
      setEnabled(false);
      setSettings(s => ({ ...s, enabled: false }));
      setShowDisconnectConfirm(false);
      setSyncResult(null);
    } catch (e) { alert('שגיאה: ' + e.message); }
    finally { setSaving(false); }
  };

  const handleSync = async (silent = false) => {
    setSyncing(true);
    if (!silent) setSyncResult(null);
    try {
      const res = await base44.functions.invoke('syncToGoogleCalendar', {
        action: 'sync',
        projectId: project?.id,
        syncMode: 'one_way_to_gcal',
      });
      if (res.data.error) throw new Error(res.data.error);
      if (!silent) setSyncResult({ success: true, ...res.data });
      // Update last_synced locally
      setSettings(s => ({ ...s, last_synced: new Date().toISOString() }));
    } catch (e) {
      if (!silent) setSyncResult({ success: false, error: e.message });
    } finally { setSyncing(false); }
  };

  if (!project?.id) return null;

  if (loadingSettings) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <>
      {showQuickEvent && (
        <QuickEventForm onClose={() => setShowQuickEvent(false)}
          onCreated={(data) => { setShowQuickEvent(false); setSyncResult({ success: true, quickEvent: true, htmlLink: data.htmlLink }); }} />
      )}

      {showDisconnectConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 border border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-xl"><Trash2 className="w-5 h-5 text-red-600" /></div>
              <h3 className="font-bold text-gray-800 dark:text-slate-100">ביטול סנכרון</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-400">האם לבטל את הסנכרון עם Google Calendar? הארועים שכבר ביומן לא יימחקו.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowDisconnectConfirm(false)}>ביטול</Button>
              <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={handleDisconnect} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'כן, בטל סנכרון'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-700 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/50 p-2.5 rounded-xl">
              <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-gray-800 dark:text-slate-100">Google Calendar</h2>
                {enabled && (
                  <span className="flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                    <CheckCircle2 className="w-3 h-3" /> מחובר
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {settings?.last_synced
                  ? `סנכרון אחרון: ${format(new Date(settings.last_synced), 'dd/MM/yyyy HH:mm')}`
                  : 'לא סונכרן עדיין'}
              </p>
            </div>
          </div>
          <Button size="sm" onClick={() => setShowQuickEvent(true)} className="bg-blue-500 hover:bg-blue-600 text-white text-xs gap-1">
            <Plus className="w-3.5 h-3.5" />אירוע חדש
          </Button>
        </div>

        <div className="p-5 space-y-5">

          {/* Connection Setup */}
          {!enabled ? (
            /* Not connected - setup panel */
            <div className="space-y-5">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-700 rounded-2xl p-5 text-start border border-blue-100 dark:border-slate-600">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-xl">
                    <Upload className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                  </div>
                  <p className="font-semibold text-gray-800 dark:text-slate-100">חבר את Google Calendar</p>
                </div>
                <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed">
                  כל השלבים והמשימות שלך יסונכרנו אוטומטית מהאפליקציה ל-Google Calendar שלך.
                  האירועים יתעדכנו כשתבצע שינויים.
                </p>
              </div>

              <Button
                onClick={() => { setEnabled(true); handleSave(); }}
                disabled={saving}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white h-11 font-semibold"
              >
                {saving ? <><Loader2 className="w-4 h-4 me-2 animate-spin" />מחבר...</> : <><CalendarDays className="w-4 h-4 me-2" />חבר ל-Google Calendar</>}
              </Button>
            </div>
          ) : (
            /* Connected - sync panel */
            <div className="space-y-4">
              {/* Status card */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800 text-start">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <p className="text-sm font-semibold text-green-800 dark:text-green-300">הסנכרון פעיל</p>
                </div>
                <p className="text-xs text-green-700 dark:text-green-400">
                  אפליקציה → Google Calendar
                  {settings?.last_synced && ` · סונכרן לאחרונה ${format(new Date(settings.last_synced), 'dd/MM HH:mm')}`}
                </p>
              </div>

              {/* Manual sync button */}
              <Button
                onClick={() => handleSync(false)}
                disabled={syncing}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white h-11 font-semibold"
              >
                {syncing
                  ? <><Loader2 className="w-5 h-5 me-2 animate-spin" />מסנכרן...</>
                  : <><RefreshCw className="w-5 h-5 me-2" />סנכרן עכשיו</>
                }
              </Button>

              {/* Sync result */}
              {syncResult && (
                <div className={`p-3 rounded-xl text-sm text-start border ${
                  syncResult.success
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                }`}>
                  {syncResult.success ? (
                    syncResult.quickEvent ? (
                      <div className="flex items-center justify-between">
                        <p className="font-medium">✓ האירוע נוצר בהצלחה!</p>
                        {syncResult.htmlLink && (
                          <a href={syncResult.htmlLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-green-600 hover:underline">
                            <ExternalLink className="w-3 h-3" />פתח ביומן
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <p className="font-medium">✓ הסנכרון הושלם!</p>
                        <p className="text-xs">
                          {syncResult.created > 0 && `${syncResult.created} נוצרו · `}
                          {syncResult.updated > 0 && `${syncResult.updated} עודכנו · `}
                          {syncResult.updatedInApp > 0 && `${syncResult.updatedInApp} עודכנו באפליקציה`}
                          {syncResult.created === 0 && syncResult.updated === 0 && !syncResult.updatedInApp && 'הכל מסונכרן'}
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p>שגיאה: {syncResult.error}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Disconnect */}
              <button
                onClick={() => setShowDisconnectConfirm(true)}
                className="w-full flex items-center justify-center gap-2 text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 py-1 transition-colors"
              >
                <WifiOff className="w-3.5 h-3.5" />
                בטל סנכרון עם Google Calendar
              </button>
            </div>
          )}

          {/* Outlook note */}
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-start">
            <p className="text-xs text-amber-700 dark:text-amber-300 font-medium mb-1">📌 Outlook Calendar</p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              לסנכרון עם Outlook: לאחר הסנכרון ל-Google, פתח Outlook → הגדרות → הוסף יומן → Google Calendar.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}