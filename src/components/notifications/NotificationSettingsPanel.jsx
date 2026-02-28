import React, { useState, useEffect } from "react";
import { Bell, Mail, Smartphone, Save, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const Toggle = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${checked ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-slate-600 text-gray-400 dark:text-slate-400'}`}
  >
    {checked ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    )}
  </button>
);

const notifTypes = [
  {
    key: 'task_overdue',
    label: 'משימות שעברו זמנן',
    description: 'קבל התראה כאשר משימה עוברת את מועד הסיום המשוער',
  },
  {
    key: 'task_upcoming',
    label: 'משימות קרובות למועד',
    description: 'תזכורת מוקדמת לפני שמשימה מגיעה למועד הסיום',
  },
  {
    key: 'budget_alert',
    label: 'התראות תקציב',
    description: 'התראה כשניצלת 90% או יותר מהתקציב',
  },
];

export default function NotificationSettingsPanel({ user }) {
  const queryClient = useQueryClient();

  const { data: settingsList = [], isLoading } = useQuery({
    queryKey: ['notification_settings', user?.email],
    queryFn: () => base44.entities.NotificationSettings.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const existingSettings = settingsList[0];

  const [form, setForm] = useState({
    task_overdue_inapp: true,
    task_overdue_email: false,
    task_upcoming_inapp: true,
    task_upcoming_email: false,
    budget_alert_inapp: true,
    budget_alert_email: false,
    upcoming_days_ahead: 7,
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (existingSettings) {
      setForm({
        task_overdue_inapp: existingSettings.task_overdue_inapp ?? true,
        task_overdue_email: existingSettings.task_overdue_email ?? false,
        task_upcoming_inapp: existingSettings.task_upcoming_inapp ?? true,
        task_upcoming_email: existingSettings.task_upcoming_email ?? false,
        budget_alert_inapp: existingSettings.budget_alert_inapp ?? true,
        budget_alert_email: existingSettings.budget_alert_email ?? false,
        upcoming_days_ahead: existingSettings.upcoming_days_ahead ?? 7,
      });
    }
  }, [existingSettings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = { ...form, user_email: user.email };
      if (existingSettings?.id) {
        return base44.entities.NotificationSettings.update(existingSettings.id, data);
      } else {
        return base44.entities.NotificationSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification_settings'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  if (isLoading) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-xl flex-shrink-0">
          <Bell className="w-6 h-6 text-blue-600 dark:text-blue-300" />
        </div>
        <div className="text-start flex-1">
          <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">הגדרות התראות</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">התאם אישית את סוג ואופן ההתראות שלך</p>
        </div>
      </div>

      {/* Channel legend */}
      <div className="flex items-center justify-start gap-6 mb-4 text-xs text-gray-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5" />
          דוא"ל
        </div>
        <div className="flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5" />
          באפליקציה
        </div>
      </div>

      <div className="space-y-3">
        {notifTypes.map(({ key, label, description }) => (
          <div key={key} className="bg-gray-50 dark:bg-slate-700/50 rounded-xl px-4 py-3 border border-gray-100 dark:border-slate-600">
            <div className="flex items-center gap-3 justify-end">
              <div className="flex-1 text-start">
                <p className="font-semibold text-gray-800 dark:text-slate-100 text-sm">{label}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">{description}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 flex-row">
                <Toggle
                  checked={form[`${key}_inapp`]}
                  onChange={(v) => setForm(f => ({ ...f, [`${key}_inapp`]: v }))}
                />
                <Smartphone className="w-3.5 h-3.5 text-gray-400 dark:text-slate-400" />
                <Toggle
                  checked={form[`${key}_email`]}
                  onChange={(v) => setForm(f => ({ ...f, [`${key}_email`]: v }))}
                />
                <Mail className="w-3.5 h-3.5 text-gray-400 dark:text-slate-400" />
              </div>
            </div>
          </div>
        ))}

        {/* Days ahead setting */}
        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl px-4 py-3 border border-gray-100 dark:border-slate-600">
          <div className="flex items-center gap-3 justify-end">
            <div className="flex-1 text-start">
              <p className="font-semibold text-gray-800 dark:text-slate-100 text-sm">תזכורת מוקדמת</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">כמה ימים לפני המועד לשלוח תזכורת</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 flex-row">
              <select
                value={form.upcoming_days_ahead}
                onChange={e => setForm(f => ({ ...f, upcoming_days_ahead: parseInt(e.target.value) }))}
                className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500"
              >
                {[1, 3, 5, 7, 14, 30].map(d => (
                  <option key={d} value={d}>{d} ימים</option>
                ))}
              </select>
              <span className="text-sm text-gray-500 dark:text-slate-300">ימים מראש:</span>
            </div>
          </div>
        </div>
      </div>

      <Button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className={`w-full mt-6 ${saved ? 'bg-green-500 hover:bg-green-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'} text-white shadow-md transition-all`}
      >
        {saved ? '✓ נשמר בהצלחה' : (
          <>
            <Save className="w-4 h-4 me-2" />
            שמור הגדרות
          </>
        )}
      </Button>
    </div>
  );
}