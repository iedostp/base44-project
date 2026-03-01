import React, { useMemo, useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, ReferenceLine
} from "recharts";
import { AlertTriangle, TrendingUp, TrendingDown, CheckCircle, Download, ChevronDown, ChevronUp, ChevronLeft, FileDown, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO, startOfMonth } from "date-fns";
import { he } from "date-fns/locale";
import { base44 } from "@/api/base44Client";
import { getCurrencySymbol } from "../utils/currencyFormatter";
import { useTranslation } from "react-i18next";
import "../i18n";

const CATEGORY_LABELS = {
  materials: "חומרים",
  labor: "עבודה",
  equipment: "ציוד",
  permits: "היתרים",
  professional_services: "שירותים מקצועיים",
  other: "אחר",
};

const CATEGORY_COLORS = {
  materials: "#6366f1",
  labor: "#f59e0b",
  equipment: "#10b981",
  permits: "#ef4444",
  professional_services: "#3b82f6",
  other: "#8b5cf6",
};

const PIE_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#8b5cf6"];

const makeCustomTooltip = (formatNIS) => ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl p-3 shadow-xl text-right">
      <p className="font-semibold text-gray-700 dark:text-slate-200 mb-1 text-sm">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="text-sm">
          {entry.name}: {formatNIS(entry.value)}
        </p>
      ))}
    </div>
  );
};

export default function BudgetReport({ project, stages: initialStages, expenses }) {
  const { i18n } = useTranslation();
  const formatNIS = (v) => {
    const sym = getCurrencySymbol(i18n.language);
    return `${sym}${Number(v).toLocaleString(i18n.language === 'he' ? 'he-IL' : 'en-US')}`;
  };
  const CustomTooltip = makeCustomTooltip(formatNIS);
  const [showTable, setShowTable] = useState(true);
  const [sortColumn, setSortColumn] = useState("title");
  const [sortDir, setSortDir] = useState("asc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedStages, setExpandedStages] = useState(() => new Set(initialStages.map(s => s.id)));
  const [stages, setStages] = useState(initialStages);
  const totalBudget = project?.total_budget || 0;

  // Subscribe to stage updates
  useEffect(() => {
    const unsubscribe = base44.entities.Stage.subscribe((event) => {
      if (event.type === "update" && stages.some(s => s.id === event.id)) {
        setStages(prev => prev.map(s => s.id === event.id ? event.data : s));
      } else if (event.type === "create" && event.data.project_id === project?.id) {
        setStages(prev => [...prev, event.data]);
      } else if (event.type === "delete") {
        setStages(prev => prev.filter(s => s.id !== event.id));
      }
    });
    return unsubscribe;
  }, [project?.id]);

  // ─── Calculations ────────────────────────────────────────────────────────────
  const stageReport = useMemo(() => {
    return stages.map((stage) => {
      const planned = totalBudget * (parseFloat(stage.budget_percentage) || 0) / 100;
      const actual = expenses
        .filter((e) => e.stage_id === stage.id)
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      // If no actual expenses recorded but stage is completed, use planned as actual estimate
      const displayActual = actual > 0 ? actual : (stage.completed ? planned : 0);
      const diff = displayActual - planned;
      const overrun = diff > 0;
      return {
        id: stage.id,
        title: stage.title,
        planned,
        actual: displayActual,
        rawActual: actual,
        diff,
        overrun,
        completed: stage.completed,
        percentage: planned > 0 ? Math.round((displayActual / planned) * 100) : (displayActual > 0 ? 100 : 0),
      };
    });
  }, [stages, expenses, totalBudget]);

  const totalActual = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  // Use same logic as BudgetTab: if no actual expenses, estimate from completed stages
  const estimatedFromStages = stageReport
    .filter((s) => s.completed)
    .reduce((sum, s) => sum + s.planned, 0);
  const displaySpent = totalActual > 0 ? totalActual : estimatedFromStages;
  const isEstimated = totalActual === 0 && estimatedFromStages > 0;

  const totalPlannedSpent = estimatedFromStages;

  const budgetUsagePercent = totalBudget > 0 ? (displaySpent / totalBudget) * 100 : 0;
  const variance = displaySpent - totalPlannedSpent;
  const overrunStages = stageReport.filter((s) => s.overrun && s.actual > 0);

  // Sort and filter logic
  const getStatus = (stage) => {
    if (stage.completed) return "completed";
    if (stage.overrun && stage.actual > 0) return "overrun";
    return "in_progress";
  };

  const filteredAndSorted = useMemo(() => {
    let data = stageReport.filter((s) => {
      if (statusFilter === "all") return true;
      return getStatus(s) === statusFilter;
    });

    return data.sort((a, b) => {
      let aVal, bVal;
      if (sortColumn === "title") {
        aVal = a.title;
        bVal = b.title;
      } else if (sortColumn === "planned") {
        aVal = a.planned;
        bVal = b.planned;
      } else if (sortColumn === "actual") {
        aVal = a.actual;
        bVal = b.actual;
      } else if (sortColumn === "diff") {
        aVal = a.diff;
        bVal = b.diff;
      } else if (sortColumn === "percentage") {
        aVal = a.percentage;
        bVal = b.percentage;
      }
      
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [stageReport, sortColumn, sortDir, statusFilter]);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDir("asc");
    }
  };

  const toggleStage = (id) => {
    setExpandedStages(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exportToCSV = () => {
    const headers = ["שלב", "מתוכנן", "בפועל", "סטייה", "% ניצול", "סטטוס"];
    const rows = filteredAndSorted.map((s) => [
      s.title,
      Math.round(s.planned),
      Math.round(s.actual),
      Math.round(s.diff),
      s.percentage,
      getStatus(s) === "completed" ? "הושלם" : getStatus(s) === "overrun" ? "חריגה" : "בתהליך",
    ]);
    rows.push([
      "סה\"כ",
      totalBudget,
      Math.round(totalActual),
      Math.round(totalActual - totalBudget),
      Math.round(budgetUsagePercent),
      "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `טבלת-פירוט-שלבים-${new Date().toLocaleDateString("he-IL")}.csv`;
    link.click();
  };

  // Category breakdown
  const categoryData = useMemo(() => {
    const map = {};
    expenses.forEach((e) => {
      const cat = e.category || "other";
      map[cat] = (map[cat] || 0) + (e.amount || 0);
    });
    return Object.entries(map).map(([key, value]) => ({
      name: CATEGORY_LABELS[key] || key,
      value,
      color: CATEGORY_COLORS[key] || "#8b5cf6",
    }));
  }, [expenses]);

  // Monthly trend
  const monthlyData = useMemo(() => {
    const map = {};
    expenses.forEach((e) => {
      if (!e.date) return;
      const key = format(parseISO(e.date), "MMM yy", { locale: he });
      map[key] = (map[key] || 0) + (e.amount || 0);
    });
    return Object.entries(map).map(([month, total]) => ({ month, total }));
  }, [expenses]);

  // Bar chart data for planned vs actual + deviation
  // Show relevant stages: completed + active (with actual expenses), sorted by order
  const barData = stageReport
    .filter((s) => s.planned > 0 || s.actual > 0)
    .map((s) => {
      const stageActual = s.actual > 0 ? s.actual : (s.completed ? s.planned : 0);
      const deviation = s.planned > 0 ? Math.round(((stageActual - s.planned) / s.planned) * 100) : 0;
      return {
        name: s.title.length > 10 ? s.title.slice(0, 10) + "…" : s.title,
        fullName: s.title,
        מתוכנן: Math.round(s.planned),
        בפועל: Math.round(stageActual),
        סטייה: deviation,
        completed: s.completed,
        hasActivity: s.rawActual > 0 || s.completed,
      };
    })
    .sort((a, b) => {
      // Sort: stages with actual activity first, then by name
      if (a.hasActivity && !b.hasActivity) return -1;
      if (!a.hasActivity && b.hasActivity) return 1;
      return 0;
    });

  // Project-level summary bar data
  const projectSummaryData = [
    { name: "תקציב כולל", value: totalBudget, color: "#a5b4fc" },
    { name: isEstimated ? "הוצ׳ משוערת" : "הוצ׳ בפועל", value: Math.round(displaySpent), color: displaySpent > totalBudget ? "#ef4444" : "#10b981" },
    { name: "יתרה", value: Math.max(0, Math.round(totalBudget - displaySpent)), color: "#6366f1" },
  ];

  if (!totalBudget) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-6 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <p className="text-amber-800 dark:text-amber-300 font-semibold">לא הוגדר תקציב לפרויקט</p>
        <p className="text-amber-600 dark:text-amber-400 text-sm mt-1">הגדר תקציב בהגדרות הפרויקט כדי להציג דוח תקציב</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Title ───────────────────────────────────────────────────── */}
      <div className="flex flex-row-reverse items-center gap-3">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">דוח תקציב אוטומטי</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">השוואה בין תכנון לביצוע</p>
        </div>
      </div>

      {/* ─── Alert Banners ───────────────────────────────────────────── */}
      {budgetUsagePercent >= 90 && (
        <div className="bg-red-50 dark:bg-red-900/20 border-s-4 border-red-500 rounded-xl p-4 flex flex-row-reverse items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 dark:text-red-300">⚠️ חריגת תקציב קריטית!</p>
            <p className="text-sm text-red-700 dark:text-red-400 mt-0.5">
              נוצלו {Math.round(budgetUsagePercent)}% מהתקציב הכולל. נותרו{" "}
              {formatNIS(totalBudget - displaySpent)} בלבד.
            </p>
          </div>
        </div>
      )}
      {budgetUsagePercent >= 75 && budgetUsagePercent < 90 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-s-4 border-amber-500 rounded-xl p-4 flex flex-row-reverse items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-300">התראת תקציב</p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
              נוצלו {Math.round(budgetUsagePercent)}% מהתקציב הכולל. מומלץ לבדוק את ההוצאות.
            </p>
          </div>
        </div>
      )}
      {overrunStages.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-xl p-4">
          <p className="font-semibold text-orange-800 dark:text-orange-300 mb-2">שלבים עם חריגת תקציב:</p>
          <div className="flex flex-wrap gap-2">
            {overrunStages.map((s) => (
              <span key={s.id} className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full font-medium">
                {s.title}: +{formatNIS(s.diff)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ─── KPI Cards ───────────────────────────────────────────────── */}
      <div dir="rtl" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700 shadow-md text-right">
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">תקציב כולל</p>
          <p className="text-xl font-bold text-gray-800 dark:text-slate-100">{formatNIS(totalBudget)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700 shadow-md text-right">
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">{isEstimated ? "הוצאה משוערת" : "הוצאה בפועל"}</p>
          <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatNIS(displaySpent)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{Math.round(budgetUsagePercent)}% מהתקציב{isEstimated ? " (הערכה)" : ""}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700 shadow-md text-right">
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">יתרה</p>
          <p className={`text-xl font-bold ${totalBudget - displaySpent >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
            {formatNIS(totalBudget - displaySpent)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700 shadow-md text-right">
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">סטייה ממוצע שלבים</p>
          <p className={`text-xl font-bold text-right ${variance > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
            {variance > 0 ? "+" : ""}{formatNIS(variance)}
          </p>
        </div>
      </div>





      {/* ─── Row: Pie + Monthly ──────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Category Pie */}
        {categoryData.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700 shadow-md">
            <h3 className="font-bold text-gray-800 dark:text-slate-100 mb-4 text-right">התפלגות הוצאות לפי קטגוריה</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                  labelLine={false}
                >
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatNIS(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Monthly Line Chart */}
        {monthlyData.length > 1 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700 shadow-md">
            <h3 className="font-bold text-gray-800 dark:text-slate-100 mb-4 text-right">מגמת הוצאות חודשית</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6b7280" }} />
                <YAxis tickFormatter={(v) => `₪${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#6b7280" }} />
                <Tooltip formatter={(v) => [formatNIS(v), "הוצאה"]} />
                <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: "#6366f1" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ─── Detailed Table ──────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-md overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700 gap-3">
          <span className="font-bold text-gray-800 dark:text-slate-100">טבלת פירוט לפי שלב</span>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                <SelectItem value="completed">הושלם</SelectItem>
                <SelectItem value="overrun">חריגה</SelectItem>
                <SelectItem value="in_progress">בתהליך</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportToCSV} size="sm" variant="outline" className="gap-2">
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">CSV</span>
            </Button>
            <button
              onClick={() => setShowTable((v) => !v)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              {showTable ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
            </button>
          </div>
        </div>
        {showTable && (
          <div className="overflow-x-auto" dir="rtl">
            <table className="w-full text-xs md:text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="text-right px-2 md:px-4 py-2 md:py-3 text-gray-600 dark:text-slate-300 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600" onClick={() => handleSort("title")}>
                    שלב {sortColumn === "title" && (sortDir === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="hidden md:table-cell text-right px-4 py-3 text-gray-600 dark:text-slate-300 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600" onClick={() => handleSort("planned")}>
                    מתוכנן {sortColumn === "planned" && (sortDir === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="text-right px-2 md:px-4 py-2 md:py-3 text-gray-600 dark:text-slate-300 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600" onClick={() => handleSort("actual")}>
                    בפועל {sortColumn === "actual" && (sortDir === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="hidden lg:table-cell text-right px-4 py-3 text-gray-600 dark:text-slate-300 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600" onClick={() => handleSort("diff")}>
                    סטייה {sortColumn === "diff" && (sortDir === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="text-center px-2 md:px-4 py-2 md:py-3 text-gray-600 dark:text-slate-300 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600" onClick={() => handleSort("percentage")}>
                    % ניצול {sortColumn === "percentage" && (sortDir === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="hidden md:table-cell text-center px-4 py-3 text-gray-600 dark:text-slate-300 font-semibold">סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.map((s, i) => (
                  <React.Fragment key={s.id}>
                  <tr className={`border-t border-gray-100 dark:border-slate-700 ${i % 2 === 0 ? "" : "bg-gray-50/50 dark:bg-slate-700/20"}`}>
                    <td className="px-2 md:px-4 py-2 md:py-3 font-medium text-gray-800 dark:text-slate-200">
                      <div dir="rtl" className="flex items-center gap-1.5">
                        <span>{s.title}</span>
                        <button
                          onClick={() => toggleStage(s.id)}
                          className="shrink-0 p-0.5 hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
                        >
                          {expandedStages.has(s.id)
                            ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                            : <ChevronLeft className="w-3.5 h-3.5 text-gray-400" />}
                        </button>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-gray-700 dark:text-slate-300 text-right text-xs md:text-sm">{formatNIS(Math.round(s.planned))}</td>
                    <td className={`px-2 md:px-4 py-2 md:py-3 text-right text-xs md:text-sm font-medium ${s.actual > s.planned ? "text-red-600 dark:text-red-400" : s.actual === s.planned && s.planned > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-gray-700 dark:text-slate-300"}`}>{formatNIS(Math.round(s.actual))}</td>
                    <td className={`hidden lg:table-cell px-4 py-3 text-right font-semibold text-xs md:text-sm ${s.diff < 0 ? "text-red-600 dark:text-red-400" : s.diff > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"}`}>
                      {s.diff > 0 ? "+" : ""}{formatNIS(Math.round(s.diff))}
                    </td>
                    <td className="px-2 md:px-4 py-2 md:py-3 text-center">
                      <div dir="ltr" className="flex items-center gap-1 justify-center">
                        <div className="w-12 md:w-16 h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${s.percentage > 100 ? "bg-red-500" : "bg-indigo-500"}`}
                            style={{ width: `${Math.min(s.percentage, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${s.percentage > 100 ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-slate-400"}`}>
                          {s.percentage}%
                        </span>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-center">
                      {getStatus(s) === "completed" ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" /> הושלם
                        </span>
                      ) : getStatus(s) === "overrun" ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" /> חריגה
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
                          בתהליך
                        </span>
                      )}
                    </td>
                  </tr>
                  {expandedStages.has(s.id) && expenses
                    .filter(e => e.stage_id === s.id)
                    .map(e => (
                      <tr key={e.id} className="border-t border-gray-50 dark:border-slate-700/50 bg-blue-50/30 dark:bg-blue-900/10">
                        <td className="py-1.5 pl-2 md:pl-4 pr-6 md:pr-10 text-gray-600 dark:text-slate-300 text-right text-xs">
                          <span className="text-gray-300 dark:text-slate-600 ml-1">↳</span>
                          {e.description || '—'}
                        </td>
                        <td className="hidden md:table-cell px-4 py-1.5 text-gray-300 dark:text-slate-600 text-right text-xs">—</td>
                        <td className="px-2 md:px-4 py-1.5 text-gray-700 dark:text-slate-300 text-right text-xs font-medium">
                          {formatNIS(e.amount || 0)}
                        </td>
                        <td className="hidden lg:table-cell px-4 py-1.5 text-gray-300 dark:text-slate-600 text-xs text-right">—</td>
                        <td className="px-2 md:px-4 py-1.5 text-center text-xs text-gray-500 dark:text-slate-400">
                          {CATEGORY_LABELS[e.category] || e.category || '—'}
                        </td>
                        <td className="hidden md:table-cell px-4 py-1.5 text-center text-xs text-gray-400 dark:text-slate-500">
                          {e.date ? new Date(e.date).toLocaleDateString('he-IL') : '—'}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
                {/* Totals Row */}
                <tr className="border-t-2 border-gray-300 dark:border-slate-500 bg-indigo-50 dark:bg-indigo-900/20 font-bold">
                  <td className="px-2 md:px-4 py-2 md:py-3 text-gray-800 dark:text-slate-100 text-right">סה"כ</td>
                  <td className="hidden md:table-cell px-4 py-3 text-gray-800 dark:text-slate-100 text-right text-xs md:text-sm">{formatNIS(totalBudget)}</td>
                  <td className={`px-2 md:px-4 py-2 md:py-3 text-right text-xs md:text-sm ${displaySpent > totalBudget ? "text-red-600 dark:text-red-400" : "text-gray-800 dark:text-slate-100"}`}>
                    {formatNIS(Math.round(displaySpent))}{isEstimated ? " *" : ""}
                  </td>
                  <td className={`hidden lg:table-cell px-4 py-3 text-right text-xs md:text-sm font-semibold ${displaySpent - totalBudget < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {displaySpent - totalBudget > 0 ? "+" : ""}{formatNIS(Math.round(displaySpent - totalBudget))}
                  </td>
                  <td className="px-2 md:px-4 py-2 md:py-3 text-center">
                    <div dir="ltr" className="flex items-center gap-1 justify-center">
                      <div className="w-12 md:w-16 h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${budgetUsagePercent > 100 ? "bg-red-500" : "bg-indigo-500"}`}
                          style={{ width: `${Math.min(budgetUsagePercent, 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold ${budgetUsagePercent > 100 ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-slate-300"}`}>
                        {Math.round(budgetUsagePercent)}%
                      </span>
                    </div>
                  </td>
                  <td className="hidden md:table-cell" />
                </tr>
                {isEstimated && (
                  <tr><td colSpan={6} className="px-4 py-2 text-xs text-gray-400 italic text-right">* הערכה לפי שלבים שהושלמו (אין הוצאות ידניות)</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}