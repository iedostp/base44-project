import React, { useEffect, useState, useRef } from 'react';
import { ThemeProvider } from 'next-themes';
import { initThemeFromStorage } from './components/useAppTheme';
import { useTranslation } from 'react-i18next';
import './components/i18n';

// Apply saved theme immediately (before first render)
try { initThemeFromStorage(); } catch(e) {}

// Apply saved language direction before first render (i18n.jsx handles subsequent changes)
try {
  const language = localStorage.getItem('language') || 'he';
  document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
  document.documentElement.lang = language;
} catch(e) {}

const PULL_THRESHOLD = 80;      // px to trigger refresh
const PULL_MAX = 120;           // max visual pull distance
const HOLD_DURATION = 600;      // ms of sustained pull needed to trigger

export default function Layout({ children, currentPageName }) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState('light');
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { t, i18n } = useTranslation();
  const isRtl = ['he', 'ar'].includes(i18n.language);

  const touchStartY = useRef(0);
  const holdTimer = useRef(null);
  const triggered = useRef(false);

  useEffect(() => {
    setMounted(true);
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  }, []);

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    triggered.current = false;
  };

  const handleTouchMove = (e) => {
    if (isRefreshing || triggered.current) return;
    if (window.scrollY > 0) return;

    const diff = e.touches[0].clientY - touchStartY.current;
    if (diff <= 0) {
      setPullDistance(0);
      clearTimeout(holdTimer.current);
      return;
    }

    const clamped = Math.min(diff, PULL_MAX);
    setPullDistance(clamped);

    // Start hold timer only once threshold is crossed
    if (clamped >= PULL_THRESHOLD && !holdTimer.current) {
      holdTimer.current = setTimeout(() => {
        triggered.current = true;
        setIsRefreshing(true);
        setPullDistance(0);
        setTimeout(() => window.location.reload(), 800);
      }, HOLD_DURATION);
    } else if (clamped < PULL_THRESHOLD) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const handleTouchEnd = () => {
    if (!triggered.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
      setPullDistance(0);
    }
  };

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const ready = pullDistance >= PULL_THRESHOLD;

  if (!mounted) return <>{children}</>;

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull-to-refresh indicator */}
        {(pullDistance > 0 || isRefreshing) && (
          <div
            className="fixed inset-x-0 top-0 z-[100] flex justify-center items-center transition-all duration-150"
            style={{ height: isRefreshing ? 56 : pullDistance, overflow: 'hidden' }}
          >
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-md text-sm font-medium transition-all duration-200 ${
                isRefreshing
                  ? 'bg-blue-600 text-white'
                  : ready
                  ? 'bg-blue-500 text-white scale-110'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600'
              }`}
              style={{ opacity: Math.max(0.3, progress) }}
            >
              {isRefreshing ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <span>{t('pullRefreshing')}</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 transition-transform duration-200"
                    style={{ transform: ready ? 'rotate(180deg)' : `rotate(${progress * 180}deg)` }}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                  <span>{ready ? t('pullHold') : t('pullToRefresh')}</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Refreshing top bar */}
        {isRefreshing && (
          <div className="fixed inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 z-50 animate-pulse" />
        )}

        <div
          style={{
            transform: pullDistance > 0 ? `translateY(${pullDistance * 0.4}px)` : 'none',
            transition: pullDistance === 0 ? 'transform 0.3s ease' : 'none',
          }}
        >
          {children}
        </div>
      </div>
    </ThemeProvider>
  );
}