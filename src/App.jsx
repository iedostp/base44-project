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
  // Guard: only attempt Base44 redirect once per session
  const base44RedirectAttempted = useRef(false);
  const [redirectingToBase44, setRedirectingToBase44] = useState(false);

  // Redirect to Supabase login if not authenticated
  useEffect(() => {
    // Don't redirect while Supabase is still processing an OAuth callback hash.
    // The hash contains access_token and will be consumed by onAuthStateChange
    // which will then set isAuthenticated=true without a redirect loop.
    // Supabase v2 PKCE flow uses ?code= query param; implicit flow uses #access_token hash
    const hasOAuthCallback = window.location.hash.includes('access_token') ||
                             window.location.hash.includes('error_description') ||
                             window.location.search.includes('code=');
    if (!isLoading && !isAuthenticated && !hasOAuthCallback) {
      navigate('/login', { replace: true });
    }
  }, [isLoading, isAuthenticated]);

  // After Supabase auth, ensure Base44 auth token exists.
  // On the Base44 platform the token arrives via ?access_token= URL param and is
  // stored in localStorage by app-params.js. On a standalone Vercel deployment it
  // is absent, so we redirect through Base44 Google OAuth which returns the token
  // in the same URL-param format.
  useEffect(() => {
    if (!isLoading && isAuthenticated && !base44RedirectAttempted.current) {
      const hasToken = !!appParams.token;
      if (!hasToken) {
        base44RedirectAttempted.current = true;
        setRedirectingToBase44(true);
        // Redirect to Base44 Google OAuth. On return the URL will contain
        // ?access_token=xxx which app-params.js reads and stores in localStorage.
        base44.auth.loginWithProvider('google', window.location.href);
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
