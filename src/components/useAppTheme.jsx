/**
 * useAppTheme — manages dark/light mode + extra visual preferences
 * stored in localStorage under key "app_theme_prefs"
 */
import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "app_theme_prefs";

const DEFAULTS = {
  mode: "light",
  accentColor: "blue",
  fontSize: "md",
  roundness: "xl",
  compactMode: false,
};

function load() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return { ...DEFAULTS };
  }
}

function save(prefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

function applyMode(mode) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = mode === "dark" || (mode === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", isDark);
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

function applyFontSize(size) {
  const map = { sm: "13px", md: "15px", lg: "17px" };
  document.documentElement.style.fontSize = map[size] || "15px";
}

const ACCENT_CSS = {
  blue:    { primary: "#3b82f6", dark: "#2563eb", light: "#eff6ff", text: "#1d4ed8" },
  indigo:  { primary: "#6366f1", dark: "#4f46e5", light: "#eef2ff", text: "#4338ca" },
  emerald: { primary: "#10b981", dark: "#059669", light: "#ecfdf5", text: "#047857" },
  rose:    { primary: "#f43f5e", dark: "#e11d48", light: "#fff1f2", text: "#be123c" },
  amber:   { primary: "#f59e0b", dark: "#d97706", light: "#fffbeb", text: "#b45309" },
  teal:    { primary: "#14b8a6", dark: "#0d9488", light: "#f0fdfa", text: "#0f766e" },
};

function applyAccent(color) {
  const c = ACCENT_CSS[color] || ACCENT_CSS.blue;
  const root = document.documentElement;
  root.style.setProperty("--accent-primary", c.primary);
  root.style.setProperty("--accent-dark", c.dark);
  root.style.setProperty("--accent-light", c.light);
  root.style.setProperty("--accent-text", c.text);
}

export function useAppTheme() {
  const [prefs, setPrefs] = useState(load);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    applyMode(prefs.mode);
    applyFontSize(prefs.fontSize);
    applyAccent(prefs.accentColor);
    setMounted(true);
  }, []);

  const update = useCallback((partial) => {
    setPrefs(prev => {
      const next = { ...prev, ...partial };
      save(next);
      if (partial.mode !== undefined) applyMode(next.mode);
      if (partial.fontSize !== undefined) applyFontSize(next.fontSize);
      if (partial.accentColor !== undefined) applyAccent(next.accentColor);
      return next;
    });
  }, []);

  return { prefs, update, mounted };
}

// Call this once at app start (in Layout or index)
export function initThemeFromStorage() {
  const saved = { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")) };
  applyMode(saved.mode);
  applyFontSize(saved.fontSize);
  applyAccent(saved.accentColor);
}