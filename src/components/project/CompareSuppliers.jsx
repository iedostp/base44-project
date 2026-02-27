import React, { useState } from "react";
import { X, Star, MapPin, Phone, Mail, DollarSign, Award, FileText, Sparkles, Download, Loader2, TrendingDown, AlertTriangle, Lightbulb, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";

export default function CompareSuppliers({ suppliers, onClose, isOpen }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [error, setError] = useState(null);

  const getCategoryText = (category) => {
    const categories = {
      'windows': 'חלונות ודלתות',
      'tiles': 'ריצוף וחיפויים',
      'kitchen': 'מטבחים',
      'sanitary': 'סניטציה',
      'ac': 'מזגנים',
      'electrical': 'ציוד חשמלי',
      'carpentry': 'נגרות',
      'plumbing': 'אינסטלציה',
      'painting': 'צביעה',
      'other': 'אחר'
    };
    return categories[category] || category;
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'selected': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'under_consideration': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'selected': return 'נבחר ✓';
      case 'under_consideration': return 'בבדיקה';
      case 'rejected': return 'נדחה';
      default: return 'לא יצרנו קשר';
    }
  };

  const analyzeWithAI = async () => {
    setAnalyzing(true);
    setError(null);

    try {
      const prompt = `
אתה יועץ מומחה לניהול ספקים בפרויקטי בנייה בישראל. נתח את הספקים הבאים והמלץ על הבחירה הטובה ביותר.

**ספקים להשוואה:**
${suppliers.map((s, i) => `
${i + 1}. ${s.name}
   - קטגוריה: ${getCategoryText(s.category)}
   - דירוג: ${s.rating || 'לא צוין'}
   - טווח מחירים: ${s.price_range || 'לא צוין'}
   - סטטוס: ${getStatusText(s.status)}
   - מיקום: ${s.address || 'לא צוין'}
   - הערות: ${s.notes || 'אין הערות'}
`).join('\n')}

אנא נתח והמלץ על:
1. ציון השוואתי לכל ספק (0-100)
2. זיהוי סיכונים פוטנציאליים לכל ספק
3. נקודות משא ומתן מומלצות
4. המלצה סופית - איזה ספק לבחור ולמה

ספק ניתוח מקצועי ומפורט בעברית.
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            supplier_scores: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  supplier_name: { type: "string" },
                  score: { type: "number", minimum: 0, maximum: 100 },
                  strengths: { 
                    type: "array",
                    items: { type: "string" }
                  },
                  weaknesses: {
                    type: "array",
                    items: { type: "string" }
                  }
                }
              }
            },
            risk_analysis: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  supplier_name: { type: "string" },
                  risk_level: { type: "string", enum: ["low", "medium", "high"] },
                  risks: {
                    type: "array",
                    items: { type: "string" }
                  },
                  mitigation: { type: "string" }
                }
              }
            },
            negotiation_points: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  supplier_name: { type: "string" },
                  points: {
                    type: "array",
                    items: { type: "string" }
                  },
                  leverage: { type: "string" }
                }
              }
            },
            final_recommendation: {
              type: "object",
              properties: {
                recommended_supplier: { type: "string" },
                reasoning: { type: "string" },
                confidence_level: { type: "string", enum: ["high", "medium", "low"] },
                alternative: { type: "string" }
              }
            },
            market_insights: {
              type: "string",
              description: "תובנות שוק כלליות על הקטגוריה"
            }
          }
        }
      });

      setAiInsights(response);
    } catch (err) {
      console.error("AI Analysis error:", err);
      setError("שגיאה בניתוח. נסה שוב מאוחר יותר.");
    } finally {
      setAnalyzing(false);
    }
  };

  const saveComparisonReport = () => {
    const report = {
      date: new Date().toISOString(),
      suppliers: suppliers,
      aiInsights: aiInsights
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `supplier-comparison-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const bestRating = Math.max(...suppliers.map(s => s.rating || 0));

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-gray-800 text-center">
                השוואת ספקים - ניתוח מתקדם
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1 text-center">
                משווה {suppliers.length} ספקים בקטגוריה {getCategoryText(suppliers[0]?.category)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {aiInsights && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveComparisonReport}
                  className="border-green-500 text-green-700 hover:bg-green-50"
                >
                  <Download className="w-4 h-4 ml-2" />
                  שמור דוח
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* AI Analysis Button */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-lg text-right">ניתוח AI חכם</h4>
              <p className="text-xs text-purple-100 text-right">קבל המלצות מקצועיות ונקודות למשא ומתן</p>
            </div>
            </div>
            <Button
              onClick={analyzeWithAI}
              disabled={analyzing}
              className="bg-white text-purple-600 hover:bg-purple-50 font-semibold shadow-md"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  מנתח...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 ml-2" />
                  נתח ספקים
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-800 mb-6">
            <p className="flex items-center gap-2">
              <X className="w-5 h-5" />
              {error}
            </p>
          </div>
        )}

        {/* AI Insights */}
        {aiInsights && (
          <div className="space-y-6 mb-6">
            {/* Final Recommendation */}
            {aiInsights.final_recommendation && (
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-2xl p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="bg-emerald-500 p-2 rounded-lg">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-xl text-gray-800 mb-1 text-right">המלצה סופית</h4>
                    <p className="text-sm text-gray-600 text-right">
                      רמת ביטחון: <span className="font-semibold">{
                        aiInsights.final_recommendation.confidence_level === 'high' ? 'גבוהה' :
                        aiInsights.final_recommendation.confidence_level === 'medium' ? 'בינונית' : 'נמוכה'
                      }</span>
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 mb-3">
                  <p className="font-bold text-emerald-900 text-lg mb-2 text-right">
                    מומלץ: {aiInsights.final_recommendation.recommended_supplier}
                  </p>
                  <p className="text-gray-700 leading-relaxed text-right">{aiInsights.final_recommendation.reasoning}</p>
                </div>
                {aiInsights.final_recommendation.alternative && (
                  <p className="text-sm text-gray-700 text-right">
                    <span className="font-semibold">חלופה:</span> {aiInsights.final_recommendation.alternative}
                  </p>
                )}
              </div>
            )}

            {/* Supplier Scores */}
            {aiInsights.supplier_scores && aiInsights.supplier_scores.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Award className="w-6 h-6 text-blue-600" />
                  ציונים השוואתיים
                </h4>
                <div className="space-y-4">
                  {aiInsights.supplier_scores.map((score, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-bold text-lg text-gray-800">{score.supplier_name}</h5>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="text-3xl font-bold text-blue-600">{score.score}</div>
                            <div className="text-xs text-gray-500">מתוך 100</div>
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-3">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all"
                          style={{ width: `${score.score}%` }}
                        ></div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-semibold text-green-700 mb-2">💪 נקודות חוזק:</p>
                          <ul className="text-sm text-gray-700 space-y-1">
                            {score.strengths?.map((strength, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-green-500 mt-1">•</span>
                                <span>{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-red-700 mb-2">⚠️ נקודות חולשה:</p>
                          <ul className="text-sm text-gray-700 space-y-1">
                            {score.weaknesses?.map((weakness, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-red-500 mt-1">•</span>
                                <span>{weakness}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risk Analysis */}
            {aiInsights.risk_analysis && aiInsights.risk_analysis.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                  ניתוח סיכונים
                </h4>
                <div className="space-y-4">
                  {aiInsights.risk_analysis.map((risk, index) => (
                    <div key={index} className={`rounded-xl p-4 border-2 ${
                      risk.risk_level === 'high' ? 'bg-red-50 border-red-300' :
                      risk.risk_level === 'medium' ? 'bg-amber-50 border-amber-300' :
                      'bg-emerald-50 border-emerald-300'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-bold text-gray-800">{risk.supplier_name}</h5>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border-2 ${getRiskColor(risk.risk_level)}`}>
                          {getRiskText(risk.risk_level)}
                        </span>
                      </div>
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-gray-700 mb-2">סיכונים מזוהים:</p>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {risk.risks?.map((r, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-red-500 mt-1">⚠️</span>
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-sm font-semibold text-gray-700 mb-1">אסטרטגיית הפחתת סיכון:</p>
                        <p className="text-sm text-gray-700">{risk.mitigation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Negotiation Points */}
            {aiInsights.negotiation_points && aiInsights.negotiation_points.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingDown className="w-6 h-6 text-green-600" />
                  נקודות למשא ומתן
                </h4>
                <div className="space-y-4">
                  {aiInsights.negotiation_points.map((neg, index) => (
                    <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                      <h5 className="font-bold text-gray-800 mb-3">{neg.supplier_name}</h5>
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-blue-900 mb-2">נקודות מומלצות:</p>
                        <ul className="text-sm text-gray-700 space-y-2">
                          {neg.points?.map((point, i) => (
                            <li key={i} className="flex items-start gap-2 bg-white rounded-lg p-2">
                              <span className="text-blue-500 mt-1">💡</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-blue-100 rounded-lg p-3 border border-blue-300">
                        <p className="text-sm font-semibold text-blue-900 mb-1">המינוף שלך:</p>
                        <p className="text-sm text-blue-800">{neg.leverage}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Market Insights */}
            {aiInsights.market_insights && (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-2xl p-6">
                <h4 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-6 h-6 text-purple-600" />
                  תובנות שוק
                </h4>
                <p className="text-gray-700 leading-relaxed">{aiInsights.market_insights}</p>
              </div>
            )}
          </div>
        )}

        {/* Suppliers Side-by-Side */}
        <div className="grid gap-6 mt-6" style={{ gridTemplateColumns: `repeat(${Math.min(suppliers.length, 3)}, 1fr)` }}>
          {suppliers.map((supplier) => (
            <div key={supplier.id} className="border-2 border-gray-200 rounded-2xl p-5 bg-gradient-to-b from-white to-gray-50 hover:shadow-xl transition-all">
              {/* Header */}
              <div className="text-center mb-6 pb-4 border-b border-gray-200">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-xl text-gray-800 mb-2">{supplier.name}</h3>
                <span className={`inline-block text-xs px-3 py-1.5 rounded-full font-medium border ${getStatusColor(supplier.status)}`}>
                  {getStatusText(supplier.status)}
                </span>
              </div>

              {/* Rating */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    דירוג
                  </span>
                  {supplier.rating === bestRating && supplier.rating > 0 && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                      הטוב ביותר! ⭐
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-amber-400 to-orange-500 h-3 rounded-full transition-all"
                      style={{ width: `${(supplier.rating || 0) * 20}%` }}
                    ></div>
                  </div>
                  <span className="text-lg font-bold text-gray-800">{supplier.rating || 'N/A'}</span>
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-4 p-3 bg-purple-50 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-purple-600" />
                    טווח מחירים
                  </span>
                  <span className="text-sm font-bold text-purple-800">
                    {supplier.price_range || 'לא צוין'}
                  </span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3 mb-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Phone className="w-4 h-4 text-blue-600" />
                  פרטי קשר
                </div>
                {supplier.address && (
                  <div className="flex items-start gap-2 text-xs text-gray-600">
                    <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="flex-1">{supplier.address}</span>
                  </div>
                )}
                {supplier.contact_phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span dir="ltr" className="flex-1 text-right">{supplier.contact_phone}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-start gap-2 text-xs text-gray-600">
                    <Mail className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="flex-1 break-all">{supplier.email}</span>
                  </div>
                )}
              </div>

              {/* Notes */}
              {supplier.notes && (
                <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <FileText className="w-4 h-4 text-green-600" />
                    הערות
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">{supplier.notes}</p>
                </div>
              )}

              {/* Action Button */}
              <Button 
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md"
                onClick={() => window.open(`tel:${supplier.contact_phone}`)}
              >
                <Phone className="w-4 h-4 ml-2" />
                צור קשר
              </Button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <h4 className="font-semibold text-gray-800 mb-3">סיכום השוואה</h4>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">דירוג ממוצע:</span>
              <span className="font-bold text-gray-800 mr-2">
                {(suppliers.reduce((sum, s) => sum + (s.rating || 0), 0) / suppliers.length).toFixed(1)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">דירוג הגבוה ביותר:</span>
              <span className="font-bold text-gray-800 mr-2">
                {bestRating}
              </span>
            </div>
            <div>
              <span className="text-gray-600">מספר ספקים שנבחרו:</span>
              <span className="font-bold text-gray-800 mr-2">
                {suppliers.filter(s => s.status === 'selected').length}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}