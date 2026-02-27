import React, { useEffect, useRef, useState } from "react";
import { Bell, Check, CheckCheck, AlertTriangle, Clock, DollarSign, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const typeConfig = {
  task_overdue: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20", label: "באיחור" },
  task_upcoming: { icon: Clock, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20", label: "קרוב" },
  budget_alert: { icon: DollarSign, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20", label: "תקציב" },
  stage_alert: { icon: AlertTriangle, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20", label: "שלב" },
};

export default function NotificationBell({ user, project }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter({ user_email: user.email }, '-created_date', 50),
    enabled: !!user?.email,
    refetchInterval: 60000,
  });

  const unread = notifications.filter(n => !n.read);

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      for (const n of unread) {
        await base44.entities.Notification.update(n.id, { read: true });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  // Generate notifications on mount (both regular + AI-based)
  useEffect(() => {
    if (user?.email && project?.id) {
      base44.functions.invoke('generateNotifications', {});
      base44.functions.invoke('generateAINotifications', {});
    }
  }, [user?.email, project?.id]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        aria-label="התראות"
      >
        <Bell className="w-6 h-6 text-gray-600 dark:text-slate-300" />
        {unread.length > 0 && (
          <span className="absolute top-1 end-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 top-12 w-96 max-w-[90vw] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
            <h3 className="font-bold text-gray-800 dark:text-slate-100">התראות</h3>
            <div className="flex items-center gap-2">
              {unread.length > 0 && (
                <button
                  onClick={() => markAllReadMutation.mutate()}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" />
                  סמן הכל כנקרא
                </button>
              )}
            </div>
          </div>

          {/* Notifications list */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-10 text-gray-400 dark:text-slate-500">
                <Bell className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">אין התראות חדשות</p>
              </div>
            ) : (
              notifications.map(notif => {
                const cfg = typeConfig[notif.type] || typeConfig.task_upcoming;
                const Icon = cfg.icon;
                return (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 p-4 border-b border-gray-50 dark:border-slate-700 ${!notif.read ? cfg.bg : ''} hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors`}
                  >
                    <div className={`p-2 rounded-lg ${cfg.bg} flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold ${!notif.read ? 'text-gray-900 dark:text-slate-100' : 'text-gray-600 dark:text-slate-400'}`}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 leading-relaxed">{notif.message}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[11px] text-gray-400 dark:text-slate-500">{notif.notification_date}</span>
                        {!notif.read && (
                          <button
                            onClick={() => markReadMutation.mutate(notif.id)}
                            className="text-[11px] text-blue-500 hover:underline flex items-center gap-0.5"
                          >
                            <Check className="w-3 h-3" /> נקרא
                          </button>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteNotificationMutation.mutate(notif.id)}
                      className="text-gray-300 dark:text-slate-600 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}