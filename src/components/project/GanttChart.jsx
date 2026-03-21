import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { Calendar, Clock, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, addMonths, differenceInDays, parseISO, isAfter, startOfDay } from "date-fns";
import { he } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import AISchedulingAssistant from "./AISchedulingAssistant";

// ── Constants ──────────────────────────────────────────────────────────────────
const DAY_PX    = 20;   // pixels per day
const ROW_H     = 56;   // px per row
const HEADER_H  = 40;   // px header
const MIN_BAR_PX = 40;  // minimum bar width

// ── Helpers ────────────────────────────────────────────────────────────────────
function parseDuration(dur) {
  if (!dur) return 30;
  const d = dur.match(/(\d+)\s*יום/);
  if (d) return parseInt(d[1]);
  const m = dur.match(/(\d+)(?:-(\d+))?\s*חודש/);
  if (m) return Math.round(((parseInt(m[1]) + (m[2] ? parseInt(m[2]) : parseInt(m[1]))) / 2) * 30);
  const w = dur.match(/(\d+)(?:-(\d+))?\s*שבוע/);
  if (w) return Math.round(((parseInt(w[1]) + (w[2] ? parseInt(w[2]) : parseInt(w[1]))) / 2) * 7);
  return 30;
}

function daysToLabel(d, t) {
  if (d < 14) return `${d} ${t('ganttDaysUnit')}`;
  if (d < 60) return `${Math.round(d / 7)} ${t('ganttWeeksUnit')}`;
  return `${Math.round(d / 30)} ${t('ganttMonthsUnit')}`;
}

// ── Status config (labels resolved at render time via t()) ─────────────────────
const STATUS_STYLES = {
  completed:    { bar: "bg-emerald-500", light: "bg-emerald-100", badge: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
  "in-progress":{ bar: "bg-blue-500",    light: "bg-blue-100",    badge: "bg-blue-100 text-blue-800",       dot: "bg-blue-500 animate-pulse" },
  overdue:      { bar: "bg-red-500",     light: "bg-red-100",     badge: "bg-red-100 text-red-800",         dot: "bg-red-500" },
  "not-started":{ bar: "bg-gray-400",   light: "bg-gray-100",    badge: "bg-gray-100 text-gray-600",       dot: "bg-gray-300" },
};

function StatusIcon({ status, className = "w-4 h-4 flex-shrink-0" }) {
  if (status === "completed")   return <CheckCircle2 className={`${className} text-emerald-600`} />;
  if (status === "in-progress") return <Clock        className={`${className} text-blue-600 animate-pulse`} />;
  if (status === "overdue")     return <AlertCircle  className={`${className} text-red-600`} />;
  return                               <Clock        className={`${className} text-gray-400`} />;
}

// ── GanttChart ─────────────────────────────────────────────────────────────────
export default function GanttChart({ project, stages, tasks, suppliers, onStageUpdate, onProjectUpdate }) {
  const { t, i18n } = useTranslation();
  const isRTL = ['he', 'ar'].includes(i18n.language);

  // Build STATUS with translated labels at render time
  const STATUS = {
    completed:    { ...STATUS_STYLES.completed,    label: t('ganttStatusCompleted') },
    "in-progress":{ ...STATUS_STYLES["in-progress"], label: t('ganttStatusInProgress') },
    overdue:      { ...STATUS_STYLES.overdue,      label: t('ganttStatusOverdue') },
    "not-started":{ ...STATUS_STYLES["not-started"], label: t('ganttStatusNotStarted') },
  };

  const namesRef    = useRef(null);
  const barsRef     = useRef(null);
  const isSyncing   = useRef(false);
  const drag        = useRef(null);

  const [displayedMonth, setDisplayedMonth] = useState(() => new Date());
  const [tooltip,  setTooltip]  = useState(null);   // { text, x, y }
  const [activeId, setActiveId] = useState(null);

  // ── Build timeline ─────────────────────────────────────────────────────────
  const timeline = useMemo(() => {
    if (!project?.start_date || !stages.length) return null;

    const projectStart = startOfDay(parseISO(project.start_date));
    const viewStart    = addMonths(projectStart, -1);

    let cursor = projectStart;
    const items = stages.map(stage => {
      const days  = parseDuration(stage.duration);
      const start = cursor;
      const end   = addDays(cursor, days);
      cursor = end;

      const stageTasks = tasks.filter(t => t.stage_id === stage.id);
      const done       = stageTasks.filter(t => t.done).length;
      const progress   = stageTasks.length ? (done / stageTasks.length) * 100 : 0;

      const today  = startOfDay(new Date());
      const status = stage.completed     ? "completed"
                   : isAfter(today, end) ? "overdue"
                   : !isAfter(start, today) ? "in-progress"
                   : "not-started";

      return { ...stage, startDate: start, endDate: end, days, progress, status };
    });

    const lastEnd  = cursor;
    const projEnd  = project.end_date ? startOfDay(parseISO(project.end_date)) : lastEnd;
    const viewEnd  = addMonths(isAfter(lastEnd, projEnd) ? lastEnd : projEnd, 3);
    const totalDays = differenceInDays(viewEnd, viewStart);

    // Build month columns for header
    const months = [];
    let m = new Date(viewStart.getFullYear(), viewStart.getMonth(), 1);
    while (m < viewEnd) {
      const next     = addMonths(m, 1);
      const startDay = Math.max(0, differenceInDays(m,    viewStart));
      const endDay   = Math.min(totalDays, differenceInDays(next, viewStart));
      months.push({ date: new Date(m), startDay, widthDays: endDay - startDay });
      m = next;
    }

    return { viewStart, viewEnd, totalDays, items, months };
  }, [project, stages, tasks]);

  const chartW = timeline ? timeline.totalDays * DAY_PX : 0;

  const dateToX = useCallback((date) => {
    if (!timeline) return 0;
    return Math.round(differenceInDays(date, timeline.viewStart) * DAY_PX);
  }, [timeline]);

  // ── Auto-scroll to today on mount ─────────────────────────────────────────
  useEffect(() => {
    if (!timeline || !barsRef.current) return;
    const todayX = dateToX(startOfDay(new Date()));
    barsRef.current.scrollLeft = Math.max(0, todayX - barsRef.current.clientWidth / 2);
  }, [timeline, dateToX]);

  // ── Sync vertical scroll between sidebar and bars ─────────────────────────
  const syncV = (source, targetRef, value) => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    if (targetRef.current) targetRef.current.scrollTop = value;
    requestAnimationFrame(() => { isSyncing.current = false; });
  };

  // ── Drag ──────────────────────────────────────────────────────────────────
  const onDragStart = useCallback((e, item, type) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    drag.current = {
      type,                        // 'move' | 'resize'
      stageId:   item.id,
      stageIdx:  timeline.items.indexOf(item),
      startX:    e.clientX,        // viewport coords — scroll-independent
      origDays:  item.days,
      origStart: item.startDate,
      origEnd:   item.endDate,
    };
    setActiveId(item.id);

    const onMove = (mv) => {
      if (!drag.current) return;
      const deltaDays = Math.round((mv.clientX - drag.current.startX) / DAY_PX);

      if (drag.current.type === "resize") {
        const newDays = Math.max(7, drag.current.origDays + deltaDays);
        const newEnd  = addDays(drag.current.origStart, newDays);
        setTooltip({
          text: `${format(drag.current.origStart, "d/M/yy")} → ${format(newEnd, "d/M/yy")} (${daysToLabel(newDays, t)})`,
          x: mv.clientX, y: mv.clientY,
        });
      } else {
        const newStart = addDays(drag.current.origStart, deltaDays);
        const newEnd   = addDays(drag.current.origEnd,   deltaDays);
        setTooltip({
          text: `${format(newStart, "d/M/yy")} → ${format(newEnd, "d/M/yy")}`,
          x: mv.clientX, y: mv.clientY,
        });
      }
    };

    const onUp = (ue) => {
      if (!drag.current) return;
      const deltaDays = Math.round((ue.clientX - drag.current.startX) / DAY_PX);

      if (Math.abs(deltaDays) >= 1) {
        if (drag.current.type === "resize" && onStageUpdate) {
          const newDays = Math.max(7, drag.current.origDays + deltaDays);
          onStageUpdate(drag.current.stageId, { duration: `${newDays} ${t('ganttDaysUnit')}` });
        } else if (drag.current.type === "move" && drag.current.stageIdx === 0 && onProjectUpdate) {
          // Moving the first stage shifts the whole project
          const newStart = addDays(drag.current.origStart, deltaDays);
          onProjectUpdate({ start_date: format(newStart, "yyyy-MM-dd") });
        }
      }

      drag.current = null;
      setActiveId(null);
      setTooltip(null);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup",   onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup",   onUp);
  }, [timeline, onStageUpdate, onProjectUpdate]);

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!timeline) {
    return (
      <div className="space-y-6">
        <AISchedulingAssistant project={project} stages={stages} tasks={tasks} suppliers={suppliers} onOptimizationApplied={() => {}} />
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-slate-700 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-2">{t('ganttNoTimeline')}</h3>
          <p className="text-gray-500 dark:text-slate-400">{t('ganttNoTimelineDesc')}</p>
        </div>
      </div>
    );
  }

  const today   = startOfDay(new Date());
  const todayX  = dateToX(today);
  const todayVisible = todayX >= 0 && todayX <= chartW;

  const scrollByMonth = (dir) => {
    if (!barsRef.current) return;
    barsRef.current.scrollLeft += dir * DAY_PX * 30;
  };

  const scrollToToday = () => {
    if (!barsRef.current) return;
    barsRef.current.scrollLeft = Math.max(0, todayX - barsRef.current.clientWidth / 2);
    setDisplayedMonth(new Date());
  };

  const ganttH = HEADER_H + timeline.items.length * ROW_H;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <AISchedulingAssistant
        project={project} stages={stages} tasks={tasks} suppliers={suppliers}
        onOptimizationApplied={() => {}}
      />

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden">

        {/* ── Title + Legend ─────────────────────────────────────────────── */}
        <div className="p-4 md:p-6 border-b border-gray-100 dark:border-slate-700">
          <h3 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-slate-100 text-right mb-3">
            {t('ganttTitle')}
          </h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(STATUS).map(([k, s]) => (
              <div key={k} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-full ${s.dot}`} />
                <span className="text-xs text-gray-600 dark:text-slate-400">{s.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <div className="w-0.5 h-4 bg-red-400 rounded" />
              <span className="text-xs text-gray-600 dark:text-slate-400">{t('ganttToday')}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500 ms-2 border-s border-gray-200 dark:border-slate-600 ps-2">
              {t('ganttDragHint')}
            </div>
          </div>
        </div>

        {/* ── Nav bar ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-1">
            <button onClick={() => scrollByMonth(1)} className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors" title="חודש קודם">
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-slate-400" />
            </button>
            <span className="text-sm font-medium text-gray-700 dark:text-slate-300 min-w-[140px] text-center">
              {format(displayedMonth, "MMMM yyyy", { locale: he })}
            </span>
            <button onClick={() => scrollByMonth(-1)} className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors" title="חודש הבא">
              <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-slate-400" />
            </button>
          </div>
          <button
            onClick={scrollToToday}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 transition-colors"
          >
            {t('ganttToday')}
          </button>
        </div>

        {/* ── Mobile: Vertical card list ──────────────────────────────────── */}
        <div className="md:hidden">
          <div className="relative border-e-2 border-gray-100 dark:border-slate-700 pe-6 me-4 space-y-6 p-4 pb-6">
            {timeline.items.map(item => {
              const colors = STATUS[item.status];
              return (
                <div key={item.id} className="relative">
                  <div className={`absolute -end-[31px] top-4 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 shadow-sm z-10 ${colors.dot}`} />
                  <div className={`bg-white dark:bg-slate-700 rounded-xl p-4 shadow-sm border transition-all ${
                    item.status === "in-progress" ? "border-blue-200 ring-1 ring-blue-100 shadow-md" : "border-gray-100 dark:border-slate-600"
                  }`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-lg text-gray-800 dark:text-slate-100">{item.title}</h4>
                        <div className="text-xs text-gray-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 bg-gray-50 dark:bg-slate-600 px-2 py-1 rounded-md">
                          <Calendar className="w-3 h-3" />
                          {format(item.startDate, "d.M.yy")} – {format(item.endDate, "d.M.yy")}
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${colors.badge}`}>
                        {colors.label}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-600 dark:text-slate-300 mb-1 font-medium">
                        <span>{t('ganttTaskProgress')}</span>
                        <span>{Math.round(item.progress)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-slate-600 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${colors.bar}`} style={{ width: `${item.progress}%` }} />
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-600 flex items-center justify-between text-xs text-gray-400 dark:text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{item.duration}</span>
                      </div>
                      {item.status === "in-progress" && (
                        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                          </span>
                          {t('ganttCurrentStage')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile: compact horizontal scroll Gantt */}
          <div className="border-t border-gray-100 dark:border-slate-700 p-2 pb-0">
            <p className="text-xs text-gray-400 dark:text-slate-500 text-right px-2 pb-1">{t('ganttScrollHint')}</p>
            <div
              className="overflow-x-auto"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <div style={{ width: chartW + 80, minWidth: "100%" }}>
                {/* Mini month header */}
                <div className="flex border-b border-gray-200 dark:border-slate-700" style={{ height: 24 }}>
                  <div style={{ width: 80, flexShrink: 0 }} className="bg-gray-50 dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700" />
                  <div className="flex relative" style={{ width: chartW }}>
                    {timeline.months.map((m, i) => (
                      <div
                        key={i}
                        className="absolute flex items-center justify-center text-[10px] text-gray-400 dark:text-slate-500 border-r border-gray-100 dark:border-slate-700"
                        style={{ left: m.startDay * DAY_PX, width: m.widthDays * DAY_PX, height: 24 }}
                      >
                        {m.widthDays * DAY_PX > 30 ? format(m.date, "M.yy") : ""}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Mini bar rows */}
                {timeline.items.map(item => {
                  const barX = dateToX(item.startDate);
                  const barW = Math.max(MIN_BAR_PX, item.days * DAY_PX);
                  const colors = STATUS[item.status];
                  return (
                    <div key={item.id} className="flex border-b border-gray-100 dark:border-slate-700" style={{ height: 32 }}>
                      {/* Name column */}
                      <div className="flex items-center px-2 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 overflow-hidden" style={{ width: 80, flexShrink: 0 }}>
                        <span className="text-[10px] text-gray-600 dark:text-slate-300 truncate">{item.title}</span>
                      </div>
                      {/* Bar cell */}
                      <div className="relative" style={{ width: chartW }}>
                        {todayVisible && (
                          <div className="absolute top-0 bottom-0 w-0.5 bg-red-400 opacity-70 pointer-events-none" style={{ left: todayX }} />
                        )}
                        <div
                          className={`absolute top-1 rounded ${colors.light}`}
                          style={{ left: barX, width: barW, height: 22 }}
                        >
                          <div className={`h-full rounded ${colors.bar} opacity-70`} style={{ width: `${item.progress}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Desktop: Full Gantt with drag ───────────────────────────────── */}
        <div
          className="hidden md:flex overflow-hidden"
          style={{ height: Math.min(ganttH, 560) }}
        >
          {/* Sidebar: stage names */}
          <div
            className="flex-shrink-0 bg-white dark:bg-slate-800 border-l border-gray-200 dark:border-slate-700 flex flex-col z-20"
            style={{ width: 240 }}
          >
            {/* Header spacer */}
            <div
              className="flex-shrink-0 bg-gray-50 dark:bg-slate-900 border-b-2 border-gray-200 dark:border-slate-600"
              style={{ height: HEADER_H }}
            />
            {/* Synced name list */}
            <div
              ref={namesRef}
              className="flex-1 overflow-y-auto"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              onScroll={e => syncV(e.currentTarget, barsRef, e.currentTarget.scrollTop)}
            >
              {timeline.items.map(item => (
                <div
                  key={item.id}
                  className="flex flex-col justify-center px-3 border-b border-gray-100 dark:border-slate-700"
                  style={{ height: ROW_H }}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <StatusIcon status={item.status} />
                    <span className="font-semibold text-sm text-gray-800 dark:text-slate-100 truncate" title={item.title}>
                      {item.title}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 truncate">
                    {format(item.startDate, "d/M/yy")} – {format(item.endDate, "d/M/yy")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bars panel: left=older, right=newer (LTR) */}
          <div
            ref={barsRef}
            dir="ltr"
            className="flex-1 overflow-x-auto overflow-y-auto"
            style={{ scrollbarWidth: "thin" }}
            onScroll={e => {
              const el = e.currentTarget;
              // Update nav month display
              const dayOff = Math.floor(el.scrollLeft / DAY_PX);
              setDisplayedMonth(addDays(timeline.viewStart, dayOff));
              syncV(el, namesRef, el.scrollTop);
            }}
          >
            <div style={{ width: chartW, minHeight: "100%" }}>

              {/* Sticky month header */}
              <div
                className="sticky top-0 z-10 flex bg-gray-50 dark:bg-slate-900 border-b-2 border-gray-200 dark:border-slate-600"
                style={{ height: HEADER_H }}
              >
                {timeline.months.map((m, i) => (
                  <div
                    key={i}
                    className="absolute flex items-end justify-center pb-1 text-xs font-medium text-gray-500 dark:text-slate-400 border-r border-gray-100 dark:border-slate-700"
                    style={{
                      left:   m.startDay * DAY_PX,
                      width:  m.widthDays * DAY_PX,
                      height: HEADER_H,
                    }}
                  >
                    {m.widthDays * DAY_PX > 50
                      ? format(m.date, "MMM yy", { locale: he })
                      : format(m.date, "M", { locale: he })}
                  </div>
                ))}
              </div>

              {/* Bar rows */}
              {timeline.items.map(item => {
                const barX   = dateToX(item.startDate);
                const barW   = Math.max(MIN_BAR_PX, item.days * DAY_PX);
                const colors = STATUS[item.status];
                const active = item.id === activeId;

                return (
                  <div
                    key={item.id}
                    className="relative border-b border-gray-100 dark:border-slate-700/50"
                    style={{ height: ROW_H }}
                  >
                    {/* Month grid lines */}
                    {timeline.months.map((m, i) => (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 border-r border-gray-100 dark:border-slate-700/30"
                        style={{ left: m.startDay * DAY_PX }}
                      />
                    ))}

                    {/* Today vertical line */}
                    {todayVisible && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-400 opacity-80 z-10 pointer-events-none"
                        style={{ left: todayX }}
                      />
                    )}

                    {/* Bar (draggable — move) */}
                    <div
                      className={`absolute top-3 rounded-lg overflow-hidden select-none
                        ${active ? "shadow-lg ring-2 ring-blue-400 z-20" : "shadow-sm hover:shadow-md z-10"}
                        cursor-grab active:cursor-grabbing`}
                      style={{ left: barX, width: barW, height: ROW_H - 24 }}
                      onMouseDown={e => onDragStart(e, item, "move")}
                    >
                      {/* Background tint */}
                      <div className={`absolute inset-0 ${colors.light}`} />
                      {/* Progress fill */}
                      <div
                        className={`absolute inset-y-0 left-0 ${colors.bar} opacity-80 transition-all duration-500`}
                        style={{ width: `${item.progress}%` }}
                      />
                      {/* Label inside bar */}
                      {barW >= 50 && (
                        <div className="absolute inset-0 flex flex-col justify-center px-2 overflow-hidden pointer-events-none">
                          <span className="text-xs font-semibold text-gray-700 dark:text-slate-200 truncate leading-tight">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-gray-500 dark:text-slate-400 truncate">
                            {colors.label}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Resize handle — right edge */}
                    <div
                      className="absolute z-30 flex items-center justify-center cursor-col-resize"
                      style={{ left: barX + barW - 5, top: 10, width: 10, height: ROW_H - 20 }}
                      onMouseDown={e => onDragStart(e, item, "resize")}
                      title="גרור לשינוי משך"
                    >
                      <div className="w-1 h-6 bg-gray-400 dark:bg-slate-500 rounded-full opacity-60 hover:opacity-100 hover:bg-blue-500 transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Drag tooltip ─────────────────────────────────────────────────── */}
      {tooltip && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl pointer-events-none whitespace-nowrap"
          style={{ left: tooltip.x + 16, top: tooltip.y - 40 }}
        >
          {tooltip.text}
        </div>
      )}

      {/* ── Critical path ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-e-4 border-amber-500 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1" />
          <div className="text-right w-full">
            <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">{t('ganttCriticalPath')}</h4>
            <p className="text-sm text-amber-800 dark:text-amber-400 leading-relaxed mb-3">
              {t('ganttCriticalPathDesc')}
            </p>
            <div className="flex flex-wrap gap-2 justify-end">
              {timeline.items.filter(s => s.status === "overdue").length > 0 && (
                <div className="text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-3 py-1 rounded-full font-medium">
                  ⚠️ {timeline.items.filter(s => s.status === "overdue").length} {t('ganttStagesOverdue')}
                </div>
              )}
              {timeline.items.filter(s => s.status === "in-progress").length > 0 && (
                <div className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full font-medium">
                  ⏳ {timeline.items.filter(s => s.status === "in-progress").length} {t('ganttStagesInProgress')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
