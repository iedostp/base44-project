import React from "react";
import { Sun, Moon, Monitor, Type, Circle, Minimize2 } from "lucide-react";
import { useAppTheme } from "../useAppTheme";
import { motion } from "framer-motion";

const ACCENT_COLORS = [
  { key: "blue",    label: "כחול",    bg: "bg-blue-500",    ring: "ring-blue-400" },
  { key: "indigo",  label: "סגול",    bg: "bg-indigo-500",  ring: "ring-indigo-400" },
  { key: "emerald", label: "ירוק",    bg: "bg-emerald-500", ring: "ring-emerald-400" },
  { key: "rose",    label: "ורוד",    bg: "bg-rose-500",    ring: "ring-rose-400" },
  { key: "amber",   label: "כתום",   bg: "bg-amber-500",   ring: "ring-amber-400" },
  { key: "teal",    label: "טורקיז", bg: "bg-teal-500",    ring: "ring-teal-400" },
];

const MODES = [
  { key: "light",  label: "בהיר",    Icon: Sun,     iconClass: "text-orange-400" },
  { key: "dark",   label: "אפל",     Icon: Moon,    iconClass: "text-indigo-400" },
  { key: "system", label: "מערכת",   Icon: Monitor, iconClass: "text-gray-500 dark:text-slate-400" },
];

const FONT_SIZES = [
  { key: "sm", label: "קטן",  sample: "text-xs" },
  { key: "md", label: "רגיל", sample: "text-sm" },
  { key: "lg", label: "גדול", sample: "text-base" },
];

function OptionButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all select-none ${
        active
          ? "border-[var(--accent-primary)] bg-[var(--accent-light)] dark:bg-slate-700"
          : "border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500"
      }`}
    >
      {children}
    </button>
  );
}

function SectionTitle({ children }) {
  return (
    <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-3 text-start">
      {children}
    </p>
  );
}

export default function AppearanceSettings() {
  const { prefs, update, mounted } = useAppTheme();
  if (!mounted) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-xl flex-shrink-0">
          <Sun className="w-6 h-6 text-purple-600 dark:text-purple-300" />
        </div>
        <div className="text-start flex-1">
          <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">עיצוב ומראה</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">התאם את האפליקציה לטעמך</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Mode */}
        <div>
          <SectionTitle>מצב תצוגה</SectionTitle>
          <div className="grid grid-cols-3 gap-3">
            {MODES.map(({ key, label, Icon, iconClass }) => (
              <OptionButton key={key} active={prefs.mode === key} onClick={() => update({ mode: key })}>
                <Icon className={`w-6 h-6 ${iconClass}`} />
                <span className="text-xs font-medium text-gray-700 dark:text-slate-300">{label}</span>
              </OptionButton>
            ))}
          </div>
        </div>

        {/* Accent Color */}
        <div>
          <SectionTitle>צבע ראשי</SectionTitle>
          <div className="flex gap-3 flex-wrap">
            {ACCENT_COLORS.map(({ key, label, bg, ring }) => (
              <button
                key={key}
                onClick={() => update({ accentColor: key })}
                className={`flex flex-col items-center gap-1 select-none`}
                title={label}
              >
                <div className={`w-9 h-9 rounded-full ${bg} transition-all ${
                  prefs.accentColor === key ? `ring-4 ${ring} ring-offset-2 scale-110` : "hover:scale-105"
                }`} />
                <span className="text-xs text-gray-500 dark:text-slate-400">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div>
          <SectionTitle>גודל טקסט</SectionTitle>
          <div className="grid grid-cols-3 gap-3">
            {FONT_SIZES.map(({ key, label, sample }) => (
              <OptionButton key={key} active={prefs.fontSize === key} onClick={() => update({ fontSize: key })}>
                <Type className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                <span className={`font-medium text-gray-700 dark:text-slate-300 ${sample}`}>{label}</span>
              </OptionButton>
            ))}
          </div>
        </div>

        {/* Compact Mode */}
        <div>
          <SectionTitle>צפיפות תצוגה</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <OptionButton active={!prefs.compactMode} onClick={() => update({ compactMode: false })}>
              <div className="space-y-1 w-full">
                <div className="h-2 bg-gray-300 dark:bg-slate-500 rounded" />
                <div className="h-2 bg-gray-200 dark:bg-slate-600 rounded w-3/4" />
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-slate-300">רגיל</span>
            </OptionButton>
            <OptionButton active={prefs.compactMode} onClick={() => update({ compactMode: true })}>
              <div className="space-y-0.5 w-full">
                <div className="h-1.5 bg-gray-300 dark:bg-slate-500 rounded" />
                <div className="h-1.5 bg-gray-200 dark:bg-slate-600 rounded" />
                <div className="h-1.5 bg-gray-200 dark:bg-slate-600 rounded w-3/4" />
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-slate-300">קומפקטי</span>
            </OptionButton>
          </div>
        </div>

        {/* Live Preview */}
        <motion.div
          layout
          className="rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-600 p-4 bg-gray-50 dark:bg-slate-700/30"
        >
          <p className="text-xs text-gray-400 dark:text-slate-500 text-start mb-2">תצוגה מקדימה</p>
          <div className={`bg-white dark:bg-slate-800 rounded-xl p-3 border border-gray-100 dark:border-slate-600 ${prefs.compactMode ? "space-y-1" : "space-y-2"}`}>
            <div className="flex items-center justify-between">
              <div className="w-5 h-5 rounded-full" style={{ background: "var(--accent-primary)" }} />
              <div className={`font-bold text-gray-800 dark:text-slate-100 ${prefs.fontSize === "sm" ? "text-xs" : prefs.fontSize === "lg" ? "text-base" : "text-sm"}`}>
                שלב: יסודות
              </div>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full w-2/3 rounded-full" style={{ background: "var(--accent-primary)" }} />
            </div>
            <div className="flex gap-1 justify-end">
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--accent-light)", color: "var(--accent-text)" }}>
                בהתקדמות
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}