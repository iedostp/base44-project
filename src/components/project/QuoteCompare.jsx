import React, { useState } from "react";
import { X, FileText, DollarSign, Calendar, Users, Hash, Plus, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const CATEGORY_LABELS = {
  contract: 'חוזה',
  permit: 'היתר',
  invoice: 'חשבונית',
  plan: 'תוכנית',
  specification: 'מפרט',
  certificate: 'אישור',
  correspondence: 'התכתבות',
  other: 'אחר'
};

const BUILT_IN_FIELDS = [
  { key: 'document_date', label: 'תאריך מסמך', icon: Calendar, color: 'text-purple-500', getValue: (doc) => doc.extracted_data?.document_date || null },
  { key: 'amount', label: 'סכום', icon: DollarSign, color: 'text-green-500', isAmount: true, getValue: (doc) => doc.extracted_data?.amount || null },
  { key: 'parties', label: 'צדדים', icon: Users, color: 'text-blue-500', getValue: (doc) => doc.extracted_data?.parties?.join(', ') || null },
  { key: 'reference_number', label: 'מספר אסמכתא', icon: Hash, color: 'text-gray-500', getValue: (doc) => doc.extracted_data?.reference_number || null },
  { key: 'description', label: 'תיאור', icon: FileText, color: 'text-indigo-500', getValue: (doc) => doc.extracted_data?.description || doc.notes || null },
  { key: 'upload_date', label: 'תאריך העלאה', icon: Calendar, color: 'text-gray-400', getValue: (doc) => format(new Date(doc.created_date), 'dd/MM/yyyy', { locale: he }) },
];

export default function QuoteCompare({ documents, suppliers, onClose }) {
  const [customFields, setCustomFields] = useState([]);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [customValues, setCustomValues] = useState({});
  const [addingField, setAddingField] = useState(false);

  const getSupplierName = (doc) => {
    if (!doc.supplier_id) return null;
    return suppliers.find(s => s.id === doc.supplier_id)?.name;
  };

  const addCustomField = () => {
    if (!newFieldLabel.trim()) return;
    const id = `custom_${Date.now()}`;
    setCustomFields(prev => [...prev, { id, label: newFieldLabel.trim() }]);
    setNewFieldLabel('');
    setAddingField(false);
  };

  const removeCustomField = (id) => {
    setCustomFields(prev => prev.filter(f => f.id !== id));
  };

  const setCustomValue = (fieldId, docId, value) => {
    setCustomValues(prev => ({
      ...prev,
      [`${fieldId}_${docId}`]: value
    }));
  };

  const getAmounts = () =>
    documents.filter(d => d.extracted_data?.amount).map(d => d.extracted_data.amount);

  const docCount = documents.length;
  const colMinWidth = docCount <= 3 ? 'min-w-[200px]' : 'min-w-[160px]';

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 md:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-gray-200 flex-shrink-0">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-800">השוואת מסמכים</h2>
            <p className="text-sm text-gray-500">{docCount} מסמכים מושווים</p>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-4 md:p-5">
          <table className="w-full border-collapse text-right text-sm">
            <thead>
              <tr>
                {/* Field label column */}
                <td className="p-3 font-semibold text-gray-500 text-xs border border-gray-200 bg-gray-50 sticky end-0 z-10 w-36">שדה</td>
                {/* Document columns */}
                {documents.map((doc) => (
                  <td key={doc.id} className={`p-3 border border-gray-200 bg-gradient-to-b from-blue-50 to-indigo-50 ${colMinWidth}`}>
                    <div className="flex items-start gap-2 justify-end">
                      <div>
                        <p className="font-bold text-gray-800 leading-snug line-clamp-2">{doc.name}</p>
                        <div className="flex items-center gap-1.5 mt-1 justify-end flex-wrap">
                          <span className="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                            {CATEGORY_LABELS[doc.category] || doc.category}
                          </span>
                          {getSupplierName(doc) && (
                            <span className="text-xs text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                              {getSupplierName(doc)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="bg-white p-1.5 rounded-lg shadow-sm flex-shrink-0">
                        <FileText className="w-4 h-4 text-blue-500" />
                      </div>
                    </div>
                  </td>
                ))}
              </tr>
            </thead>
            <tbody>
              {BUILT_IN_FIELDS.map((field, idx) => {
                const amounts = field.isAmount ? getAmounts() : [];
                const minAmount = amounts.length > 1 ? Math.min(...amounts) : null;
                const Icon = field.icon;
                return (
                  <tr key={field.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                    <td className="p-3 border border-gray-200 bg-gray-50 sticky end-0 z-10">
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="font-medium text-gray-600 text-xs">{field.label}</span>
                        <Icon className={`w-3.5 h-3.5 ${field.color} flex-shrink-0`} />
                      </div>
                    </td>
                    {documents.map(doc => {
                      const val = field.getValue(doc);
                      const isLowest = field.isAmount && val && val === minAmount && amounts.length > 1;
                      return (
                        <td
                          key={doc.id}
                          className={`p-3 border border-gray-200 ${
                            isLowest ? 'bg-green-50' : ''
                          }`}
                        >
                          {val ? (
                            field.isAmount ? (
                              <div className={`font-semibold ${isLowest ? 'text-green-700' : 'text-gray-800'}`}>
                                {Number(val).toLocaleString()} ₪
                                {isLowest && <span className="mr-1 text-xs text-green-600">✓ הנמוך</span>}
                              </div>
                            ) : (
                              <span className="text-gray-800 whitespace-pre-wrap">{val}</span>
                            )
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {/* Custom fields */}
              {customFields.map((field, idx) => (
                <tr key={field.id} className={(BUILT_IN_FIELDS.length + idx) % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                  <td className="p-3 border border-gray-200 bg-amber-50 sticky end-0 z-10">
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="font-medium text-amber-800 text-xs">{field.label}</span>
                      <button
                        onClick={() => removeCustomField(field.id)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                        title="הסר שדה"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  {documents.map(doc => (
                    <td key={doc.id} className="p-1.5 border border-gray-200">
                      <Input
                        value={customValues[`${field.id}_${doc.id}`] || ''}
                        onChange={(e) => setCustomValue(field.id, doc.id, e.target.value)}
                        placeholder="הזן ערך..."
                        className="border-dashed border-amber-300 focus:border-amber-500 text-sm h-8 text-right"
                      />
                    </td>
                  ))}
                </tr>
              ))}

              {/* Add custom field row */}
              <tr>
                <td colSpan={docCount + 1} className="p-3 border border-gray-200 bg-gray-50">
                  {addingField ? (
                    <div className="flex items-center gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => setAddingField(false)}>ביטול</Button>
                      <Button
                        size="sm"
                        className="bg-amber-500 hover:bg-amber-600 text-white"
                        onClick={addCustomField}
                        disabled={!newFieldLabel.trim()}
                      >
                        הוסף
                      </Button>
                      <Input
                        value={newFieldLabel}
                        onChange={(e) => setNewFieldLabel(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addCustomField()}
                        placeholder="שם השדה..."
                        className="max-w-[200px] h-8 text-right"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingField(true)}
                      className="flex items-center gap-1.5 text-amber-600 hover:text-amber-800 text-sm font-medium transition-colors mr-auto"
                    >
                      <Plus className="w-4 h-4" />
                      הוסף קריטריון השוואה מותאם
                    </button>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end flex-shrink-0">
          <Button onClick={onClose} variant="outline">סגור</Button>
        </div>
      </div>
    </div>
  );
}