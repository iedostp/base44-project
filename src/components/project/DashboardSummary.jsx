import React from "react";
import { TrendingUp, DollarSign, Calendar, CheckSquare, AlertCircle, Clock, Target } from "lucide-react";
import { useTranslation } from "react-i18next";
import "../i18n";
import { formatCurrency, getCurrencySymbol } from "../utils/currencyFormatter";

const formatAmount = (v, lang) => formatCurrency(v || 0, lang);

export default function DashboardSummary({ project, stages, tasks, expenses }) {
  const { t, i18n } = useTranslation();
  const isRTL = ['he', 'ar'].includes(i18n.language);
  const locale = i18n.language === 'he' ? 'he-IL' : i18n.language === 'ar' ? 'ar-SA' : i18n.language === 'ru' ? 'ru-RU' : 'en-US';
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.done).length;
  const progressPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const totalBudget = project?.total_budget || 0;
  // Use actual expenses if they exist, otherwise estimate from completed stages
  const actualExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const estimatedFromStages = stages
    .filter(s => s.completed)
    .reduce((acc, s) => acc + (totalBudget * (parseFloat(s.budget_percentage) || 0) / 100), 0);
  const totalSpent = actualExpenses > 0 ? actualExpenses : estimatedFromStages;
  const isEstimated = actualExpenses === 0 && estimatedFromStages > 0;
  const budgetPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const remaining = totalBudget - totalSpent;

  const completedStages = stages.filter(s => s.completed).length;
  const totalStages = stages.length;

  const overdueTasks = tasks.filter(t => !t.done && t.due_date && new Date(t.due_date) < new Date()).length;

  // Estimate end date based on start date + sum of stage durations
  const getEstimatedEnd = () => {
    if (!project?.start_date) return null;
    let totalWeeks = 0;
    stages.forEach(s => {
      const match = s.duration?.match(/(\d+)/);
      if (match) totalWeeks += parseInt(match[1]);
    });
    if (!totalWeeks) return null;
    const end = new Date(project.start_date);
    end.setDate(end.getDate() + totalWeeks * 7);
    return end;
  };
  const estimatedEnd = getEstimatedEnd();

  const cards = [
    {
      label: t('overallProgress'),
      value: `${progressPct}%`,
      sub: `${doneTasks} ${t('tasksOf')} ${totalTasks} ${t('tasks')}`,
      icon: <Target className="w-5 h-5" />,
      color: "from-blue-500 to-indigo-600",
      bar: progressPct,
      barColor: "bg-blue-200",
      barFill: "bg-blue-500",
    },
    {
      label: t('stagesCompleted'),
      value: `${completedStages}/${totalStages}`,
      sub: totalStages > 0 ? `${Math.round((completedStages / totalStages) * 100)}% ${t('ofProject')}` : t('noStages'),
      icon: <CheckSquare className="w-5 h-5" />,
      color: "from-purple-500 to-violet-600",
      bar: totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0,
      barColor: "bg-purple-100",
      barFill: "bg-purple-500",
    },
    {
      label: t('budgetUsed'),
      value: formatAmount(totalSpent, i18n.language),
      sub: isEstimated ? `${budgetPct}% (${t('estimatedByStages')})` : `${budgetPct}% ${t('tasksOf')} ${formatAmount(totalBudget, i18n.language)}`,
      icon: <span className="text-base font-bold leading-none">{getCurrencySymbol(i18n.language)}</span>,
      color: budgetPct > 90 ? "from-red-500 to-pink-600" : budgetPct > 70 ? "from-amber-500 to-orange-600" : "from-emerald-500 to-green-600",
      bar: Math.min(budgetPct, 100),
      barColor: "bg-emerald-100",
      barFill: budgetPct > 90 ? "bg-red-500" : budgetPct > 70 ? "bg-amber-500" : "bg-emerald-500",
    },
    {
      label: t('budgetRemaining'),
      value: formatAmount(remaining, i18n.language),
      sub: remaining >= 0 ? t('availableBalance') : t('budgetOverrun'),
      icon: <TrendingUp className="w-5 h-5" />,
      color: remaining >= 0 ? "from-teal-500 to-cyan-600" : "from-red-500 to-pink-600",
      bar: null,
    },
  ];

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {cards.map((card, i) => (
          <div key={i} className={`bg-gradient-to-br ${card.color} rounded-2xl p-4 text-white shadow-lg`}>
            <div className="flex items-center justify-between mb-2 flex-row-reverse">
              <div className="bg-white/20 p-1.5 rounded-lg">{card.icon}</div>
              <span className="text-xs opacity-80">{card.label}</span>
            </div>
            <p className="text-2xl font-bold mb-1 text-right">{card.value}</p>
            <p className="text-xs opacity-80 text-right">{card.sub}</p>
            {card.bar !== null && (
              <div dir="ltr" className={`mt-2 w-full ${card.barColor} rounded-full h-1.5 overflow-hidden`}>
                <div className={`${card.barFill} h-1.5 rounded-full transition-all duration-700`} style={{ width: `${card.bar}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Date & Alerts row */}
      <div className={`grid grid-cols-1 gap-3 ${overdueTasks > 0 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        {project?.start_date && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400">{t('startDateLabel')}</p>
              <p className="font-semibold text-gray-800 dark:text-slate-100 text-sm">
                {new Date(project.start_date).toLocaleDateString(locale)}
              </p>
            </div>
          </div>
        )}

        {estimatedEnd && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm flex items-center gap-3">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
              <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400">{t('estimatedEnd')}</p>
              <p className="font-semibold text-gray-800 dark:text-slate-100 text-sm">
                {estimatedEnd.toLocaleDateString(locale)}
              </p>
            </div>
          </div>
        )}

        {overdueTasks > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800 shadow-sm flex items-center gap-3">
            <div className="bg-red-100 dark:bg-red-900/40 p-2 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs text-red-500 dark:text-red-400">{t('overdueTasks')}</p>
              <p className="font-semibold text-red-700 dark:text-red-300 text-sm">{overdueTasks} {t('tasks')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Progress bar visual */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">{t('projectProgress')}</span>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{progressPct}%</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-1000"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-400">{totalTasks - doneTasks} {t('remaining')}</span>
          <span className="text-xs text-gray-400">{doneTasks} {t('completed')}</span>
        </div>
      </div>
    </div>
  );
}