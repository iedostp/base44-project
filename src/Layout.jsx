import React, { useEffect, useState, useRef } from 'react';
import { ThemeProvider } from 'next-themes';
import { initThemeFromStorage } from './components/useAppTheme';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import './components/i18n';

const APP_TABS = [
  { key: 'home',      label: 'ראשי'    },
  { key: 'stages',    label: 'שלבים'   },
  { key: 'budget',    label: 'תקציב'   },
  { key: 'suppliers', label: 'ספקים'   },
  { key: 'documents', label: 'מסמכים'  },
  { key: 'timeline',  label: 'ציר זמן' },
  { key: 'photos',    label: 'תמונות'  },
  { key: 'settings',  label: 'הגדרות'  },
];

function AppNav() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const activeTab = new URLSearchParams(location.search).get('tab') || 'home';

  const setTab = (key) => {
    const params = new URLSearchParams(window.location.search);
    params.set('tab', key);
    params.delete('modal');
    // Use replaceState directly so Home.jsx's popstate listener fires correctly
    window.history.replaceState({ tab: key }, '', `/?${params.toString()}`);
    window.dispatchEvent(new PopStateEvent('popstate', { state: { tab: key } }));
  };

  return (
    <header
      dir="rtl"
      className="hidden md:flex sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 items-center justify-center px-4 h-11 shadow-sm"
    >
      {/* Logo + Pill tabs — all centered together */}
      <div className="flex items-center gap-3 py-1">
        {/* Logo */}
        <div className="flex items-center gap-1.5 shrink-0 ms-2">
          <img src="/icons/icon-192.png" alt="בונים בית" className="w-6 h-6 rounded" />
          <span className="font-bold text-blue-700 dark:text-blue-400 text-sm whitespace-nowrap">בונים בית</span>
        </div>

        {/* Divider */}
        {isHomePage && <div className="w-px h-5 bg-gray-200 dark:bg-slate-700 shrink-0" />}

        {/* Pill tabs */}
        {isHomePage && APP_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`shrink-0 px-4 py-1 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
              activeTab === key
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 border-gray-300 dark:border-slate-600 hover:border-blue-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </header>
  );
}

// Apply saved theme immediately (before first render)
try { initThemeFromStorage(); } catch(_e) { /* ignore */ }

// Apply saved language direction before first render (i18n.jsx handles subsequent changes)
try {
  const language = localStorage.getItem('language') || 'he';
  document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
  document.documentElement.lang = language;
} catch(_e) { /* ignore */ }

const PULL_THRESHOLD = 80;      // px to trigger refresh
const PULL_MAX = 120;           // max visual pull distance
const HOLD_DURATION = 600;      // ms of sustained pull needed to trigger

export default function Layout({ children, currentPageName }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { t, i18n } = useTranslation();
  const isRtl = ['he', 'ar'].includes(i18n.language);

  const touchStartY = useRef(0);
  const holdTimer = useRef(null);
  const triggered = useRef(false);

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
        setTimeout(() => console.log("pull-to-refresh disabled"), 800);
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

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <AppNav />
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
          className="pb-16 md:pb-0"
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