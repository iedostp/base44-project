import React, { useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Calendar, Clock, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, addMonths, differenceInDays, parseISO, isAfter, isWithinInterval } from "date-fns";
import { he } from "date-fns/locale";
import AISchedulingAssistant from "./AISchedulingAssistant";

export default function GanttChart({ project, stages, tasks, suppliers }) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'he';
  const scrollRef = useRef(null);
  const namesRef = useRef(null);

  const handleGanttScroll = () => {
    if (namesRef.current && scrollRef.current) {
      namesRef.current.scrollTop = scrollRef.current.scrollTop;
    }
  };

  // Parse duration string to days (approximate)
  const parseDuration = (duration) => {
    if (!duration) return 30;
    const monthMatch = duration.match(/(\d+)(?:-(\d+))?\s*חודש/);
    if (monthMatch) {
      const min = parseInt(monthMatch[1]);
      const max = monthMatch[2] ? parseInt(monthMatch[2]) : min;
      return ((min + max) / 2) * 30;
    }
    const weekMatch = duration.match(/(\d+)(?:-(\d+))?\s*שבוע/);
    if (weekMatch) {
      const min = parseInt(weekMatch[1]);
      const max = weekMatch[2] ? parseInt(weekMatch[2]) : min;
      return ((min + max) / 2) * 7;
    }
    return 30;
  };

  // Calculate timeline data with fixed date range
  const timelineData = useMemo(() => {
    if (!project?.start_date || stages.length === 0) return null;

    // viewStart: 1 month before project start
    const viewStart = addMonths(parseISO(project.start_date), -1);

    let currentDate = parseISO(project.start_date);
    const stagesWithDates = [];

    stages.forEach((stage) => {
      const durationDays = parseDuration(stage.duration);
      const stageStartDate = currentDate;
      const stageEndDate = addDays(currentDate, durationDays);

      const stageTasks = tasks.filter(t => t.stage_id === stage.id);
      const completedTasks = stageTasks.filter(t => t.done).length;
      const progress = stageTasks.length > 0 ? (completedTasks / stageTasks.length) * 100 : 0;

      const today = new Date();
      let status = 'not-started';
      if (stage.completed) {
        status = 'completed';
      } else if (isAfter(today, stageEndDate)) {
        status = 'overdue';
      } else if (isWithinInterval(today, { start: stageStartDate, end: stageEndDate })) {
        status = 'in-progress';
      }

      stagesWithDates.push({
        ...stage,
        startDate: stageStartDate,
        endDate: stageEndDate,
        durationDays,
        progress,
        status
      });

      currentDate = stageEndDate;
    });

    const lastStageEnd = currentDate;
    const projectEnd = project.end_date ? parseISO(project.end_date) : lastStageEnd;
    const actualEnd = isAfter(lastStageEnd, projectEnd) ? lastStageEnd : projectEnd;
    const viewEnd = addMonths(actualEnd, 6);

    const totalDays = differenceInDays(viewEnd, viewStart);
    const totalMonths = Math.ceil(totalDays / 30) + 1;

    return {
      viewStart,
      viewEnd,
      totalDays,
      totalMonths,
      stages: stagesWithDates
    };
  }, [project, stages, tasks]);

  const handleOptimizationApplied = (optimization) => {
    console.log('Optimization applied:', optimization);
  };

  if (!timelineData) {
    return (
      <div className="space-y-6">
        <AISchedulingAssistant
          project={project}
          stages={stages}
          tasks={tasks}
          suppliers={suppliers}
          onOptimizationApplied={handleOptimizationApplied}
        />
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">לא ניתן להציג ציר זמן</h3>
            <p className="text-gray-500">אנא הגדר תאריך התחלה לפרויקט כדי לראות את ציר הזמן</p>
          </div>
        </div>
      </div>
    );
  }

  const today = new Date();
  const todayPosition = differenceInDays(today, timelineData.viewStart);
  const todayPercentage = (todayPosition / timelineData.totalDays) * 100;

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500';
      case 'in-progress': return 'bg-blue-500';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'in-progress': return <Clock className="w-4 h-4 text-blue-600 animate-pulse" />;
      case 'overdue': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'הושלם';
      case 'in-progress': return 'בביצוע';
      case 'overdue': return 'באיחור';
      default: return 'טרם התחיל';
    }
  };

  const minColWidth = 100; // px per month
  const chartWidth = timelineData.totalMonths * minColWidth;

  return (
    <div className="space-y-6">
      {/* AI Scheduling Assistant */}
      <AISchedulingAssistant
        project={project}
        stages={stages}
        tasks={tasks}
        suppliers={suppliers}
        onOptimizationApplied={handleOptimizationApplied}
      />

      {/* Gantt Chart */}
      <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 border border-gray-100">
        <div className="flex flex-col gap-4 mb-4">
          <h3 className="text-xl md:text-2xl font-bold text-gray-800 text-right">ציר זמן - תצוגת גאנט</h3>

          {/* Legend */}
          <div dir="rtl" className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-gray-600 text-xs md:text-sm">הושלם</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-600 text-xs md:text-sm">בביצוע</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-gray-600 text-xs md:text-sm">באיחור</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
              <span className="text-gray-600 text-xs md:text-sm">טרם התחיל</span>
            </div>
          </div>
        </div>

        {/* Mobile Vertical View */}
        <div className="md:hidden relative border-e-2 border-gray-100 pe-6 me-3 space-y-8 pb-4">
          {timelineData.stages.map((stage) => {
            const isActive = stage.status === 'in-progress';
            const isDone = stage.status === 'completed';
            const isOverdue = stage.status === 'overdue';

            return (
              <div key={stage.id} className="relative">
                <div className={`absolute -end-[31px] top-4 w-4 h-4 rounded-full border-2 border-white shadow-sm z-10 ${
                   isDone ? 'bg-emerald-500' :
                   isActive ? 'bg-blue-500 animate-pulse' :
                   isOverdue ? 'bg-red-500' : 'bg-gray-300'
                }`} />

                <div className={`bg-white rounded-xl p-4 shadow-sm border transition-all ${
                  isActive ? 'border-blue-200 ring-1 ring-blue-100 shadow-md' : 'border-gray-100'
                }`}>
                  <div dir="rtl" className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className={`font-bold text-lg ${isActive ? 'text-blue-900' : 'text-gray-800'}`}>{stage.title}</h4>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                        <Calendar className="w-3 h-3" />
                        {format(stage.startDate, 'd.M.yy')} - {format(stage.endDate, 'd.M.yy')}
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        stage.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                        stage.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        stage.status === 'overdue' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-600'
                    }`}>
                      {getStatusText(stage.status)}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div dir="rtl" className="flex justify-between text-xs text-gray-600 mb-1.5 font-medium">
                      <span>התקדמות</span>
                      <span>{Math.round(stage.progress)}%</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${getStatusColor(stage.status)}`}
                        style={{ width: `${stage.progress}%` }}
                      />
                    </div>
                  </div>

                  <div dir="rtl" className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>משך: {stage.duration}</span>
                    </div>
                    {isActive && (
                      <div className="flex items-center gap-1 text-blue-600 font-medium">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        שלב נוכחי
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Horizontal Gantt - fixed RIGHT panel (stage names) + scrollable LEFT panel (bars) */}
        <div dir="rtl" className="hidden md:flex overflow-hidden gap-0" style={{ maxHeight: '520px' }}>

          {/* Fixed RIGHT panel: stage names + dates + status (first child = rightmost in RTL) */}
          <div className="w-56 flex-shrink-0 flex flex-col border-l border-gray-200 overflow-hidden">
            {/* Header spacer matching month-label row height */}
            <div className="h-8 border-b border-gray-200 mb-2 flex-shrink-0" />
            {/* Names list — scrolled programmatically in sync with the bars panel */}
            <div
              ref={namesRef}
              className="flex-1 overflow-y-hidden"
              style={{ scrollbarWidth: 'none' }}
            >
              <div className="space-y-4">
                {timelineData.stages.map((stage) => (
                  <div key={stage.id} className="h-12 flex flex-col justify-center pl-2">
                    <div dir="rtl" className="flex items-center gap-2">
                      {getStatusIcon(stage.status)}
                      <h4 className="font-semibold text-gray-800 text-sm truncate">{stage.title}</h4>
                    </div>
                    <div dir="rtl" className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                      <span>{format(stage.startDate, 'd/M/yy')}</span>
                      <ChevronRight className="w-3 h-3" />
                      <span>{format(stage.endDate, 'd/M/yy')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Scrollable LEFT panel: month labels + bars (dir=ltr to keep bar positions physical) */}
          <div dir="ltr" ref={scrollRef} className="flex-1 overflow-x-auto overflow-y-auto" onScroll={handleGanttScroll}>
            <div style={{ minWidth: `${chartWidth}px` }}>

              {/* Month labels */}
              <div className="sticky top-0 z-10 bg-white flex border-b-2 border-gray-200 pb-1 mb-2 h-8 items-end">
                {Array.from({ length: timelineData.totalMonths }).map((_, i) => {
                  const monthDate = addMonths(timelineData.viewStart, i);
                  return (
                    <div
                      key={i}
                      className="flex-1 text-center text-xs font-medium text-gray-500"
                      style={{ minWidth: `${minColWidth}px` }}
                    >
                      {format(monthDate, 'MMM yy', { locale: he })}
                    </div>
                  );
                })}
              </div>

              {/* Bars */}
              <div className="space-y-4">
                {timelineData.stages.map((stage, index) => {
                  const startPosition = (differenceInDays(stage.startDate, timelineData.viewStart) / timelineData.totalDays) * 100;
                  const width = (stage.durationDays / timelineData.totalDays) * 100;

                  return (
                    <div key={stage.id} className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">

                      {/* Today line */}
                      {todayPosition >= 0 && todayPosition <= timelineData.totalDays && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                          style={{ left: `${todayPercentage}%` }}
                        >
                          {index === 0 && (
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap shadow-lg">
                              היום
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bar */}
                      <motion.div
                        className="absolute top-1 h-10 rounded-lg shadow-md cursor-pointer"
                        style={{ width: `${width}%`, left: `${startPosition}%` }}
                        layout
                        transition={{ type: "spring", stiffness: 100, damping: 20 }}
                      >
                        <div className={`absolute inset-0 ${getStatusColor(stage.status)} opacity-20 rounded-lg`} />
                        <div
                          className={`absolute inset-0 ${getStatusColor(stage.status)} transition-all duration-500 rounded-lg`}
                          style={{ width: `${stage.progress}%` }}
                        />
                        <div className={`absolute inset-0 border-2 ${getStatusColor(stage.status)} border-opacity-50 rounded-lg`} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          {stage.progress > 5 && (
                            <div className={`${getStatusColor(stage.status)} px-2 py-0.5 rounded border-2 border-white`}>
                              <span className="text-xs font-bold text-white drop-shadow-sm">
                                {Math.round(stage.progress)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>

                      {/* Status badge overlay at end of bar */}
                      <div
                        className="absolute top-1.5 z-20 pointer-events-none"
                        style={{ left: `${Math.min(startPosition + width + 0.5, 97)}%` }}
                      >
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                          stage.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                          stage.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          stage.status === 'overdue' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getStatusText(stage.status)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Path Info */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-e-4 border-amber-500 rounded-xl p-5">
        <div dir="rtl" className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
          <div className="text-right w-full">
            <h4 className="font-semibold text-amber-900 mb-2">נתיב קריטי</h4>
            <p className="text-sm text-amber-800 leading-relaxed mb-3">
              כל השלבים בפרויקט מתוכננים ברצף. עיכוב בשלב אחד ישפיע על כל השלבים הבאים.
            </p>
            <div className="flex flex-wrap gap-2 justify-end">
              {timelineData.stages.filter(s => s.status === 'overdue').length > 0 && (
                <div className="text-xs bg-red-100 text-red-800 px-3 py-1 rounded-full font-medium">
                  ⚠️ {timelineData.stages.filter(s => s.status === 'overdue').length} שלבים באיחור
                </div>
              )}
              {timelineData.stages.filter(s => s.status === 'in-progress').length > 0 && (
                <div className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                  ⏳ {timelineData.stages.filter(s => s.status === 'in-progress').length} שלבים בביצוע
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
