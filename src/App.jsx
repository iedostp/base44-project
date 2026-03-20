import './App.css'
import React, { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import './components/i18n'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { setupIframeMessaging } from './lib/iframe-messaging';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import LoginPage from '@/pages/LoginPage';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, background: '#1e40af', color: 'white', minHeight: '100vh', direction: 'ltr' }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>App Error</h2>
          <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {this.state.error?.message}{'\n\n'}{this.state.error?.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: 16, padding: '8px 16px', background: 'white', color: '#1e40af', border: 'none', borderRadius: 8, fontSize: 16 }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const SplashScreen = ({ visible }) => {
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    if (!visible) {
      const t = setTimeout(() => setMounted(false), 350);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 flex flex-col items-center justify-center z-50 transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <img src="/icons/icon-192.png" alt="בונים בית" className="w-24 h-24 rounded-2xl shadow-2xl mb-6" />
      <h1 className="text-white text-3xl font-bold" dir="rtl">בונים בית</h1>
      <p className="text-blue-200 text-sm mt-2" dir="rtl">מערכת ניהול בנייה</p>
      <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mt-8" />
    </div>
  );
};

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

setupIframeMessaging();

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const hasOAuthCallback = window.location.hash.includes('access_token') ||
                             window.location.hash.includes('error_description') ||
                             window.location.search.includes('code=');
    if (!hasOAuthCallback) return <Navigate to="/login" replace />;
    return null;
  }

  return (
    <LayoutWrapper currentPageName={mainPageKey}>
      <Routes>
        <Route path="/" element={<MainPage />} />
        {Object.entries(Pages).map(([path, Page]) => (
          <Route key={path} path={`/${path}`} element={<Page />} />
        ))}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </LayoutWrapper>
  );
};


const AppContent = () => {
  const { isLoading } = useAuth();
  const [minDone, setMinDone] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);

  // Minimum splash duration — always show for at least 1.5s
  useEffect(() => {
    const t = setTimeout(() => setMinDone(true), 1500);
    return () => clearTimeout(t);
  }, []);

  // Hide splash only when both auth has resolved AND minimum time has passed
  useEffect(() => {
    if (!isLoading && minDone) setSplashVisible(false);
  }, [isLoading, minDone]);

  return (
    <>
      <SplashScreen visible={splashVisible} />
      <Router>
        <NavigationTracker />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<AuthenticatedApp />} />
        </Routes>
      </Router>
    </>
  );
};

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const isRtl = ['he', 'ar'].includes(i18n.language);
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <AppContent />
          <Toaster />
          <VisualEditAgent />
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
