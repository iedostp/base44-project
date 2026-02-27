import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, addMonths, differenceInDays, parseISO, isAfter, isBefore, isWithinInterval } from "date-fns";
import { he } from "date-fns/locale";
import AISchedulingAssistant from "./AISchedulingAssistant";
import { Button } from "@/components/ui/button";

export default function GanttChart({ project, stages, tasks, suppliers }) {
  const [dateOffset, setDateOffset] = useState(0);
  const [hoveredStageId, setHoveredStageId] = useState(null);

  // Calculate total project duration in months to set offset bounds
  const projectDurationMonths = useMemo(() => {
    if (!stages.length) return 0;
    const parseDur = (duration) => {
      if (!duration) return 1;
      const m = duration.match(/(\d+)(?:-(\d+))?\s*חודש/);
      if (m) return m[2] ? (parseInt(m[1]) + parseInt(m[2])) / 2 : parseInt(m[1]);
      const w = duration.match(/(\d+)(?:-(\d+))?\s*שבוע/);
      if (w) return (w[2] ? (parseInt(w[1]) + parseInt(w[2])) / 2 : parseInt(w[1])) / 4;
      return 1;
    };
    return Math.ceil(stages.reduce((sum, s) => sum + parseDur(s.duration), 0));
  }, [stages]);

  const minOffset = -1;
  const maxOffset = projectDurationMonths + 1;
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

  // Calculate timeline data
  const timelineData = useMemo(() => {
    if (!project?.start_date || stages.length === 0) return null;

    const startDate = addMonths(parseISO(project.start_date), dateOffset);
    let currentDate = startDate;
    const stagesWithDates = [];

    stages.forEach((stage, index) => {
      const durationDays = parseDuration(stage.duration);
      const stageStartDate = currentDate;
      const stageEndDate = addDays(currentDate, durationDays);
      
      // Calculate progress based on completed tasks
      const stageTasks = tasks.filter(t => t.stage_id === stage.id);
      const completedTasks = stageTasks.filter(t => t.done).length;
      const progress = stageTasks.length > 0 ? (completedTasks / stageTasks.length) * 100 : 0;

      // Determine status
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

    const projectEndDate = currentDate;
    const totalDays = differenceInDays(projectEndDate, startDate);

    return {
      startDate,
      endDate: projectEndDate,
      totalDays,
      stages: stagesWithDates
    };
  }, [project, stages, tasks, dateOffset]);

  const handleOptimizationApplied = (optimization) => {
    console.log('Optimization applied:', optimization);
    // Here you would update the actual stage data
    // For now, we'll just show a notification
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
  const todayPosition = differenceInDays(today, timelineData.startDate);
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
      <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 border border-gray-100" dir="rtl">
        <div className="flex flex-col gap-4">
          <h3 className="text-xl md:text-2xl font-bold text-gray-800 text-right">ציר זמן - תצוגת גאנט</h3>
          <div className="flex items-center justify-center md:justify-start gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDateOffset(Math.max(minOffset, dateOffset - 1))}
              disabled={dateOffset <= minOffset}
              className="flex items-center gap-1 w-32"
            >
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs md:text-sm">חודש אחורה</span>
            </Button>
            <span className="text-sm text-gray-600 px-3 py-1 bg-gray-50 rounded-lg whitespace-nowrap w-24 text-center">
              {dateOffset > 0 ? `+${dateOffset} חודשים` : dateOffset < 0 ? `${dateOffset} חודשים` : 'היום'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDateOffset(Math.min(maxOffset, dateOffset + 1))}
              disabled={dateOffset >= maxOffset}
              className="flex items-center gap-1 w-32"
            >
              <span className="text-xs md:text-sm">חודש קדימה</span>
              <ChevronLeft className="w-4 h-4 flex-shrink-0" />
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
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
        <div className="md:hidden relative border-r-2 border-gray-100 pr-6 mr-3 space-y-8 pb-4">
          {timelineData.stages.map((stage, index) => {
            const isActive = stage.status === 'in-progress';
            const isDone = stage.status === 'completed';
            const isOverdue = stage.status === 'overdue';

            return (
              <div key={stage.id} className="relative">
                {/* Timeline Dot */}
                <div className={`absolute -right-[31px] top-4 w-4 h-4 rounded-full border-2 border-white shadow-sm z-10 ${
                   isDone ? 'bg-emerald-500' : 
                   isActive ? 'bg-blue-500 animate-pulse' : 
                   isOverdue ? 'bg-red-500' : 'bg-gray-300'
                }`} />

                <div className={`bg-white rounded-xl p-4 shadow-sm border transition-all ${
                  isActive ? 'border-blue-200 ring-1 ring-blue-100 shadow-md' : 'border-gray-100'
                }`}>
                   <div className="flex justify-between items-start mb-3">
                      <div>
                         <h4 className={`font-bold text-lg ${isActive ? 'text-blue-900' : 'text-gray-800'}`}>{stage.title}</h4>
                         <div className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 bg-gray-50 inline-flex px-2 py-1 rounded-md">
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

                   {/* Progress Bar */}
                   <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-600 mb-1.5 font-medium">
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

                   {/* Footer Info */}
                   <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
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

        {/* Desktop Horizontal View */}
        <div className="hidden md:block pb-4">
          <div className="w-full pr-2">

            {/* Stages */}
            <div className="space-y-4 relative">
              {timelineData.stages.map((stage, index) => {
                const startPosition = (differenceInDays(stage.startDate, timelineData.startDate) / timelineData.totalDays) * 100;
                const width = (stage.durationDays / timelineData.totalDays) * 100;

                return (
                  <div key={stage.id} className="relative">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-64 flex-shrink-0">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(stage.status)}
                          <h4 className="font-semibold text-gray-800 text-sm">{stage.title}</h4>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span>{format(stage.startDate, 'd/M/yy')}</span>
                          <ChevronLeft className="w-3 h-3" />
                          <span>{format(stage.endDate, 'd/M/yy')}</span>
                        </div>
                      </div>

                      {/* Gantt Bar */}
                      <div className="flex-1 relative h-12 bg-gray-100 rounded-lg overflow-hidden">

                        {/* Today Line */}
                        {todayPosition >= 0 && todayPosition <= timelineData.totalDays && (
                          <div 
                            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                            style={{ right: `${todayPercentage}%` }}
                          >
                            {index === 0 && (
                              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg">
                                היום
                              </div>
                            )}
                          </div>
                        )}

                        {/* Bar */}
                        <motion.div
                          className="absolute top-1 h-10 rounded-lg shadow-md cursor-pointer"
                          style={{
                            width: `${width}%`,
                            right: `${startPosition}%`,
                          }}
                          layout
                          transition={{
                            type: "spring",
                            stiffness: 100,
                            damping: 20,
                          }}
                          onMouseEnter={() => setHoveredStageId(stage.id)}
                          onMouseLeave={() => setHoveredStageId(null)}
                        >
                          {/* Background */}
                          <div className={`absolute inset-0 ${getStatusColor(stage.status)} opacity-20`}></div>

                          {/* Progress */}
                          <div 
                            className={`absolute inset-0 ${getStatusColor(stage.status)} transition-all duration-500`}
                            style={{ width: `${stage.progress}%` }}
                          ></div>

                          {/* Border */}
                          <div className={`absolute inset-0 border-2 ${getStatusColor(stage.status)} border-opacity-50 rounded-lg`}></div>

                          {/* Label */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            {stage.progress > 5 && (
                              <div className={`${getStatusColor(stage.status)} px-2 py-1 rounded border-2 border-white`}>
                                <span className="text-xs font-bold text-white drop-shadow-sm">
                                  {Math.round(stage.progress)}%
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Hover Tooltip - Sticky */}
                          {hoveredStageId === stage.id && (
                            <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
                              <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl whitespace-nowrap pointer-events-auto">
                                <div className="font-semibold mb-1">{stage.title}</div>
                                <div className="text-gray-300">סטטוס: {getStatusText(stage.status)}</div>
                                <div className="text-gray-300">התקדמות: {Math.round(stage.progress)}%</div>
                                <div className="text-gray-300">משך: {stage.duration}</div>
                              </div>
                            </div>
                          )}
                          </motion.div>

                            {/* Dependency Arrow */}
                        {index < timelineData.stages.length - 1 && (
                          <div
                            className="absolute top-1/2 transform -translate-y-1/2 h-0.5 bg-gray-300"
                            style={{
                              right: `${startPosition + width}%`,
                              width: `${((differenceInDays(timelineData.stages[index + 1].startDate, stage.endDate) / timelineData.totalDays) * 100)}%`
                            }}
                          >
                            <ChevronLeft className="absolute left-0 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Status Badge */}
                      <div className="w-32 flex-shrink-0">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          stage.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                          stage.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          stage.status === 'overdue' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getStatusText(stage.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Timeline Footer - Months (below bars) */}
            <div className="mt-3 flex items-center gap-4">
              <div className="w-64 flex-shrink-0" />
              <div className="flex-1 flex border-t-2 border-gray-200 pt-2 overflow-hidden">
                {Array.from({ length: Math.ceil(timelineData.totalDays / 30) + 1 }).map((_, index) => {
                  const monthDate = addMonths(timelineData.startDate, index);
                  return (
                    <div
                      key={index}
                      className="flex-1 text-center text-xs font-medium text-gray-500"
                      style={{ minWidth: '80px' }}
                    >
                      {format(monthDate, 'MMM yy', { locale: he })}
                    </div>
                  );
                })}
              </div>
              <div className="w-32 flex-shrink-0" />
            </div>
          </div>
        </div>
    </div>

      {/* Critical Path Info */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-r-4 border-amber-500 rounded-xl p-5 text-right" dir="rtl">
        <div className="flex flex-row-reverse items-start gap-3">
          <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
          <div className="text-right w-full">
            <h4 className="font-semibold text-amber-900 mb-2 text-right">נתיב קריטי</h4>
            <p className="text-sm text-amber-800 leading-relaxed mb-3 text-right">
              כל השלבים בפרויקט מתוכננים ברצף. עיכוב בשלב אחד ישפיע על כל השלבים הבאים.
            </p>
            <div className="flex flex-wrap gap-2 justify-start">
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