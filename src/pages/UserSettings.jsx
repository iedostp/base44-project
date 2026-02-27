import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/settings/LanguageSwitcher";
import AppearanceSettings from "@/components/settings/AppearanceSettings";
import {
  User, Bell, Sun, Moon, Mail, Smartphone, Save, LogOut,
  ChevronRight, Check, Shield, Clock, AlertTriangle, Trash2, Loader2, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";


// ── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? "bg-blue-500" : "bg-gray-200 dark:bg-slate-600"
      }`}
    >
      <span className={`inline-block w-4 h-4 mt-1 rounded-full bg-white shadow transition-transform duration-200 ${
        checked ? "translate-x-6 mr-0.5" : "translate-x-1"
      }`} />
    </button>
  );
}

// ── Section card ─────────────────────────────────────────────────────────────
function Section({ icon, color, title, subtitle, children }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-gray-100 dark:border-slate-700 overflow-hidden">
      <div className={`flex items-center gap-3 p-5 border-b border-gray-100 dark:border-slate-700`} dir="rtl">
        <div className={`${color} p-2.5 rounded-xl flex-shrink-0`}>{icon}</div>
        <div className="text-right">
          <h2 className="font-bold text-gray-800 dark:text-slate-100">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

const NOTIF_TYPES = [
  {
    key: "task_overdue",
    label: "משימות שעברו זמנן",
    desc: "כשמשימה עוברת את מועד הסיום המשוער",
    icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
  },
  {
    key: "task_upcoming",
    label: "משימות קרובות למועד",
    desc: "תזכורת מוקדמת לפני מועד הסיום",
    icon: <Clock className="w-4 h-4 text-blue-500" />,
  },
  {
    key: "budget_alert",
    label: "התראות תקציב",
    desc: "כשניצלת 75% או יותר מהתקציב",
    icon: <Shield className="w-4 h-4 text-orange-500" />,
  },
];

export default function UserSettings() {
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: settingsList = [] } = useQuery({
    queryKey: ["notification_settings", user?.email],
    queryFn: () => base44.entities.NotificationSettings.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const existingSettings = settingsList[0];

  // ── Profile form ───────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({ phone: "", job_title: "" });

  useEffect(() => {
    if (user) {
      setProfile({
        phone: user.phone || "",
        job_title: user.job_title || "",
      });
    }
  }, [user]);

  // ── Notification form ──────────────────────────────────────────────────────
  const defaultNotif = {
    task_overdue_inapp: true,
    task_overdue_email: false,
    task_upcoming_inapp: true,
    task_upcoming_email: false,
    budget_alert_inapp: true,
    budget_alert_email: false,
    upcoming_days_ahead: 7,
  };

  const [notif, setNotif] = useState(defaultNotif);

  useEffect(() => {
    if (existingSettings) {
      setNotif({
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

  // ── Mutations ──────────────────────────────────────────────────────────────
  const saveProfileMutation = useMutation({
    mutationFn: () => base44.auth.updateMe(profile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    },
  });

  const saveNotifMutation = useMutation({
    mutationFn: async () => {
      const data = { ...notif, user_email: user.email };
      if (existingSettings?.id) {
        return base44.entities.NotificationSettings.update(existingSettings.id, data);
      }
      return base44.entities.NotificationSettings.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification_settings"] });
      setNotifSaved(true);
      setTimeout(() => setNotifSaved(false), 2500);
    },
  });

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      alert("חשבונך נמחק בהצלחה. כל הנתונים שלך הוסרו מהמערכת.");
      base44.auth.logout();
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 md:p-8 pb-24 md:pb-8" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Page Title */}
        <div className="text-right">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">הגדרות משתמש</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">ניהול פרופיל, התראות ועיצוב</p>
        </div>

        {/* ── Profile ─────────────────────────────────────────────────────── */}
        <Section
          icon={<User className="w-5 h-5 text-blue-600 dark:text-blue-300" />}
          color="bg-blue-100 dark:bg-blue-900/50"
          title="פרטי פרופיל"
          subtitle="פרטים אישיים וצרכי קשר"
        >
          <div className="space-y-4">
            {/* Read-only fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3 border border-gray-100 dark:border-slate-600 text-right">
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">שם מלא</p>
                <p className="font-semibold text-gray-800 dark:text-slate-100 text-sm">{user.full_name || "לא זמין"}</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3 border border-gray-100 dark:border-slate-600 text-right">
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">כתובת אימייל</p>
                <p className="font-semibold text-gray-800 dark:text-slate-100 text-sm truncate">{user.email}</p>
              </div>
            </div>

            {/* Editable fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="text-right">
                <label htmlFor="phone-input" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">טלפון</label>
                <input
                  id="phone-input"
                  name="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                  placeholder="050-0000000"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  dir="rtl"
                />
              </div>
              <div className="text-right">
                <label htmlFor="job-input" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">תפקיד</label>
                <input
                  id="job-input"
                  name="job_title"
                  type="text"
                  value={profile.job_title}
                  onChange={e => setProfile(p => ({ ...p, job_title: e.target.value }))}
                  placeholder="לדוגמה: בעל בית / קבלן"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                onClick={() => saveProfileMutation.mutate()}
                disabled={saveProfileMutation.isPending}
                className={`flex-1 transition-all ${profileSaved ? "bg-green-500 hover:bg-green-600" : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"} text-white`}
              >
                {profileSaved ? (
                  <><Check className="w-4 h-4 ml-1.5" /> נשמר</>
                ) : saveProfileMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <><Save className="w-4 h-4 ml-1.5" /> שמור פרופיל</>
                )}
              </Button>
              <Button variant="outline" onClick={() => base44.auth.logout()} className="select-none">
                <LogOut className="w-4 h-4 ml-1.5" />
                התנתק
              </Button>
            </div>
          </div>
        </Section>

        {/* ── Notifications ─────────────────────────────────────────────── */}
        <Section
          icon={<Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />}
          color="bg-indigo-100 dark:bg-indigo-900/50"
          title="הגדרות התראות"
          subtitle="בחר כיצד ומתי לקבל התראות"
        >
          {/* Channel headers */}
          <div className="flex items-center justify-end gap-6 mb-3 text-xs text-gray-500 dark:text-slate-400" dir="rtl">
            <div className="flex items-center gap-1">
              <span>דוא״ל</span>
              <Mail className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-1">
              <span>באפליקציה</span>
              <Smartphone className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-3">
            {NOTIF_TYPES.map(({ key, label, desc, icon }) => (
              <div key={key} className="flex items-center gap-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl px-4 py-3 border border-gray-100 dark:border-slate-600" dir="rtl">
                <div className="flex items-center gap-1.5 flex-1 min-w-0 text-right">
                  {icon}
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-slate-100">{label}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <Toggle
                    checked={notif[`${key}_inapp`]}
                    onChange={v => setNotif(n => ({ ...n, [`${key}_inapp`]: v }))}
                  />
                  <Toggle
                    checked={notif[`${key}_email`]}
                    onChange={v => setNotif(n => ({ ...n, [`${key}_email`]: v }))}
                  />
                </div>
              </div>
            ))}

            {/* Days ahead */}
            <div className="flex items-center gap-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl px-4 py-3 border border-gray-100 dark:border-slate-600" dir="rtl">
              <div className="flex items-center gap-1.5 flex-1 text-right">
                <Clock className="w-4 h-4 text-gray-400" />
                <label htmlFor="days-ahead-select" className="cursor-pointer flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-slate-100">תזכורת מוקדמת</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">כמה ימים לפני המועד</p>
                </label>
              </div>
              <select
                id="days-ahead-select"
                name="upcoming_days_ahead"
                value={notif.upcoming_days_ahead}
                onChange={e => setNotif(n => ({ ...n, upcoming_days_ahead: parseInt(e.target.value) }))}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500"
              >
                {[1, 3, 5, 7, 14, 30].map(d => (
                  <option key={d} value={d}>{d} ימים</option>
                ))}
              </select>
            </div>
          </div>

          <Button
            onClick={() => saveNotifMutation.mutate()}
            disabled={saveNotifMutation.isPending}
            className={`w-full mt-4 transition-all ${notifSaved ? "bg-green-500 hover:bg-green-600" : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"} text-white`}
          >
            {notifSaved ? (
              <><Check className="w-4 h-4 ml-1.5" /> נשמר בהצלחה</>
            ) : saveNotifMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <><Save className="w-4 h-4 ml-1.5" /> שמור הגדרות התראות</>
            )}
          </Button>
        </Section>

        {/* ── Theme & Appearance ───────────────────────────────────────────────────────── */}
        {mounted && <AppearanceSettings />}

        {/* ── Language ────────────────────────────────────────────────────────── */}
        <Section
          icon={<Globe className="w-5 h-5 text-blue-600 dark:text-blue-300" />}
          color="bg-blue-100 dark:bg-blue-900/50"
          title="בחירת שפה"
          subtitle="בחר את השפה המועדפת שלך"
        >
          {mounted && <LanguageSwitcher />}
        </Section>

        {/* ── Danger Zone ───────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border-2 border-red-200 dark:border-red-900 overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-red-100 dark:border-red-900/50" dir="rtl">
            <div className="bg-red-100 dark:bg-red-900/50 p-2.5 rounded-xl flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-right">
              <h2 className="font-bold text-red-800 dark:text-red-300">אזור מסוכן</h2>
              <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">פעולות בלתי הפיכות</p>
            </div>
          </div>
          <div className="p-5" dir="rtl">
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-4 text-right leading-relaxed">
              מחיקת חשבון תסיר לצמיתות את כל הנתונים שלך, כולל פרויקטים, שלבים, משימות, ספקים, מסמכים והוצאות.
            </p>
            <Button
              variant="destructive"
              className="w-full select-none"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4 ml-2" />
              מחק את החשבון שלי לצמיתות
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="dark:bg-slate-800 dark:border-slate-700" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex flex-row-reverse items-center gap-2 text-red-600 dark:text-red-400 text-right">
              <AlertTriangle className="w-5 h-5" />
              אישור מחיקת חשבון
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-slate-300 text-right">
              האם אתה בטוח? פעולה זו תמחק לצמיתות את כל הנתונים שלך ולא ניתן יהיה לשחזר אותם.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4 my-2 text-right border border-red-200 dark:border-red-900">
            <p className="text-sm text-red-800 dark:text-red-300 font-semibold">⚠️ זוהי אזהרה אחרונה!</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>ביטול</Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "כן, מחק את החשבון שלי"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}