import React, { useState } from "react";
import { FileText, Download, ExternalLink, Calendar, DollarSign, Users, Hash, Trash2, Sparkles, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import AIDocumentAnalyzer from "./AIDocumentAnalyzer";

export default function DocumentCard({ document, stage, supplier, project, stages, onDelete, isSelected, onToggleCompare }) {
  const [showAnalyzer, setShowAnalyzer] = useState(false);

  const getCategoryColor = (category) => {
    const colors = {
      'contract': 'bg-purple-100 text-purple-800 border-purple-200',
      'permit': 'bg-green-100 text-green-800 border-green-200',
      'invoice': 'bg-blue-100 text-blue-800 border-blue-200',
      'plan': 'bg-orange-100 text-orange-800 border-orange-200',
      'specification': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'certificate': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'correspondence': 'bg-amber-100 text-amber-800 border-amber-200',
      'other': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[category] || colors.other;
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

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <>
      <div className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border overflow-hidden ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}>
        <div className="p-5">
          {/* Header */}
          <div dir="rtl" className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-3 rounded-lg shrink-0">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-gray-800 mb-1 text-right">{document.name}</h3>
                <div dir="rtl" className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium border ${getCategoryColor(document.category)}`}>
                    {getCategoryText(document.category)}
                  </span>
                  {document.file_size && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {formatFileSize(document.file_size)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(document)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Links */}
          {(stage || supplier) && (
            <div className="mb-4 space-y-2">
              {stage && (
                <div dir="rtl" className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
                  <span className="font-medium">שלב:</span>
                  <span>{stage.title}</span>
                </div>
              )}
              {supplier && (
                <div dir="rtl" className="flex items-center gap-2 text-sm text-gray-600 bg-purple-50 px-3 py-2 rounded-lg">
                  <span className="font-medium">ספק:</span>
                  <span>{supplier.name}</span>
                </div>
              )}
            </div>
          )}

          {/* Extracted Data */}
          {document.extracted_data && Object.keys(document.extracted_data).length > 0 && (
            <div className="mb-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
              <h4 dir="rtl" className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2 text-right">
                <span className="bg-purple-100 p-1 rounded">✨</span>
                מידע שחולץ מהמסמך
              </h4>
              <div className="space-y-2">
                {document.extracted_data.document_date && (
                  <div dir="rtl" className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
                    <span className="text-gray-600">תאריך:</span>
                    <span className="font-medium text-gray-800">{document.extracted_data.document_date}</span>
                  </div>
                )}
                {document.extracted_data.amount && (
                  <div dir="rtl" className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-purple-600 shrink-0" />
                    <span className="text-gray-600">סכום:</span>
                    <span className="font-medium text-gray-800">{document.extracted_data.amount.toLocaleString()} ₪</span>
                  </div>
                )}
                {document.extracted_data.parties && document.extracted_data.parties.length > 0 && (
                  <div dir="rtl" className="flex items-start gap-2 text-sm">
                    <Users className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                    <span className="text-gray-600">צדדים:</span>
                    <span className="font-medium text-gray-800">{document.extracted_data.parties.join(', ')}</span>
                  </div>
                )}
                {document.extracted_data.reference_number && (
                  <div dir="rtl" className="flex items-center gap-2 text-sm">
                    <Hash className="w-4 h-4 text-purple-600 shrink-0" />
                    <span className="text-gray-600">מספר אסמכתא:</span>
                    <span className="font-medium text-gray-800">{document.extracted_data.reference_number}</span>
                  </div>
                )}
                {document.extracted_data.description && (
                  <div className="text-sm mt-2 pt-2 border-t border-purple-200">
                    <p className="text-gray-700 text-right">{document.extracted_data.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {document.notes && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700 text-right">{document.notes}</p>
            </div>
          )}

          {/* Upload Date */}
          <div className="text-xs text-gray-500 mb-4 text-right">
            הועלה ב-{format(new Date(document.created_date), 'dd/MM/yyyy HH:mm', { locale: he })}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {/* Primary Actions */}
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                onClick={() => window.open(document.file_url, '_blank')}
                size="sm"
              >
                <ExternalLink className="w-3 h-3 me-2" />
                צפה במסמך
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                size="sm"
                onClick={() => {
                  const link = window.document.createElement('a');
                  link.href = document.file_url;
                  link.download = document.name;
                  link.click();
                }}
              >
                <Download className="w-3 h-3 me-2" />
                הורד
              </Button>
            </div>

            {/* AI Analysis + Compare Buttons */}
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-md"
                onClick={() => setShowAnalyzer(true)}
                size="sm"
              >
                <Sparkles className="w-3 h-3 me-2" />
                AI ניתוח
              </Button>
              {onToggleCompare && (
                <Button
                  variant={isSelected ? "default" : "outline"}
                  className={isSelected ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-blue-300 text-blue-600 hover:bg-blue-50"}
                  onClick={() => onToggleCompare(document)}
                  size="sm"
                >
                  <GitCompare className="w-3 h-3 me-1" />
                  {isSelected ? 'נבחר' : 'השווה'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Document Analyzer */}
      <AIDocumentAnalyzer
        document={document}
        project={project}
        stages={stages}
        isOpen={showAnalyzer}
        onClose={() => setShowAnalyzer(false)}
      />
    </>
  );
}