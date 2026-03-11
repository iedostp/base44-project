import React, { useState, useMemo, useEffect } from "react";
import { addDays, format, startOfWeek, endOfWeek, isSameDay, isWithinInterval, parseISO } from "date-fns";
import { he } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

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

const STAGE_COLORS = [
  { bg: "bg-blue-500", light: "bg-blue-100", text: "text-blue-800", border: "border-blue-300" },
  { bg: "bg-purple-500", light: "bg-purple-100", text: "text-purple-800", border: "border-purple-300" },
  { bg: "bg-emerald-500", light: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-300" },
  { bg: "bg-orange-500", light: "bg-orange-100", text: "text-orange-800", border: "border-orange-300" },
  { bg: "bg-pink-500", light: "bg-pink-100", text: "text-pink-800", border: "border-pink-300" },
  { bg: "bg-teal-500", light: "bg-teal-100", text: "text-teal-800", border: "border-teal-300" },
  { bg: "bg-indigo-500", light: "bg-indigo-100", text: "text-indigo-800", border: "border-indigo-300" },
  { bg: "bg-red-500", light: "bg-red-100", text: "text-red-800", border: "border-red-300" },
];

// DAY_NAMES now resolved via t() at render time
function useOrientation() {
  const [isLandscape, setIsLandscape] = useState(
    typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : false
  );
  useEffect(() => {
    const update = () => setIsLandscape(window.innerWidth > window.innerHeight);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);
  return isLandscape;
}

function getWeekDays(anchorDate) {
  const weekStart = startOfWeek(anchorDate, { weekStartsOn: 0 });
  const days = [];
  for (let i = 0; i < 7; i++) days.push(addDays(weekStart, i));
  return days;
}

function getEventsForDay(day, stagesWithDates, project, t) {
  const events = [];
  if (project?.start_date && isSameDay(day, parseISO(project.start_date))) {
    events.push({ label: t('calendarProjectStart'), color: STAGE_COLORS[0] });
  }
  stagesWithDates.forEach((stage, i) => {
    const color = STAGE_COLORS[i % STAGE_COLORS.length];
    if (isSameDay(day, stage.startDate)) events.push({ label: `▶ ${stage.title}`, color });
    if (isSameDay(day, stage.endDate)) events.push({ label: `■ ${stage.title}`, color });
  });
  return events;
}

function CalendarView({ stagesWithDates, project, currentDate, setCurrentDate, compact, t }) {
  const today = new Date();
  const days = getWeekDays(currentDate);
  const weekStart = days[0];
  const weekEnd = days[6];
  const DAY_NAMES = t('calendarDayNames', { returnObjects: true });

  const visibleStages = useMemo(() => {
    const set = new Set();
    days.forEach(day => {
      stagesWithDates.forEach((stage, i) => {
        if (isWithinInterval(day, { start: stage.startDate, end: stage.endDate })) set.add(i);
      });
    });
    return Array.from(set).map(i => ({ stage: stagesWithDates[i], index: i }));
  }, [days, stagesWithDates]);

  return (
    <div className="w-full">
      {/* Nav */}
      <div className="flex items-center justify-between mb-3">
        <Button variant="outline" size="sm" onClick={() => setCurrentDate(addDays(currentDate, -7))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <span className={`font-bold text-gray-800 dark:text-slate-100 ${compact ? 'text-sm' : 'text-base'}`}>
          {format(weekStart, 'dd/MM/yyyy')} – {format(weekEnd, 'dd/MM/yyyy')}
        </span>
        <Button variant="outline" size="sm" onClick={() => setCurrentDate(addDays(currentDate, 7))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>

      {/* Headers */}
      <div className="grid grid-cols-7 gap-px mb-1">
        {days.map((day, i) => (
          <div key={i} className="text-center">
            <div className={`font-semibold text-gray-600 dark:text-slate-400 ${compact ? 'text-[9px]' : 'text-xs'}`}>
              {Array.isArray(DAY_NAMES) ? (compact ? DAY_NAMES[i]?.slice(0, 3) : DAY_NAMES[i]) : ''}
            </div>
            <div className={`text-gray-400 dark:text-slate-500 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
              {format(day, 'd/M')}
            </div>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-slate-700 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
        {days.map((day, i) => {
          const events = getEventsForDay(day, stagesWithDates, project, t);
          const inStage = stagesWithDates.find(s => isWithinInterval(day, { start: s.startDate, end: s.endDate }));
          const isToday = isSameDay(day, today);
          return (
            <div
              key={i}
              className={`${compact ? 'min-h-[80px] p-1' : 'min-h-[90px] p-1.5'} flex flex-col gap-0.5 ${
                inStage ? 'bg-blue-50/60 dark:bg-blue-900/10' : 'bg-white dark:bg-slate-800'
              }`}
            >
              <span className={`font-medium flex items-center justify-center rounded-full mx-auto mb-0.5 ${
                compact ? 'w-5 h-5 text-[11px]' : 'w-6 h-6 text-xs'
              } ${isToday ? 'bg-blue-600 text-white font-bold' : 'text-gray-700 dark:text-slate-300'}`}>
                {format(day, 'd')}
              </span>
              {events.map((ev, ei) => (
                <div
                  key={ei}
                  className={`${compact ? 'text-[8px] px-0.5' : 'text-[9px] px-1'} py-0.5 rounded ${ev.color.light} ${ev.color.text} truncate font-medium leading-tight`}
                  title={ev.label}
                >
                  {ev.label}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {visibleStages.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {visibleStages.map(({ stage, index }) => (
            <div key={stage.id} className="flex items-center gap-1 text-xs text-gray-600 dark:text-slate-400">
              <div className={`w-2.5 h-2.5 rounded-full ${STAGE_COLORS[index % STAGE_COLORS.length].bg}`} />
              <span className="text-[10px]">{stage.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ListView({ stagesWithDates, project, currentDate, setCurrentDate, t }) {
  const today = new Date();
  const days = getWeekDays(currentDate);
  const weekStart = days[0];
  const weekEnd = days[6];

  const weekEvents = useMemo(() => {
    const events = [];
    days.forEach(day => {
      getEventsForDay(day, stagesWithDates, project, t).forEach(ev => {
        events.push({ date: day, ...ev });
      });
    });
    return events.sort((a, b) => a.date - b.date);
  }, [days, stagesWithDates, project]);

  return (
    <div>
      <div dir="rtl" className="flex items-center justify-between mb-4">
        <Button variant="outline" size="sm" onClick={() => setCurrentDate(addDays(currentDate, -7))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <span className="font-bold text-gray-800 dark:text-slate-100 text-base">
          {format(weekStart, 'dd/MM/yyyy')} – {format(weekEnd, 'dd/MM/yyyy')}
        </span>
        <Button variant="outline" size="sm" onClick={() => setCurrentDate(addDays(currentDate, 7))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
      <div className="space-y-2">
        {weekEvents.length === 0 ? (
          <div dir="rtl" className="text-center py-8 text-gray-400 text-sm">{t('calendarNoEvents')}</div>
        ) : weekEvents.map((ev, i) => {
          const isPast = ev.date < today;
          return (
            <div dir="rtl" key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${
              isPast ? 'bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-slate-700 opacity-60'
                     : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 shadow-sm'
            }`}>
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${ev.color.bg}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate text-right ${isPast ? 'text-gray-500 dark:text-slate-400' : 'text-gray-800 dark:text-slate-100'}`}>
                  {ev.label}
                </p>
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">{format(ev.date, 'd MMM', { locale: he })}</span>
              {isSameDay(ev.date, today) && (
                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">{t('ganttToday')}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ProjectCalendar({ project, stages }) {
  const { t } = useTranslation();
  const isLandscape = useOrientation();
  const [manualView, setManualView] = useState('list'); // default to list view
  const [currentDate, setCurrentDate] = useState(
    project?.start_date ? parseISO(project.start_date) : new Date()
  );

  // Auto-select view based on orientation on mobile
  // On portrait mobile: list. On landscape mobile or desktop: calendar.
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 1024;

  // effective view: landscape mobile → calendar fullscreen; portrait mobile → list; desktop → manual or calendar
  const autoView = isLandscape && isMobile ? 'calendar' : (!isLandscape && isMobile ? 'list' : 'calendar');
  const view = manualView ?? autoView;

  // Reset manual view on orientation change so auto kicks back in
  useEffect(() => {
    setManualView(null);
  }, [isLandscape]);

  const stagesWithDates = useMemo(() => {
    let runningDate = project?.start_date ? parseISO(project.start_date) : new Date();
    return [...stages]
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(stage => {
        const startDate = new Date(runningDate);
        const durationDays = parseDurationDays(stage.duration);
        const endDate = addDays(startDate, durationDays);
        runningDate = new Date(endDate);
        return { ...stage, startDate, endDate };
      });
  }, [stages, project]);

  // Landscape mobile → fullscreen overlay
  if (isLandscape && isMobile) {
    return (
      <div className="fixed inset-0 z-40 bg-white dark:bg-slate-900 overflow-auto">
        <div className="p-3 h-full flex flex-col">
          <div className="flex items-center justify-between mb-2 flex-shrink-0">
            <h2 className="text-base font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              {t('calendarTitle')}
            </h2>
            <div className="flex items-center bg-gray-100 dark:bg-slate-700 rounded-xl p-1 gap-1">
              <button
                onClick={() => setManualView('calendar')}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                  view === 'calendar' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm' : 'text-gray-500'
                }`}
              >
                <Calendar className="w-3 h-3" /> {t('calendarWeekly')}
              </button>
              <button
                onClick={() => setManualView('list')}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                  view === 'list' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm' : 'text-gray-500'
                }`}
              >
                <List className="w-3 h-3" /> {t('calendarList')}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {view === 'calendar' ? (
              <CalendarView
                stagesWithDates={stagesWithDates}
                project={project}
                currentDate={currentDate}
                setCurrentDate={setCurrentDate}
                compact={true}
                t={t}
              />
            ) : (
              <ListView
                stagesWithDates={stagesWithDates}
                project={project}
                currentDate={currentDate}
                setCurrentDate={setCurrentDate}
                t={t}
              />
            )}
          </div>
          <p className="text-center text-[10px] text-gray-400 mt-1 flex-shrink-0">{t('calendarRotateBack')}</p>
        </div>
      </div>
    );
  }

  // Portrait mobile or desktop → normal card
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 p-5">
      <div dir="rtl" className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          {t('calendarTitle')}
        </h2>
        {/* Mobile-only toggle */}
        <div className="md:hidden flex items-center gap-2">
          {isMobile && !isLandscape && (
            <span className="text-[10px] text-gray-400">{t('calendarRotateHint')}</span>
          )}
          <div className="flex items-center bg-gray-100 dark:bg-slate-700 rounded-xl p-1 gap-1">
            <button
              onClick={() => setManualView('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                view === 'calendar' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-slate-400'
              }`}
            >
              <Calendar className="w-4 h-4" /> {t('calendarWeekly')}
            </button>
            <button
              onClick={() => setManualView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                view === 'list' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-slate-400'
              }`}
            >
              <List className="w-4 h-4" /> {t('calendarList')}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile: single toggled view */}
      <div className="md:hidden">
        {view === 'calendar' ? (
          <CalendarView
            stagesWithDates={stagesWithDates}
            project={project}
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            compact={false}
            t={t}
          />
        ) : (
          <ListView
            stagesWithDates={stagesWithDates}
            project={project}
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            t={t}
          />
        )}
      </div>

      {/* Desktop: two-panel side by side */}
      <div dir="rtl" className="hidden md:flex gap-5">
        {/* Right sidebar: ListView (first child = rightmost in RTL) */}
        <div className="w-72 flex-shrink-0 border-r border-gray-100 dark:border-slate-700 pr-5">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-slate-400 mb-3 text-right">{t('calendarWeekEvents')}</h3>
          <ListView
            stagesWithDates={stagesWithDates}
            project={project}
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            t={t}
          />
        </div>
        {/* Left main area: CalendarView */}
        <div className="flex-1 min-w-0">
          <CalendarView
            stagesWithDates={stagesWithDates}
            project={project}
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            compact={false}
            t={t}
          />
        </div>
      </div>
    </div>
  );
}