import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, AlertTriangle, CheckCircle2, Info, XCircle, Lightbulb, FileText, Target, Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AIDocumentAnalyzer({ document, project, stages, isOpen, onClose }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const analyzeDocument = async () => {
    setAnalyzing(true);
    setError(null);

    try {
      const prompt = `
אתה מומחה לניהול ובקרת איכות בפרויקטי בנייה בישראל. נתח את המסמך הבא והשווה אותו מול מפרטי הפרויקט, תקנים ישראליים, וממצאים היסטוריים.

**פרטי המסמך:**
- שם: ${document.name}
- קטגוריה: ${getCategoryText(document.category)}
- תאריך: ${document.created_date}
${document.extracted_data ? `
- מידע שחולץ:
  ${document.extracted_data.document_date ? `תאריך במסמך: ${document.extracted_data.document_date}` : ''}
  ${document.extracted_data.amount ? `סכום: ${document.extracted_data.amount.toLocaleString()} ₪` : ''}
  ${document.extracted_data.parties ? `צדדים: ${document.extracted_data.parties.join(', ')}` : ''}
  ${document.extracted_data.reference_number ? `מספר אסמכתא: ${document.extracted_data.reference_number}` : ''}
` : ''}

**פרטי הפרויקט:**
- שם הפרויקט: ${project?.name || 'לא צוין'}
- תקציב כולל: ${project?.total_budget ? project.total_budget.toLocaleString() + ' ₪' : 'לא הוגדר'}
- מספר שלבים: ${stages?.length || 0}

**שלבי הפרויקט:**
${stages?.map((s, i) => `${i + 1}. ${s.title} (${s.budget_percentage} מהתקציב)`).join('\n') || 'אין שלבים'}

אנא נתח את המסמך (תוכנו, הנתונים שחולצו, והקשר לפרויקט) והמלץ על:

1. **בעיות איכות פוטנציאליות** - זהה בעיות כמו:
   - סטיות ממפרטים
   - חוסר עמידה בתקנים ישראליים
   - בעיות בטיחות
   - חומרים לא מתאימים

2. **חוסרי התאמה** - השווה בין:
   - הסכומים במסמך לתקציב המתוכנן
   - תאריכים לעומת לוח הזמנים
   - מפרטים לעומת דרישות הפרויקט
   - צדדים מול גורמים מורשים

3. **סטיות מתקנים** - בדוק התאמה ל:
   - תקנים ישראליים (תקן ישראלי)
   - דרישות רגולציה
   - קוד בנייה
   - דרישות בטיחות

4. **המלצות Best Practices** - הצע:
   - שיפורים בתהליכי העבודה
   - שימוש בטכנולוגיות מתקדמות
   - אופטימיזציה של עלויות
   - שיפור בטיחות ואיכות

5. **הערות קריטיות** - דגש על:
   - סיכונים משמעותיים
   - פעולות דחופות נדרשות
   - נקודות לתשומת לב מיוחדת

ספק ניתוח מקצועי, מפורט ומעשי בעברית.
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        file_urls: document.file_url,
        response_json_schema: {
          type: "object",
          properties: {
            overall_assessment: {
              type: "object",
              properties: {
                status: { 
                  type: "string", 
                  enum: ["excellent", "good", "concerning", "critical"],
                  description: "מצב כללי של המסמך"
                },
                summary: { type: "string" },
                confidence_level: { type: "string", enum: ["high", "medium", "low"] }
              }
            },
            quality_issues: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  issue: { type: "string" },
                  severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                  description: { type: "string" },
                  recommendation: { type: "string" },
                  standard_reference: { type: "string" }
                }
              }
            },
            inconsistencies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["budget", "timeline", "specification", "party"] },
                  description: { type: "string" },
                  expected: { type: "string" },
                  actual: { type: "string" },
                  impact: { type: "string" }
                }
              }
            },
            standard_deviations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  standard: { type: "string" },
                  deviation: { type: "string" },
                  severity: { type: "string", enum: ["minor", "moderate", "major"] },
                  required_action: { type: "string" }
                }
              }
            },
            best_practices: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  area: { type: "string" },
                  recommendation: { type: "string" },
                  benefit: { type: "string" },
                  implementation: { type: "string" }
                }
              }
            },
            critical_notes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  note: { type: "string" },
                  urgency: { type: "string", enum: ["immediate", "urgent", "moderate"] },
                  action: { type: "string" }
                }
              }
            }
          }
        }
      });

      setAnalysis(response);
    } catch (err) {
      console.error("Document analysis error:", err);
      setError("שגיאה בניתוח המסמך. נסה שוב מאוחר יותר.");
    } finally {
      setAnalyzing(false);
    }
  };

  const getCategoryText = (category) => {
    const texts = {
      'contract': 'חוזה',
      'permit': 'היתר',
      'invoice': 'חשבונית',
      'plan': 'תוכנית',
      'specification': 'מפרט',
      'certificate': 'אישור',
      'correspondence': 'התכתבות',
      'other': 'אחר'
    };
    return texts[category] || 'אחר';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'from-emerald-500 to-green-600';
      case 'good': return 'from-blue-500 to-indigo-600';
      case 'concerning': return 'from-amber-500 to-orange-600';
      case 'critical': return 'from-red-500 to-pink-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'excellent': return 'מצוין';
      case 'good': return 'טוב';
      case 'concerning': return 'מדאיג';
      case 'critical': return 'קריטי';
      default: return 'לא ידוע';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityText = (severity) => {
    switch (severity) {
      case 'low': return 'נמוכה';
      case 'medium': return 'בינונית';
      case 'high': return 'גבוהה';
      case 'critical': return 'קריטית';
      default: return '';
    }
  };

  const getInconsistencyIcon = (type) => {
    switch (type) {
      case 'budget': return '💰';
      case 'timeline': return '⏰';
      case 'specification': return '📋';
      case 'party': return '👥';
      default: return '⚠️';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            ניתוח AI מתקדם - {document?.name}
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            ניתוח איכות, התאמה לתקנים והמלצות מקצועיות
          </p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Analyze Button */}
          {!analysis && !analyzing && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-2xl p-8 text-center">
              <Sparkles className="w-16 h-16 text-purple-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">ניתוח מסמך מתקדם</h3>
              <p className="text-gray-600 mb-6">
                ה-AI ינתח את המסמך, יזהה בעיות איכות, יבדוק התאמה לתקנים ויציע המלצות מקצועיות
              </p>
              <Button
                onClick={analyzeDocument}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg"
                size="lg"
              >
                <Sparkles className="w-5 h-5 me-2" />
                התחל ניתוח
              </Button>
            </div>
          )}

          {/* Analyzing */}
          {analyzing && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-8 text-center">
              <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">מנתח מסמך...</h3>
              <p className="text-gray-600">
                זה עשוי לקחת מספר שניות. AI קורא ומנתח את המסמך לעומק
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-800">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">שגיאה בניתוח</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Analysis Results */}
          {analysis && (
            <div className="space-y-6">
              {/* Overall Assessment */}
              {analysis.overall_assessment && (
                <div className={`bg-gradient-to-r ${getStatusColor(analysis.overall_assessment.status)} rounded-2xl p-6 text-white shadow-lg`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold mb-2">הערכה כללית</h4>
                      <p className="text-3xl font-bold">{getStatusText(analysis.overall_assessment.status)}</p>
                    </div>
                    <Shield className="w-12 h-12 opacity-50" />
                  </div>
                  <div className="bg-white/20 rounded-xl p-4 mb-3">
                    <p className="text-sm leading-relaxed">{analysis.overall_assessment.summary}</p>
                  </div>
                  <div className="text-sm">
                    <span className="opacity-90">רמת ביטחון: </span>
                    <span className="font-bold">
                      {analysis.overall_assessment.confidence_level === 'high' ? 'גבוהה' :
                       analysis.overall_assessment.confidence_level === 'medium' ? 'בינונית' : 'נמוכה'}
                    </span>
                  </div>
                </div>
              )}

              {/* Critical Notes */}
              {analysis.critical_notes && analysis.critical_notes.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-red-300">
                  <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                    הערות קריטיות
                  </h4>
                  <div className="space-y-3">
                    {analysis.critical_notes.map((note, index) => (
                      <div key={index} className={`p-4 rounded-xl border-2 ${
                        note.urgency === 'immediate' ? 'bg-red-50 border-red-300' :
                        note.urgency === 'urgent' ? 'bg-orange-50 border-orange-300' :
                        'bg-amber-50 border-amber-300'
                      }`}>
                        <div className="flex items-start gap-3">
                          <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                            note.urgency === 'immediate' ? 'text-red-600' :
                            note.urgency === 'urgent' ? 'text-orange-600' :
                            'text-amber-600'
                          }`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                                note.urgency === 'immediate' ? 'bg-red-100 text-red-800' :
                                note.urgency === 'urgent' ? 'bg-orange-100 text-orange-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {note.urgency === 'immediate' ? 'דחוף ביותר' :
                                 note.urgency === 'urgent' ? 'דחוף' : 'בינוני'}
                              </span>
                            </div>
                            <p className="font-semibold text-gray-800 mb-2">{note.note}</p>
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold">פעולה נדרשת:</span> {note.action}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quality Issues */}
              {analysis.quality_issues && analysis.quality_issues.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                  <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                    בעיות איכות פוטנציאליות
                  </h4>
                  <div className="space-y-4">
                    {analysis.quality_issues.map((issue, index) => (
                      <div key={index} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <h5 className="font-bold text-gray-800">{issue.issue}</h5>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(issue.severity)}`}>
                            חומרה: {getSeverityText(issue.severity)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">{issue.description}</p>
                        {issue.standard_reference && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
                            <p className="text-xs text-blue-800">
                              <span className="font-semibold">התייחסות לתקן:</span> {issue.standard_reference}
                            </p>
                          </div>
                        )}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-sm font-semibold text-green-900 mb-1">המלצה:</p>
                          <p className="text-sm text-green-800">{issue.recommendation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inconsistencies */}
              {analysis.inconsistencies && analysis.inconsistencies.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                  <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Info className="w-6 h-6 text-blue-600" />
                    חוסרי התאמה
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {analysis.inconsistencies.map((inconsistency, index) => (
                      <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-2xl">{getInconsistencyIcon(inconsistency.type)}</span>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                            {inconsistency.type === 'budget' ? 'תקציב' :
                             inconsistency.type === 'timeline' ? 'לוח זמנים' :
                             inconsistency.type === 'specification' ? 'מפרט' : 'צדדים'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">{inconsistency.description}</p>
                        <div className="space-y-2 text-xs">
                          <div className="flex items-start gap-2">
                            <span className="text-gray-600 font-semibold">צפוי:</span>
                            <span className="text-gray-800">{inconsistency.expected}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-gray-600 font-semibold">בפועל:</span>
                            <span className="text-gray-800">{inconsistency.actual}</span>
                          </div>
                        </div>
                        <div className="mt-3 p-2 bg-amber-100 rounded-lg border border-amber-300">
                          <p className="text-xs text-amber-900">
                            <span className="font-semibold">השפעה:</span> {inconsistency.impact}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Standard Deviations */}
              {analysis.standard_deviations && analysis.standard_deviations.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                  <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Target className="w-6 h-6 text-purple-600" />
                    סטיות מתקנים
                  </h4>
                  <div className="space-y-3">
                    {analysis.standard_deviations.map((deviation, index) => (
                      <div key={index} className={`p-4 rounded-xl border ${
                        deviation.severity === 'major' ? 'bg-red-50 border-red-300' :
                        deviation.severity === 'moderate' ? 'bg-amber-50 border-amber-300' :
                        'bg-blue-50 border-blue-300'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-bold text-gray-800">{deviation.standard}</h5>
                          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                            deviation.severity === 'major' ? 'bg-red-100 text-red-800' :
                            deviation.severity === 'moderate' ? 'bg-amber-100 text-amber-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {deviation.severity === 'major' ? 'חמור' :
                             deviation.severity === 'moderate' ? 'בינוני' : 'קל'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">{deviation.deviation}</p>
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <p className="text-sm font-semibold text-gray-800 mb-1">פעולה נדרשת:</p>
                          <p className="text-sm text-gray-700">{deviation.required_action}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Best Practices */}
              {analysis.best_practices && analysis.best_practices.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                  <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Lightbulb className="w-6 h-6 text-yellow-600" />
                    המלצות Best Practices
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {analysis.best_practices.map((practice, index) => (
                      <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                        <h5 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          {practice.area}
                        </h5>
                        <p className="text-sm text-gray-700 mb-3">{practice.recommendation}</p>
                        <div className="space-y-2">
                          <div className="bg-green-100 rounded-lg p-2">
                            <p className="text-xs text-green-900">
                              <span className="font-semibold">תועלת:</span> {practice.benefit}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-2 border border-green-300">
                            <p className="text-xs text-gray-700">
                              <span className="font-semibold">יישום:</span> {practice.implementation}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}