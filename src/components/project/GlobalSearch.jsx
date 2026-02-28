import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, X, Layers, CheckSquare, DollarSign, Users, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import "../i18n";

const CATEGORY_LABELS = {
  materials: "חומרים", labor: "עבודה", equipment: "ציוד",
  permits: "היתרים", professional_services: "שירותים מקצועיים", other: "אחר",
};

export default function GlobalSearch({ stages, tasks, expenses, suppliers, documents, onNavigate }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef();
  const containerRef = useRef();
  const { i18n } = useTranslation();
  const isRtl = ['he', 'ar'].includes(i18n.language);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return null;

    const matchedStages = stages.filter(s => s.title?.toLowerCase().includes(q))
      .map(s => ({ type: "stage", icon: <Layers className="w-4 h-4 text-blue-500" />, label: s.title, sub: "שלב", id: s.id }));

    const matchedTasks = tasks.filter(t => t.text?.toLowerCase().includes(q))
      .map(t => {
        const stage = stages.find(s => s.id === t.stage_id);
        return { type: "task", icon: <CheckSquare className="w-4 h-4 text-emerald-500" />, label: t.text, sub: stage?.title || "משימה", id: t.id };
      });

    const matchedExpenses = expenses.filter(e =>
      e.description?.toLowerCase().includes(q) || CATEGORY_LABELS[e.category]?.toLowerCase().includes(q)
    ).map(e => ({ type: "expense", icon: <DollarSign className="w-4 h-4 text-amber-500" />, label: e.description, sub: `הוצאה · ₪${e.amount?.toLocaleString()}`, id: e.id }));

    const matchedSuppliers = suppliers.filter(s => s.name?.toLowerCase().includes(q))
      .map(s => ({ type: "supplier", icon: <Users className="w-4 h-4 text-purple-500" />, label: s.name, sub: "ספק", id: s.id }));

    const matchedDocs = documents.filter(d => d.name?.toLowerCase().includes(q) || d.notes?.toLowerCase().includes(q))
      .map(d => ({ type: "document", icon: <FileText className="w-4 h-4 text-pink-500" />, label: d.name, sub: "מסמך", id: d.id }));

    return {
      stages: matchedStages.slice(0, 3),
      tasks: matchedTasks.slice(0, 4),
      expenses: matchedExpenses.slice(0, 3),
      suppliers: matchedSuppliers.slice(0, 3),
      documents: matchedDocs.slice(0, 3),
    };
  }, [query, stages, tasks, expenses, suppliers, documents]);

  const hasResults = results && Object.values(results).some(g => g.length > 0);

  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const typeToTab = { stage: "stages", task: "stages", expense: "budget", supplier: "suppliers", document: "documents" };

  const handleSelect = (item) => {
    setOpen(false);
    setQuery("");
    if (onNavigate) onNavigate(typeToTab[item.type]);
  };

  const groups = results ? [
    { key: "stages", label: "שלבים", items: results.stages },
    { key: "tasks", label: "משימות", items: results.tasks },
    { key: "expenses", label: "הוצאות", items: results.expenses },
    { key: "suppliers", label: "ספקים", items: results.suppliers },
    { key: "documents", label: "מסמכים", items: results.documents },
  ].filter(g => g.items.length > 0) : [];

  return (
    <div ref={containerRef} className="relative w-full max-w-lg">
      <div className="relative">
        <Search className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="חיפוש בכל הפרויקט..."
          className="w-full pe-10 ps-9 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); inputRef.current?.focus(); }}
            className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && query.length >= 2 && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-96 overflow-y-auto">
          {hasResults ? (
            groups.map(group => (
              <div key={group.key}>
                <div className="px-4 py-2 bg-gray-50 dark:bg-slate-700/50 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                  {group.label}
                </div>
                {group.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors text-start"
                  >
                    <div className="flex-shrink-0">{item.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-slate-100 truncate">{item.label}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">{item.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            ))
          ) : (
            <div className="px-4 py-8 text-center text-gray-400 dark:text-slate-500 text-sm">
              לא נמצאו תוצאות עבור "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}