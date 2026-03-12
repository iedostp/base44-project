import React, { useEffect, useState, useRef } from 'react';
import { ThemeProvider } from 'next-themes';
import { initThemeFromStorage } from './components/useAppTheme';
import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router-dom';
import { Home as HomeIcon, PieChart, Settings, Hammer, Users, BarChart2 } from 'lucide-react';
import './components/i18n';

const NAV_ITEMS = [
  { to: '/',                 Icon: HomeIcon,  labelKey: 'navHome',      exact: true },
  { to: '/Suppliers',        Icon: Users,     labelKey: 'navSuppliers'             },
  { to: '/ExpenseAnalytics', Icon: BarChart2, labelKey: 'navAnalytics'             },
  { to: '/UserSettings',     Icon: Settings,  labelKey: 'navSettings'              },
];

function AppNav({ isRtl }) {
  const { t } = useTranslation();
  const location = useLocation();

  // Home.jsx renders its own 8-tab mobile bottom nav — hide ours there to avoid overlap
  const isHomePage = location.pathname === '/';

  const linkClass = (to, exact) => {
    const active = exact ? location.pathname === to : location.pathname.startsWith(to);
    return active
      ? 'flex flex-col items-center gap-0.5 text-blue-600 dark:text-blue-400'
      : 'flex flex-col items-center gap-0.5 text-gray-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors';
  };

  return (
    <>
      {/* ── Mobile bottom nav (hidden on Home which has its own 8-tab nav) ── */}
      {!isHomePage && (
        <nav
          dir={isRtl ? 'rtl' : 'ltr'}
          className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 flex justify-around items-center h-16 px-2 safe-area-bottom"
        >
          {NAV_ITEMS.map(({ to, Icon, labelKey, exact }) => (
            <NavLink key={to} to={to} className={linkClass(to, exact)}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{t(labelKey, labelKey.replace('nav', ''))}</span>
            </NavLink>
          ))}
        </nav>
      )}

      {/* ── Desktop top nav ───────────────────────────────────────────────── */}
      <header
        dir={isRtl ? 'rtl' : 'ltr'}
        className="hidden md:flex sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 h-14 items-center px-6 gap-6 shadow-sm"
      >
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-lg me-4 select-none">
          <Hammer className="w-5 h-5" />
          <span>בונים בית</span>
        </div>
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map(({ to, Icon, labelKey, exact }) => {
            const active = exact ? location.pathname === to : location.pathname.startsWith(to);
            return (
              <NavLink
                key={to}
                to={to}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t(labelKey, labelKey.replace('nav', ''))}
              </NavLink>
            );
          })}
        </div>
      </header>
    </>
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
        <AppNav isRtl={isRtl} />
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