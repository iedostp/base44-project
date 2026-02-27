import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Home, Layers, PieChart, Users, FileText, Calendar, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Config ───────────────────────────────────────────────────────────────────
const APP_TUTORIAL_VERSION = 2; // bump this to re-show tutorial for all users

const STEPS = [
  {
    id: "welcome",
    title: "ברוכים הבאים לבונים בית! 🏠",
    description: "האפליקציה שתלווה אתכם בכל שלב של בניית הבית, מהתכנון ועד המפתח.",
    icon: "🏗️",
    tab: null,
    spotlight: null,
  },
  {
    id: "home",
    title: "פרטי הפרויקט",
    description: "כאן תמצאו את כל פרטי הפרויקט שלכם — קבלן, אדריכל, תאריכים ותקציב. לחצו עריכה כדי לעדכן.",
    icon: "🏠",
    tab: "home",
    spotlight: null,
  },
  {
    id: "stages",
    title: "שלבי הבנייה",
    description: "הפרויקט מחולק לשלבים. בכל שלב יש משימות לביצוע. סמנו ✓ כשמשימה הושלמה.",
    icon: "📋",
    tab: "stages",
    spotlight: null,
  },
  {
    id: "budget",
    title: "ניהול תקציב",
    description: "עקבו אחרי ההוצאות בפועל מול התכנון. AI יזהה חריגות ויתן המלצות לחיסכון.",
    icon: "💰",
    tab: "budget",
    spotlight: null,
  },
  {
    id: "suppliers",
    title: "ספקים ואנשי מקצוע",
    description: "נהלו את כל הספקים שלכם — השוו הצעות מחיר, דרגו ספקים ועקבו אחרי הסטטוס.",
    icon: "🤝",
    tab: "suppliers",
    spotlight: null,
  },
  {
    id: "documents",
    title: "מסמכים וחוזים",
    description: "שמרו מסמכים חשובים — חוזים, היתרים, חשבוניות. AI יחלץ מידע אוטומטית.",
    icon: "📄",
    tab: "documents",
    spotlight: null,
  },
];

const TAB_ICONS = {
  home: Home,
  stages: Layers,
  budget: PieChart,
  suppliers: Users,
  documents: FileText,
  timeline: Calendar,
  settings: Settings,
};

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useTutorial() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const neverShow = localStorage.getItem("tutorial_never_show") === "true";
    const seenVersion = parseInt(localStorage.getItem("tutorial_version") || "0", 10);

    if (!neverShow && seenVersion < APP_TUTORIAL_VERSION) {
      // Small delay so the app loads first
      const t = setTimeout(() => setShow(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = (neverShow) => {
    if (neverShow) {
      localStorage.setItem("tutorial_never_show", "true");
    }
    localStorage.setItem("tutorial_version", String(APP_TUTORIAL_VERSION));
    setShow(false);
  };

  const reopen = () => setShow(true);

  return { show, dismiss, reopen };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AppTutorial({ onDismiss, onTabChange }) {
  const [step, setStep] = useState(0);
  const [neverShow, setNeverShow] = useState(false);
  const [dir, setDir] = useState(1); // 1=forward, -1=back

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  const goTo = (nextStep) => {
    setDir(nextStep > step ? 1 : -1);
    setStep(nextStep);
    const tab = STEPS[nextStep]?.tab;
    if (tab && onTabChange) onTabChange(tab);
  };

  const handleSkip = () => onDismiss(neverShow);
  const handleFinish = () => onDismiss(neverShow);

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative w-full md:max-w-md bg-white dark:bg-slate-800 rounded-t-3xl md:rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden z-10"
      >
        {/* Progress bar */}
        <div className="h-1 bg-gray-100 dark:bg-slate-700">
          <motion.div
            className="h-1 bg-gradient-to-r from-blue-500 to-indigo-600"
            initial={false}
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === step
                    ? "bg-blue-500 w-5"
                    : i < step
                    ? "bg-blue-300"
                    : "bg-gray-200 dark:bg-slate-600"
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-2 min-h-[160px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.2 }}
              className="text-start"
            >
              <div className="text-4xl mb-3">{current.icon}</div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-2">
                {current.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
                {current.description}
              </p>

              {/* Tab indicator */}
              {current.tab && (() => {
                const Icon = TAB_ICONS[current.tab];
                return (
                  <div className="flex items-center gap-2 mt-3 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full w-fit">
                    {Icon && <Icon className="w-3.5 h-3.5" />}
                    <span>מציג: {current.title.split(" ")[0]}</span>
                  </div>
                );
              })()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-3 space-y-3">
          {/* Nav buttons */}
          <div className="flex gap-3">
            {!isFirst && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => goTo(step - 1)}
                className="flex-shrink-0 gap-1"
              >
                <ChevronRight className="w-4 h-4" />
                הקודם
              </Button>
            )}
            <Button
              onClick={isLast ? handleFinish : () => goTo(step + 1)}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white gap-1"
            >
              {isLast ? (
                "🚀 בואו נתחיל!"
              ) : (
                <>
                  הבא
                  <ChevronLeft className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>

          {/* Never show again */}
          <label className="flex items-center gap-2 cursor-pointer w-fit mr-auto">
            <input
              type="checkbox"
              checked={neverShow}
              onChange={e => setNeverShow(e.target.checked)}
              className="rounded text-blue-500"
            />
            <span className="text-xs text-gray-500 dark:text-slate-400">אל תראה שוב</span>
          </label>
        </div>
      </motion.div>
    </div>
  );
}