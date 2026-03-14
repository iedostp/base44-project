import './App.css'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import './components/i18n'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import { setupIframeMessaging } from './lib/iframe-messaging';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import LoginPage from '@/pages/LoginPage';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

setupIframeMessaging();

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const base44RedirectAttempted = useRef(false);
  const [redirectingToBase44, setRedirectingToBase44] = useState(false);

  // Redirect to Supabase login when not authenticated
  useEffect(() => {
    const hasOAuthCallback = window.location.hash.includes('access_token') ||
                             window.location.hash.includes('error_description') ||
                             window.location.search.includes('code=');
    if (!isLoading && !isAuthenticated && !hasOAuthCallback) {
      navigate('/login', { replace: true });
    }
  }, [isLoading, isAuthenticated]);

  // After Supabase auth, ensure a valid Base44 token exists.
  //
  // Token resolution order (see app-params.js):
  //   1. ?access_token= URL param (injected by Base44 platform)
  //   2. localStorage["base44_access_token"] (persisted from prior session)
  //   3. import.meta.env.VITE_BASE44_TOKEN (Vercel env var — set this in Vercel dashboard)
  //
  // If none of the above is present, OR if the stored token is expired,
  // we redirect through Base44 Google OAuth. On return, ?access_token=xxx
  // is stored in localStorage by app-params.js and the client is initialized.
  //
  // NOTE: base44Client.js must pass appBaseUrl: serverUrl to createClient()
  // so that loginWithProvider redirects to https://base44.app (not a relative path).
  useEffect(() => {
    if (!isLoading && isAuthenticated && !base44RedirectAttempted.current) {
      const token = appParams.token;

      if (!token) {
        // No token at all → redirect immediately
        base44RedirectAttempted.current = true;
        setRedirectingToBase44(true);
        base44.auth.loginWithProvider('google', window.location.href);
      } else {
        // Token exists but may be expired — verify with a lightweight API call
        base44.auth.isAuthenticated().then(valid => {
          if (!valid && !base44RedirectAttempted.current) {
            // Stale token → clear it and re-authenticate
            localStorage.removeItem('base44_access_token');
            localStorage.removeItem('token');
            base44RedirectAttempted.current = true;
            setRedirectingToBase44(true);
            base44.auth.loginWithProvider('google', window.location.href);
          }
        }).catch(() => {
          // Base44 unreachable (network error) — proceed without blocking the app.
          // Entity queries will return empty but the app remains usable.
        });
      }
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading || redirectingToBase44) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

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


function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const isRtl = ['he', 'ar'].includes(i18n.language);
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/*" element={<AuthenticatedApp />} />
          </Routes>
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
