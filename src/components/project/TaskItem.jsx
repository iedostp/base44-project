import React from "react";
import { CheckCircle2, Circle, Clock, AlertCircle, Timer, Hourglass, PlayCircle, PauseCircle, Trash2 } from "lucide-react";
import CommentsPanel from "./CommentsPanel";
import { useTranslation } from "react-i18next";
import "../i18n";

export default function TaskItem({ task, onToggle, onDelete, projectId, user }) {
  const { i18n } = useTranslation();
  const isRtl = ['he', 'ar'].includes(i18n.language);
  const [optimisticDone, setOptimisticDone] = React.useState(task.done);

  React.useEffect(() => {
    setOptimisticDone(task.done);
  }, [task.done]);

  const priorityColors = {
    'גבוהה': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    'בינונית': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    'נמוכה': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
  };

  const statusConfig = {
    'טרם התחיל': { color: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400', icon: <Circle className="w-3 h-3" /> },
    'בתהליך':    { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: <PlayCircle className="w-3 h-3" /> },
    'ממתין לאישור': { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: <PauseCircle className="w-3 h-3" /> },
    'הושלם':    { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: <CheckCircle2 className="w-3 h-3" /> },
    // legacy values
    'איחור':    { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: <AlertCircle className="w-3 h-3" /> },
    'התקדמה':  { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: <Timer className="w-3 h-3" /> },
    'בהמתנה':  { color: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400', icon: <Hourglass className="w-3 h-3" /> },
    'פתוחה':   { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: null },
  };

  const isOverdue = !optimisticDone && task.due_date && new Date(task.due_date) < new Date();
  const effectiveStatus = optimisticDone ? 'הושלם' : (task.status || 'טרם התחיל');
  const statusInfo = statusConfig[effectiveStatus] || statusConfig['טרם התחיל'];

  const handleClick = (e) => {
    e.stopPropagation();
    setOptimisticDone(prev => !prev);
    onToggle();
  };

  return (
    <div dir="rtl" className="bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-600 hover:shadow-sm transition-all duration-200 p-2.5">
      <div className="flex flex-row items-start gap-2">
        {/* Text column — first child → RIGHT in RTL */}
        <div className="flex-1 min-w-0">
          {/* Clickable area: checkbox + text + badges only */}
          <div
            dir="ltr"
            className="flex flex-row-reverse items-start gap-2 cursor-pointer select-none"
            onClick={handleClick}
          >
            {optimisticDone ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            ) : (
              <Circle className="w-5 h-5 text-gray-300 flex-shrink-0 hover:text-blue-400 transition-colors mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <span className={`text-sm text-right block ${optimisticDone ? 'line-through text-gray-400 dark:text-slate-500' : 'text-gray-700 dark:text-slate-200 font-medium'} transition-all`}>
                {task.text}
              </span>
              <div className="flex flex-wrap gap-1 mt-1 justify-end">
                {task.duration && (
                  <span className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-0.5 bg-gray-50 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">
                    <Clock className="w-2.5 h-2.5" />
                    {task.duration}
                  </span>
                )}
                {task.due_date && (
                  <span className={`text-xs flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-medium ${isOverdue ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-50 text-gray-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(task.due_date).toLocaleDateString('he-IL')}
                    {task.due_time && ` ${task.due_time}`}
                  </span>
                )}
                {task.priority && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${priorityColors[task.priority] || 'bg-gray-100 text-gray-600'}`}>
                    {task.priority}
                  </span>
                )}
                {!optimisticDone && effectiveStatus && (
                  <span className={`text-xs flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                    {statusInfo.icon}
                    {effectiveStatus}
                  </span>
                )}
                {isOverdue && !optimisticDone && (
                  <span className="text-xs flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    <AlertCircle className="w-2.5 h-2.5" />
                    באיחור
                  </span>
                )}
              </div>
            </div>
          </div>
          {/* CommentsPanel outside cursor-pointer/select-none — input and text selection work correctly */}
          {projectId && user && (
            <CommentsPanel
              refType="task"
              refId={task.id}
              projectId={projectId}
              user={user}
            />
          )}
        </div>
        {/* Trash — second child → LEFT in RTL */}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task); }}
            className="flex-shrink-0 p-1 text-gray-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 transition-colors rounded mt-0.5"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}