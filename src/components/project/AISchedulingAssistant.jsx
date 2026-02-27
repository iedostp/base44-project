import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Sparkles, Clock, AlertTriangle, TrendingUp, CheckCircle2, Loader2, Calendar, Zap, Target, RefreshCw } from "lucide-react";
import { format, addDays, parseISO } from "date-fns";
import { he } from "date-fns/locale";

export default function AISchedulingAssistant({ project, stages, tasks, suppliers, onOptimizationApplied }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [optimization, setOptimization] = useState(null);
  const [error, setError] = useState(null);
  const [applying, setApplying] = useState(false);

  const analyzeSchedule = async () => {
    setAnalyzing(true);
    setError(null);

    try {
      // Prepare comprehensive data for AI
      const completedStages = stages.filter(s => s.completed);
      const remainingStages = stages.filter(s => !s.completed);
      const selectedSuppliers = suppliers.filter(s => s.status === 'selected');
      
      // Calculate current progress
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.done).length;
      const overallProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // Build detailed context
      const prompt = `
אתה יועץ מומחה לניהול לוחות זמנים בפרויקטי בנייה בישראל. נתח את הפרויקט הבא והמלץ על אופטימיזציה של לוח הזמנים.

**פרטי הפרויקט:**
- שם: ${project?.name || 'לא צוין'}
- תאריך התחלה: ${project?.start_date || 'לא הוגדר'}
- התקדמות כוללת: ${overallProgress.toFixed(1)}%
- שלבים שהושלמו: ${completedStages.length}/${stages.length}
- משימות שהושלמו: ${completedTasks}/${totalTasks}

**שלבים והתקדמותם:**
${stages.map((s, idx) => {
  const stageTasks = tasks.filter(t => t.stage_id === s.id);
  const stageCompletedTasks = stageTasks.filter(t => t.done).length;
  const stageProgress = stageTasks.length > 0 ? (stageCompletedTasks / stageTasks.length) * 100 : 0;
  return `
${idx + 1}. ${s.title}
   - משך משוער: ${s.duration}
   - התקדמות: ${stageProgress.toFixed(0)}% (${stageCompletedTasks}/${stageTasks.length} משימות)
   - עדיפות: ${s.priority}
   - סטטוס: ${s.completed ? 'הושלם' : 'בביצוע/ממתין'}
   - תקציב: ${s.budget_percentage}
`;
}).join('\n')}

**ספקים זמינים:**
${selectedSuppliers.map(s => `- ${s.name} (${s.category}): ${s.rating || 'ללא דירוג'} כוכבים`).join('\n') || 'טרם נבחרו ספקים'}

**ספקים בבדיקה:**
${suppliers.filter(s => s.status === 'under_consideration').length} ספקים נוספים בבדיקה

אנא נתח והמלץ על:
1. אופטימיזציה של לוח הזמנים - סדר שלבים מומלץ
2. זיהוי צווארי בקבוק פוטנציאליים
3. הערכת תאריכי סיום ריאליים לכל שלב
4. המלצות לשיפור היעילות
5. התראות על עיכובים צפויים

התייחס לתלות בין שלבים, זמינות משאבים, ועדיפויות.
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            overall_assessment: {
              type: "object",
              properties: {
                status: { 
                  type: "string", 
                  enum: ["on_track", "minor_delays", "significant_delays", "critical"],
                  description: "מצב לוח הזמנים הכללי"
                },
                summary: { type: "string" },
                estimated_completion_days: { type: "number" },
                delay_risk: { type: "string", enum: ["low", "medium", "high"] }
              }
            },
            bottlenecks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  stage_name: { type: "string" },
                  issue: { type: "string" },
                  impact: { type: "string", enum: ["low", "medium", "high", "critical"] },
                  recommendation: { type: "string" },
                  estimated_delay_days: { type: "number" }
                }
              }
            },
            optimized_timeline: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  stage_name: { type: "string" },
                  recommended_duration_days: { type: "number" },
                  can_parallel: { type: "boolean" },
                  parallel_with: { type: "string" },
                  priority_adjustment: { type: "string" },
                  reasoning: { type: "string" }
                }
              }
            },
            efficiency_improvements: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  area: { type: "string" },
                  suggestion: { type: "string" },
                  time_saving_days: { type: "number" },
                  effort_level: { type: "string", enum: ["low", "medium", "high"] }
                }
              }
            },
            critical_alerts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  alert: { type: "string" },
                  severity: { type: "string", enum: ["warning", "critical"] },
                  action_required: { type: "string" },
                  deadline: { type: "string" }
                }
              }
            },
            resource_recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  resource_type: { type: "string" },
                  recommendation: { type: "string" },
                  urgency: { type: "string", enum: ["low", "medium", "high"] }
                }
              }
            }
          }
        }
      });

      setOptimization(response);
    } catch (err) {
      console.error("AI Scheduling error:", err);
      setError("שגיאה בניתוח לוח הזמנים. נסה שוב מאוחר יותר.");
    } finally {
      setAnalyzing(false);
    }
  };

  const applyOptimization = async () => {
    if (!optimization?.optimized_timeline) return;
    
    setApplying(true);
    try {
      // Here you would update the stages with the optimized timeline
      // For now, we'll just notify the parent component
      if (onOptimizationApplied) {
        onOptimizationApplied(optimization);
      }
      alert('אופטימיזציה הוחלה בהצלחה! שים לב שלוח הזמנים עודכן.');
    } catch (err) {
      console.error("Error applying optimization:", err);
      alert('שגיאה בהחלת האופטימיזציה');
    } finally {
      setApplying(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'on_track': return 'from-emerald-500 to-green-600';
      case 'minor_delays': return 'from-amber-500 to-orange-600';
      case 'significant_delays': return 'from-orange-500 to-red-600';
      case 'critical': return 'from-red-500 to-pink-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'on_track': return 'על המסלול';
      case 'minor_delays': return 'עיכובים קלים';
      case 'significant_delays': return 'עיכובים משמעותיים';
      case 'critical': return 'קריטי';
      default: return 'לא ידוע';
    }
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getImpactText = (impact) => {
    switch (impact) {
      case 'low': return 'השפעה נמוכה';
      case 'medium': return 'השפעה בינונית';
      case 'high': return 'השפעה גבוהה';
      case 'critical': return 'השפעה קריטית';
      default: return '';
    }
  };

  if (!project?.start_date) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-2xl p-6">
        <div className="text-center">
          <Calendar className="w-12 h-12 text-purple-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">יועץ AI לתזמון</h3>
          <p className="text-gray-600 text-sm">הגדר תאריך התחלה לפרויקט כדי לקבל ניתוח תזמון AI</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Analyze Button */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-xl" dir="rtl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-white/20 p-2.5 rounded-xl flex-shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold leading-tight">יועץ AI חכם לתזמון</h3>
              <p className="text-purple-100 text-xs mt-0.5 leading-snug">אופטימיזציה אוטומטית של לוח הזמנים וזיהוי צווארי בקבוק</p>
            </div>
          </div>
          <Button
            onClick={analyzeSchedule}
            disabled={analyzing}
            className="bg-white text-purple-600 hover:bg-purple-50 font-semibold shadow-lg flex-shrink-0"
            size="sm"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 ml-1.5 animate-spin" />
                מנתח...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 ml-1.5" />
                נתח תזמון
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-800">
          <p className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </p>
        </div>
      )}

      {/* Optimization Results */}
      {optimization && (
        <div className="space-y-6">
          {/* Overall Assessment */}
          {optimization.overall_assessment && (
            <div className={`bg-gradient-to-r ${getStatusColor(optimization.overall_assessment.status)} rounded-2xl p-6 text-white shadow-lg`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold mb-2">מצב לוח הזמנים</h4>
                  <p className="text-3xl font-bold">{getStatusText(optimization.overall_assessment.status)}</p>
                </div>
                <Target className="w-12 h-12 opacity-50" />
              </div>
              <div className="bg-white/20 rounded-xl p-4 mb-4">
                <p className="text-sm leading-relaxed">{optimization.overall_assessment.summary}</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white/10 rounded-lg p-3">
                  <span className="opacity-90">זמן סיום משוער:</span>
                  <p className="font-bold text-lg mt-1">
                    {optimization.overall_assessment.estimated_completion_days} ימים
                    {project.start_date && (
                      <span className="text-xs block mt-1">
                        ({format(addDays(parseISO(project.start_date), optimization.overall_assessment.estimated_completion_days), 'd בMMMM yyyy', { locale: he })})
                      </span>
                    )}
                  </p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <span className="opacity-90">סיכון לעיכוב:</span>
                  <p className="font-bold text-lg mt-1">
                    {optimization.overall_assessment.delay_risk === 'high' ? 'גבוה' :
                     optimization.overall_assessment.delay_risk === 'medium' ? 'בינוני' : 'נמוך'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Critical Alerts */}
          {optimization.critical_alerts && optimization.critical_alerts.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-red-300">
              <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                התראות קריטיות
              </h4>
              <div className="space-y-3">
                {optimization.critical_alerts.map((alert, index) => (
                  <div key={index} className={`p-4 rounded-xl border-2 ${
                    alert.severity === 'critical' ? 'bg-red-50 border-red-300' : 'bg-amber-50 border-amber-300'
                  }`}>
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        alert.severity === 'critical' ? 'text-red-600' : 'text-amber-600'
                      }`} />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 mb-1">{alert.alert}</p>
                        <p className="text-sm text-gray-600 mb-2">{alert.action_required}</p>
                        {alert.deadline && (
                          <p className="text-xs text-gray-500">
                            <Clock className="w-3 h-3 inline ml-1" />
                            דדליין: {alert.deadline}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottlenecks */}
          {optimization.bottlenecks && optimization.bottlenecks.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-orange-600" />
                צווארי בקבוק מזוהים
              </h4>
              <div className="space-y-4">
                {optimization.bottlenecks.map((bottleneck, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <h5 className="font-bold text-gray-800">{bottleneck.stage_name}</h5>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getImpactColor(bottleneck.impact)}`}>
                        {getImpactText(bottleneck.impact)}
                      </span>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                      <p className="text-sm font-semibold text-orange-900 mb-1">בעיה:</p>
                      <p className="text-sm text-orange-800">{bottleneck.issue}</p>
                    </div>
                    {bottleneck.estimated_delay_days > 0 && (
                      <div className="flex items-center gap-2 text-sm text-red-700 mb-2">
                        <Clock className="w-4 h-4" />
                        <span>עיכוב משוער: {bottleneck.estimated_delay_days} ימים</span>
                      </div>
                    )}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm font-semibold text-green-900 mb-1">המלצה:</p>
                      <p className="text-sm text-green-800">{bottleneck.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optimized Timeline */}
          {optimization.optimized_timeline && optimization.optimized_timeline.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-blue-600" />
                  לוח זמנים מאופטמז
                </h4>
                <Button
                  onClick={applyOptimization}
                  disabled={applying}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md"
                >
                  {applying ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      מחיל...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 ml-2" />
                      החל אופטימיזציה
                    </>
                  )}
                </Button>
              </div>
              <div className="space-y-3">
                {optimization.optimized_timeline.map((timeline, index) => (
                  <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-bold text-gray-800">{timeline.stage_name}</h5>
                      <div className="flex items-center gap-2">
                        <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                          {timeline.recommended_duration_days} ימים
                        </span>
                        {timeline.can_parallel && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                            ניתן למקבל
                          </span>
                        )}
                      </div>
                    </div>
                    {timeline.parallel_with && (
                      <p className="text-xs text-blue-700 mb-2">
                        🔄 ניתן לבצע במקביל עם: {timeline.parallel_with}
                      </p>
                    )}
                    {timeline.priority_adjustment && (
                      <p className="text-xs text-purple-700 mb-2">
                        ⚡ התאמת עדיפות: {timeline.priority_adjustment}
                      </p>
                    )}
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <p className="text-sm text-gray-700">{timeline.reasoning}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Efficiency Improvements */}
          {optimization.efficiency_improvements && optimization.efficiency_improvements.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-green-600" />
                שיפורי יעילות
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                {optimization.efficiency_improvements.map((improvement, index) => (
                  <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                    <div className="flex items-start justify-between mb-3">
                      <h5 className="font-semibold text-gray-800">{improvement.area}</h5>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        improvement.effort_level === 'high' ? 'bg-red-100 text-red-800' :
                        improvement.effort_level === 'medium' ? 'bg-amber-100 text-amber-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {improvement.effort_level === 'high' ? 'מאמץ גבוה' :
                         improvement.effort_level === 'medium' ? 'מאמץ בינוני' : 'מאמץ נמוך'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{improvement.suggestion}</p>
                    {improvement.time_saving_days > 0 && (
                      <div className="flex items-center gap-2 text-sm text-green-700 bg-white rounded-lg p-2 border border-green-300">
                        <Clock className="w-4 h-4" />
                        <span className="font-semibold">חיסכון: {improvement.time_saving_days} ימים</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resource Recommendations */}
          {optimization.resource_recommendations && optimization.resource_recommendations.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <RefreshCw className="w-6 h-6 text-purple-600" />
                המלצות משאבים
              </h4>
              <div className="space-y-3">
                {optimization.resource_recommendations.map((rec, index) => (
                  <div key={index} className={`p-4 rounded-xl border ${
                    rec.urgency === 'high' ? 'bg-red-50 border-red-300' :
                    rec.urgency === 'medium' ? 'bg-amber-50 border-amber-300' :
                    'bg-blue-50 border-blue-300'
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-semibold text-gray-800">{rec.resource_type}</h5>
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        rec.urgency === 'high' ? 'bg-red-100 text-red-800' :
                        rec.urgency === 'medium' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {rec.urgency === 'high' ? 'דחוף' : rec.urgency === 'medium' ? 'בינוני' : 'נמוך'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{rec.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}