import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Download, Loader2, CheckCircle2, AlertCircle, FileSpreadsheet, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

const TEMPLATE_HEADERS = ["שם השלב", "משך זמן", "אחוז מהתקציב", "עדיפות", "הושלם"];
const EXAMPLE_ROWS = [
  ["תכנון ואדריכלות", "2-3 חודשים", "10", "גבוהה", "לא"],
  ["עבודות עפר ויסודות", "1-2 חודשים", "15", "גבוהה", "לא"],
  ["שלד ומבנה", "3-4 חודשים", "25", "גבוהה", "לא"],
  ["גג וחיפוי חיצוני", "1-2 חודשים", "10", "בינונית", "לא"],
  ["חשמל ואינסטלציה", "2 חודשים", "12", "בינונית", "לא"],
  ["טיח וריצוף", "2-3 חודשים", "13", "בינונית", "לא"],
  ["נגרות וגבס", "1-2 חודשים", "8", "נמוכה", "לא"],
  ["צביעה ועיצוב פנים", "1 חודש", "7", "נמוכה", "לא"],
];

function downloadTemplate() {
  // Build a simple CSV with BOM for Hebrew support in Excel
  const BOM = "\uFEFF";
  const rows = [TEMPLATE_HEADERS, ...EXAMPLE_ROWS];
  const csv = BOM + rows.map(r => r.map(cell => `"${cell}"`).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "תבנית_שלבים.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  // Skip header row
  const dataLines = lines.slice(1);
  return dataLines.map((line, idx) => {
    // Handle quoted fields
    const cols = [];
    let current = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === "," && !inQuote) { cols.push(current.trim()); current = ""; continue; }
      current += ch;
    }
    cols.push(current.trim());

    const [title, duration, budget_percentage, priority, completed_str] = cols;
    const validPriorities = ["גבוהה", "בינונית", "נמוכה"];
    const resolvedPriority = validPriorities.includes(priority) ? priority : "בינונית";
    const completed = completed_str === "כן" || completed_str === "yes" || completed_str === "true";

    return {
      title: title || `שלב ${idx + 1}`,
      duration: duration || "",
      budget_percentage: budget_percentage || "0",
      priority: resolvedPriority,
      completed,
      order: idx + 1,
    };
  }).filter(s => s.title);
}

export default function ImportStagesDialog({ isOpen, onClose, projectId, currentStagesCount, onImported }) {
  const [parsedStages, setParsedStages] = useState(null);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setError("");
    setParsedStages(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target.result;
        const stages = parseCSV(text);
        if (stages.length === 0) {
          setError("לא נמצאו שלבים בקובץ. ודא שהקובץ תקין ויש בו לפחות שורה אחת מתחת לכותרת.");
          return;
        }
        setParsedStages(stages);
      } catch (err) {
        setError("שגיאה בקריאת הקובץ. ודא שמדובר בקובץ CSV תקין.");
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleImport = async () => {
    if (!parsedStages || !projectId) return;
    setImporting(true);
    try {
      const baseOrder = currentStagesCount;
      await Promise.all(
        parsedStages.map((stage, i) =>
          base44.entities.Stage.create({
            ...stage,
            project_id: projectId,
            order: baseOrder + i + 1,
          })
        )
      );
      onImported();
      handleClose();
    } catch (err) {
      setError("שגיאה בייבוא השלבים. נסה שוב.");
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setParsedStages(null);
    setError("");
    setFileName("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            ייבוא שלבים מ-Excel / CSV
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Download template */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              שלב 1 — הורד תבנית מוכנה
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-300 mb-3">
              התבנית כוללת דוגמאות לשלבי בנייה. מחק את השורות הישנות והכנס את הנתונים שלך.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="border-blue-400 text-blue-700 hover:bg-blue-100 dark:text-blue-200 dark:border-blue-600 dark:hover:bg-blue-900/40"
            >
              <Download className="w-4 h-4 ml-2" />
              הורד תבנית CSV
            </Button>
          </div>

          {/* Upload */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              שלב 2 — העלה את הקובץ המלא
            </p>
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors">
              <Upload className="w-7 h-7 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500 dark:text-slate-400">
                {fileName ? fileName : "לחץ לבחירת קובץ CSV"}
              </span>
              <input type="file" accept=".csv" className="hidden" onChange={handleFile} />
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Preview */}
          {parsedStages && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  נמצאו {parsedStages.length} שלבים מוכנים לייבוא
                </span>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1">
                {parsedStages.map((s, i) => (
                  <div key={i} className="text-xs text-green-700 dark:text-green-300 flex justify-between">
                    <span>{i + 1}. {s.title}</span>
                    <span className="text-green-500">{s.budget_percentage}% | {s.priority}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-slate-700">
            <Button variant="outline" onClick={handleClose} disabled={importing}>
              ביטול
            </Button>
            <Button
              onClick={handleImport}
              disabled={!parsedStages || importing}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
            >
              {importing ? (
                <><Loader2 className="w-4 h-4 ml-2 animate-spin" />מייבא...</>
              ) : (
                <><Upload className="w-4 h-4 ml-2" />ייבא שלבים</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}