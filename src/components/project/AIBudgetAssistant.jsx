import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingDown, AlertTriangle, Lightbulb, Target, Loader2, BarChart3, CheckCircle2, XCircle } from "lucide-react";

export default function AIBudgetAssistant({ project, stages, suppliers, expenses = [] }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const analyzeWithAI = async () => {
    setAnalyzing(true);
    setError(null);
    
    try {
      // Prepare data for AI analysis
      const completedStages = stages.filter(s => s.completed);
      const remainingStages = stages.filter(s => !s.completed);
      const selectedSuppliers = suppliers.filter(s => s.status === 'selected');
      
      const totalBudget = project?.total_budget || 0;
      const actualExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
      const estimatedFromStages = completedStages.reduce((acc, stage) => {
        const percent = parseFloat(stage.budget_percentage) || 0;
        return acc + (totalBudget * percent / 100);
      }, 0);
      const spentBudget = actualExpenses > 0 ? actualExpenses : estimatedFromStages;

      const remainingBudget = totalBudget - spentBudget;
      const plannedRemainingBudget = remainingStages.reduce((acc, stage) => {
        const percent = parseFloat(stage.budget_percentage) || 0;
        return acc + (totalBudget * percent / 100);
      }, 0);

      // Top expensive categories from actual expenses
      const categoryTotals = {};
      expenses.forEach(e => {
        categoryTotals[e.category || 'other'] = (categoryTotals[e.category || 'other'] || 0) + (e.amount || 0);
      });
      const topCategories = Object.entries(categoryTotals).sort((a,b) => b[1]-a[1]).slice(0,3);

      // Build context for AI
      const prompt = `
אתה יועץ כלכלי מומחה לפרויקטי בנייה פרטית בישראל. נתח את המידע הבא על פרויקט "בנה ביתך" והמלץ על אופטימיזציה של התקציב.

**פרטי הפרויקט:**
- שם הפרויקט: ${project?.name || 'לא צוין'}
- תקציב כולל: ${totalBudget.toLocaleString()} ₪
- הוצאות בפועל מתועדות: ${actualExpenses.toLocaleString()} ₪ (${expenses.length} הוצאות)
- הוצאה משוערת (לפי שלבים שהושלמו): ${estimatedFromStages.toLocaleString()} ₪
- הוצאה המשמשת לניתוח: ${spentBudget.toLocaleString()} ₪ (${completedStages.length} שלבים הושלמו)
- תקציב שנותר: ${remainingBudget.toLocaleString()} ₪
- תקציב מתוכנן לשלבים הנותרים: ${plannedRemainingBudget.toLocaleString()} ₪ (${remainingStages.length} שלבים)
${topCategories.length > 0 ? `- קטגוריות ההוצאה העיקריות: ${topCategories.map(([k,v]) => `${k}: ${v.toLocaleString()} ₪`).join(', ')}` : ''}

**שלבים שהושלמו:**
${completedStages.map(s => `- ${s.title}: ${s.budget_percentage} מהתקציב הכולל`).join('\n')}

**שלבים שנותרו:**
${remainingStages.map(s => `- ${s.title}: ${s.budget_percentage} מהתקציב הכולל, משך: ${s.duration}`).join('\n')}

**ספקים שנבחרו:**
${selectedSuppliers.map(s => `- ${s.name} (קטגוריה: ${s.category}): טווח מחירים ${s.price_range}, דירוג: ${s.rating || 'לא צוין'}`).join('\n') || 'טרם נבחרו ספקים'}

**ספקים בבדיקה:**
${suppliers.filter(s => s.status === 'under_consideration').map(s => `- ${s.name} (קטגוריה: ${s.category}): טווח מחירים ${s.price_range}`).join('\n') || 'אין ספקים בבדיקה'}

אנא נתח והמלץ על:
1. האם יש סיכון לחריגה מהתקציב?
2. המלצות לחיסכון בעלויות
3. תחזית תקציב לשלבים הנותרים
4. המלצות לגבי בחירת ספקים
5. נקודות תשומת לב קריטיות

ספק ניתוח מעמיק, מפורט ומקצועי בעברית.
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            overall_status: {
              type: "string",
              enum: ["healthy", "warning", "critical"],
              description: "מצב כללי של התקציב"
            },
            budget_overrun_risk: {
              type: "object",
              properties: {
                risk_level: { type: "string", enum: ["low", "medium", "high"] },
                explanation: { type: "string" },
                estimated_overrun: { type: "number" }
              }
            },
            cost_saving_recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  recommendation: { type: "string" },
                  potential_savings: { type: "number" },
                  priority: { type: "string", enum: ["high", "medium", "low"] }
                }
              }
            },
            supplier_recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  supplier_name: { type: "string" },
                  recommendation: { type: "string" },
                  action: { type: "string", enum: ["select", "reconsider", "negotiate"] }
                }
              }
            },
            remaining_stages_prediction: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  stage_name: { type: "string" },
                  predicted_cost: { type: "number" },
                  confidence: { type: "string", enum: ["high", "medium", "low"] },
                  notes: { type: "string" }
                }
              }
            },
            critical_alerts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  alert: { type: "string" },
                  severity: { type: "string", enum: ["critical", "warning", "info"] },
                  action_needed: { type: "string" }
                }
              }
            },
            summary: {
              type: "string",
              description: "סיכום כללי של הניתוח"
            }
          }
        }
      });

      setAnalysis(response);
    } catch (err) {
      console.error("AI Analysis error:", err);
      setError("שגיאה בניתוח. נסה שוב מאוחר יותר.");
    } finally {
      setAnalyzing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'from-emerald-500 to-green-600';
      case 'warning': return 'from-amber-500 to-orange-600';
      case 'critical': return 'from-red-500 to-pink-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'healthy': return 'תקין';
      case 'warning': return 'דורש תשומת לב';
      case 'critical': return 'קריטי';
      default: return 'לא ידוע';
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'low': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRiskText = (level) => {
    switch (level) {
      case 'low': return 'סיכון נמוך';
      case 'medium': return 'סיכון בינוני';
      case 'high': return 'סיכון גבוה';
      default: return 'לא ידוע';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'medium': return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'low': return <Lightbulb className="w-4 h-4 text-blue-600" />;
      default: return <Lightbulb className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'info': return <CheckCircle2 className="w-5 h-5 text-blue-600" />;
      default: return <CheckCircle2 className="w-5 h-5 text-gray-600" />;
    }
  };

  if (!project?.total_budget) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-blue-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">יועץ AI לתקציב</h3>
          <p className="text-gray-600 text-sm">הגדר תקציב כולל לפרויקט כדי לקבל ניתוח AI מתקדם</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Analyze Button */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-4 md:p-6 text-white shadow-xl" dir="rtl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="bg-white/20 p-2.5 rounded-xl shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="min-w-0 text-right">
              <h3 className="text-lg font-bold leading-tight">יועץ AI חכם לתקציב</h3>
              <p className="text-purple-100 text-xs mt-0.5">ניתוח מתקדם של דפוסי הוצאה והמלצות אישיות</p>
            </div>
          </div>
          <Button
            onClick={analyzeWithAI}
            disabled={analyzing}
            className="bg-white text-purple-600 hover:bg-purple-50 font-semibold shadow-lg shrink-0 self-start sm:self-auto"
            size="sm"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 ml-1 animate-spin" />
                מנתח...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 ml-1" />
                נתח תקציב
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-800">
          <p className="flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            {error}
          </p>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Overall Status */}
          <div className={`bg-gradient-to-r ${getStatusColor(analysis.overall_status)} rounded-2xl p-6 text-white shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold mb-2">מצב התקציב הכללי</h4>
                <p className="text-2xl font-bold">{getStatusText(analysis.overall_status)}</p>
              </div>
              <Target className="w-12 h-12 opacity-50" />
            </div>
          </div>

          {/* Summary */}
          {analysis.summary && (
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                סיכום ניתוח
              </h4>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{analysis.summary}</p>
            </div>
          )}

          {/* Budget Overrun Risk */}
          {analysis.budget_overrun_risk && (
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
                סיכון לחריגה מהתקציב
              </h4>
              <div className="flex items-start gap-4 mb-4">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${getRiskColor(analysis.budget_overrun_risk.risk_level)}`}>
                  {getRiskText(analysis.budget_overrun_risk.risk_level)}
                </span>
                {analysis.budget_overrun_risk.estimated_overrun > 0 && (
                  <div className="bg-red-50 px-4 py-2 rounded-lg border border-red-200">
                    <p className="text-sm text-red-800">
                      <span className="font-semibold">חריגה משוערת:</span> {analysis.budget_overrun_risk.estimated_overrun.toLocaleString()} ₪
                    </p>
                  </div>
                )}
              </div>
              <p className="text-gray-700 leading-relaxed">{analysis.budget_overrun_risk.explanation}</p>
            </div>
          )}

          {/* Critical Alerts */}
          {analysis.critical_alerts && analysis.critical_alerts.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-red-300">
              <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <XCircle className="w-6 h-6 text-red-600" />
                התראות קריטיות
              </h4>
              <div className="space-y-3">
                {analysis.critical_alerts.map((alert, index) => (
                  <div key={index} className={`p-4 rounded-xl border-2 ${
                    alert.severity === 'critical' ? 'bg-red-50 border-red-300' :
                    alert.severity === 'warning' ? 'bg-amber-50 border-amber-300' :
                    'bg-blue-50 border-blue-300'
                  }`}>
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 mb-1">{alert.alert}</p>
                        <p className="text-sm text-gray-600">{alert.action_needed}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cost Saving Recommendations */}
          {analysis.cost_saving_recommendations && analysis.cost_saving_recommendations.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingDown className="w-6 h-6 text-green-600" />
                המלצות לחיסכון בעלויות
              </h4>
              <div className="space-y-4">
                {analysis.cost_saving_recommendations.map((rec, index) => (
                  <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                    <div className="flex items-start gap-3">
                      {getPriorityIcon(rec.priority)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold text-gray-800">{rec.category}</h5>
                          {rec.potential_savings > 0 && (
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                              חיסכון: {rec.potential_savings.toLocaleString()} ₪
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed">{rec.recommendation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Supplier Recommendations */}
          {analysis.supplier_recommendations && analysis.supplier_recommendations.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Lightbulb className="w-6 h-6 text-blue-600" />
                המלצות לגבי ספקים
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                {analysis.supplier_recommendations.map((rec, index) => (
                  <div key={index} className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-start gap-3">
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        rec.action === 'select' ? 'bg-green-100 text-green-800' :
                        rec.action === 'negotiate' ? 'bg-amber-100 text-amber-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {rec.action === 'select' ? 'מומלץ' : rec.action === 'negotiate' ? 'נהל משא ומתן' : 'שקול מחדש'}
                      </div>
                    </div>
                    <h5 className="font-semibold text-gray-800 mt-2 mb-1">{rec.supplier_name}</h5>
                    <p className="text-sm text-gray-700">{rec.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Remaining Stages Prediction */}
          {analysis.remaining_stages_prediction && analysis.remaining_stages_prediction.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl font-bold text-purple-600">₪</span>
                תחזית עלויות לשלבים הנותרים
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">שלב</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">עלות חזויה</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">רמת ביטחון</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">הערות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.remaining_stages_prediction.map((pred, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-800">{pred.stage_name}</td>
                        <td className="py-3 px-4 text-gray-700 font-semibold">
                          {pred.predicted_cost.toLocaleString()} ₪
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            pred.confidence === 'high' ? 'bg-green-100 text-green-800' :
                            pred.confidence === 'medium' ? 'bg-amber-100 text-amber-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {pred.confidence === 'high' ? 'גבוהה' : pred.confidence === 'medium' ? 'בינונית' : 'נמוכה'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{pred.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                <p className="text-sm text-purple-900">
                  <span className="font-semibold">סה"כ חזוי לשלבים הנותרים:</span>{' '}
                  {analysis.remaining_stages_prediction.reduce((sum, p) => sum + p.predicted_cost, 0).toLocaleString()} ₪
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}