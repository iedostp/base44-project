import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2, FileText, Camera, Sparkles, Link2, CheckCircle2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

const CATEGORY_KEYS = ['contract', 'permit', 'invoice', 'plan', 'specification', 'certificate', 'correspondence', 'other'];

const AI_EXTRACT_CATEGORIES = ['contract', 'permit', 'invoice', 'certificate', 'specification'];

export default function DocumentUpload({ isOpen, onClose, projectId, stages, suppliers, onUploadComplete }) {
  const { t } = useTranslation();

  const CATEGORIES = CATEGORY_KEYS.map(value => ({
    value,
    label: t(`docCat_${value}_single`, t(`docCat_${value}`))
  }));

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [aiPhase, setAiPhase] = useState(null); // null | 'ocr' | 'linking' | 'done'
  const [documentData, setDocumentData] = useState({
    name: '', category: 'other', stage_id: '', supplier_id: '', notes: '', tags: []
  });
  const [aiSuggestions, setAiSuggestions] = useState(null); // { category, stage_id, supplier_id, reason }
  const [extractedData, setExtractedData] = useState(null);
  const [ocrText, setOcrText] = useState('');

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileSelect = (file) => {
    if (!file) return;
    setSelectedFile(file);
    setAiSuggestions(null);
    setExtractedData(null);
    setOcrText('');
    const isImage = file.type.startsWith('image/');
    if (isImage) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
    if (!documentData.name) {
      setDocumentData(prev => ({ ...prev, name: file.name.replace(/\.[^/.]+$/, '') }));
    }
    // Auto-run AI analysis after file selection
    runAIAnalysis(file);
  };

  const runAIAnalysis = async (file) => {
    setAiPhase('ocr');
    try {
      // Upload file first to get URL
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Run OCR + smart categorization in parallel
      setAiPhase('linking');
      const [ocrResult, linkResult] = await Promise.all([
        // OCR: extract text & data
        base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url,
          json_schema: {
            type: "object",
            properties: {
              document_date: { type: "string" },
              amount: { type: "number" },
              parties: { type: "array", items: { type: "string" } },
              description: { type: "string" },
              due_date: { type: "string" },
              reference_number: { type: "string" },
              raw_text_summary: { type: "string", description: "תקציר הטקסט הגולמי מהמסמך" }
            }
          }
        }),
        // Smart linking: suggest category, stage, supplier
        base44.integrations.Core.InvokeLLM({
          prompt: `אתה עוזר לניהול פרויקט בנייה. ניתח את המסמך המצורף וזהה:
1. קטגוריה המתאימה ביותר: contract/permit/invoice/plan/specification/certificate/correspondence/other
2. שם שלב הבנייה המתאים ביותר (אם יש) מתוך הרשימה: ${stages.map(s => s.title).join(', ')}
3. שם ספק מתאים (אם יש) מתוך הרשימה: ${suppliers.map(s => s.name).join(', ')}
4. הסבר קצר למה בחרת כך

החזר JSON בלבד.`,
          file_urls: [file_url],
          response_json_schema: {
            type: "object",
            properties: {
              category: { type: "string" },
              stage_title: { type: "string" },
              supplier_name: { type: "string" },
              reason: { type: "string" }
            }
          }
        })
      ]);

      // Process OCR
      if (ocrResult.status === 'success' && ocrResult.output) {
        setExtractedData(ocrResult.output);
        if (ocrResult.output.raw_text_summary) setOcrText(ocrResult.output.raw_text_summary);
      }

      // Process smart linking
      if (linkResult) {
        const suggested_stage = stages.find(s => s.title === linkResult.stage_title);
        const suggested_supplier = suppliers.find(s => s.name === linkResult.supplier_name);
        const suggestions = {
          category: linkResult.category || 'other',
          stage_id: suggested_stage?.id || '',
          supplier_id: suggested_supplier?.id || '',
          reason: linkResult.reason || ''
        };
        setAiSuggestions(suggestions);

        // Auto-apply suggestions
        setDocumentData(prev => ({
          ...prev,
          category: suggestions.category,
          stage_id: suggestions.stage_id,
          supplier_id: suggestions.supplier_id,
        }));
      }

      // Store file_url for reuse
      setSelectedFile(f => ({ ...f, _uploaded_url: file_url }));
      setAiPhase('done');
    } catch (e) {
      console.error(e);
      setAiPhase(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentData.name || !documentData.category) return;
    setUploading(true);
    try {
      // Re-use already uploaded URL or upload again
      const file_url = selectedFile._uploaded_url || (await base44.integrations.Core.UploadFile({ file: selectedFile })).file_url;

      await base44.entities.Document.create({
        project_id: projectId,
        name: documentData.name,
        category: documentData.category,
        file_url,
        file_type: selectedFile.type,
        file_size: selectedFile.size,
        stage_id: documentData.stage_id || null,
        supplier_id: documentData.supplier_id || null,
        extracted_data: extractedData,
        notes: documentData.notes,
        tags: documentData.tags
      });

      onUploadComplete();
      handleClose();
    } catch (e) {
      alert(t('docUploadError') + ': ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAiPhase(null);
    setAiSuggestions(null);
    setExtractedData(null);
    setOcrText('');
    setDocumentData({ name: '', category: 'other', stage_id: '', supplier_id: '', notes: '', tags: [] });
    onClose();
  };

  const isMobile = /Mobi|Android/i.test(navigator.userAgent);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            {t('docUploadTitle')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">

          {/* File pick area */}
          {!selectedFile ? (
            <div className="grid grid-cols-2 gap-3">
              {/* Upload from gallery/files */}
              <label
                htmlFor="file-upload-input"
                className="flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-gray-200 dark:border-slate-600 rounded-2xl hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all cursor-pointer"
              >
                <Upload className="w-8 h-8 text-blue-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('docUploadChooseFile')}</span>
                <span className="text-xs text-gray-400">{t('docUploadFileTypes')}</span>
              </label>

              {/* Camera scan */}
              <label
                htmlFor="camera-upload-input"
                className="flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-indigo-200 dark:border-indigo-700 rounded-2xl hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all cursor-pointer"
              >
                <Camera className="w-8 h-8 text-indigo-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('docUploadScanDoc')}</span>
                <span className="text-xs text-gray-400">{t('docUploadCameraHint')}</span>
              </label>

              <input
                id="file-upload-input"
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }}
              />
              <input
                id="camera-upload-input"
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }}
              />
            </div>
          ) : (
            /* File selected - show preview + AI status */
            <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/30">
              {previewUrl ? (
                <img src={previewUrl} alt="תצוגה מקדימה" className="w-full max-h-40 object-cover" />
              ) : (
                <div className="flex items-center gap-3 p-4">
                  <FileText className="w-8 h-8 text-blue-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-slate-200">{selectedFile.name}</p>
                    <p className="text-xs text-gray-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              )}

              {/* AI processing overlay */}
              <AnimatePresence>
                {aiPhase && aiPhase !== 'done' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-7 h-7 text-white animate-spin" />
                    <p className="text-white text-sm font-medium">
                      {aiPhase === 'ocr' ? `📷 ${t('docUploadOcrPhase')}` : `🔗 ${t('docUploadLinkingPhase')}`}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button onClick={() => { setSelectedFile(null); setPreviewUrl(null); setAiPhase(null); setAiSuggestions(null); }}
                className="absolute top-2 start-2 bg-white/80 dark:bg-slate-800/80 rounded-full p-1 hover:bg-white transition-colors">
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          )}

          {/* AI Suggestions banner */}
          <AnimatePresence>
            {aiSuggestions && aiPhase === 'done' && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-700 rounded-xl p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  <p className="text-sm font-semibold text-purple-800 dark:text-purple-300">{t('docUploadAiDetected')}</p>
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400 pe-6">{aiSuggestions.reason}</p>
                {extractedData?.amount && (
                  <p className="text-xs text-purple-700 dark:text-purple-400 pe-6 font-medium">
                    💰 סכום שזוהה: ₪{extractedData.amount.toLocaleString('he-IL')}
                    {extractedData.reference_number && ` · מס׳ ${extractedData.reference_number}`}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* OCR text */}
          {ocrText && (
            <div className="bg-gray-50 dark:bg-slate-700/40 rounded-xl p-3 border border-gray-200 dark:border-slate-600">
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">📄 {t('docUploadOcrText')}</p>
              <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed line-clamp-3">{ocrText}</p>
            </div>
          )}

          {/* Form fields */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5 block">{t('docUploadDocName')}</Label>
              <Input value={documentData.name} onChange={e => setDocumentData(p => ({ ...p, name: e.target.value }))}
                placeholder={t('docUploadDocNamePlaceholder')} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5 block">
                  {t('docUploadCategory')}
                  {aiSuggestions && <span className="text-purple-500 text-xs me-1">✨</span>}
                </Label>
                <Select value={documentData.category} onValueChange={v => setDocumentData(p => ({ ...p, category: v }))}>
                  <SelectTrigger dir="rtl"><SelectValue /></SelectTrigger>
                  <SelectContent dir="rtl">
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5 block">
                  {t('docUploadStage')}
                  {aiSuggestions?.stage_id && <span className="text-purple-500 text-xs me-1">✨</span>}
                </Label>
                <Select value={documentData.stage_id || '_none'} onValueChange={v => setDocumentData(p => ({ ...p, stage_id: v === '_none' ? '' : v }))}>
                  <SelectTrigger dir="rtl"><SelectValue placeholder={t('docUploadSelectStage')} /></SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="_none">{t('docUploadNoStage')}</SelectItem>
                    {stages.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {suppliers.length > 0 && (
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5 block">
                  {t('docUploadSupplier')}
                  {aiSuggestions?.supplier_id && <span className="text-purple-500 text-xs me-1">✨</span>}
                </Label>
                <Select value={documentData.supplier_id || '_none'} onValueChange={v => setDocumentData(p => ({ ...p, supplier_id: v === '_none' ? '' : v }))}>
                  <SelectTrigger dir="rtl"><SelectValue placeholder={t('docUploadSelectSupplier')} /></SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="_none">{t('docUploadNoSupplier')}</SelectItem>
                    {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5 block">{t('docUploadNotes')}</Label>
              <Textarea value={documentData.notes} onChange={e => setDocumentData(p => ({ ...p, notes: e.target.value }))}
                placeholder={t('docUploadNotesPlaceholder')} rows={2} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t dark:border-slate-700">
            <Button variant="outline" onClick={handleClose} disabled={uploading} className="flex-1">{t('cancel')}</Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !documentData.name || uploading || (aiPhase && aiPhase !== 'done')}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
            >
              {uploading
                ? <><Loader2 className="w-4 h-4 ms-2 animate-spin" />{t('docUploadSaving')}</>
                : aiPhase && aiPhase !== 'done'
                ? <><Loader2 className="w-4 h-4 ms-2 animate-spin" />{t('docUploadAnalyzing')}</>
                : <><CheckCircle2 className="w-4 h-4 ms-2" />{t('docUploadSave')}</>
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}