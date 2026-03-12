import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';

const TABS = { password: 'password', otp: 'otp' };

export default function LoginPage() {
  const navigate = useNavigate();
  const { signInWithGoogle, signInWithEmail, signUp, sendOtp, verifyOtp, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // If session is already active (e.g. after OAuth redirect processed by
  // onAuthStateChange), go straight to the app.
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isAuthLoading]);

  const [tab, setTab] = useState(TABS.password);
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Email+Password form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // OTP form
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleError = (err) => {
    const msg = err?.message || '';
    if (msg.includes('Invalid login credentials')) return 'אימייל או סיסמה שגויים';
    if (msg.includes('Email not confirmed')) return 'יש לאמת את כתובת האימייל תחילה';
    if (msg.includes('User already registered')) return 'המשתמש כבר רשום. נסה להתחבר';
    if (msg.includes('Token has expired')) return 'הקוד פג תוקף. שלח קוד חדש';
    if (msg.includes('Invalid OTP')) return 'קוד שגוי. בדוק את האימייל ונסה שוב';
    if (msg.includes('Password should be at least')) return 'הסיסמה חייבת להכיל לפחות 6 תווים';
    return msg || 'אירעה שגיאה. נסה שוב';
  };

  const handleGoogle = async () => {
    setError('');
    setIsLoading(true);
    try {
      await signInWithGoogle();
      // Google OAuth redirects — no navigate needed here
    } catch (err) {
      setError(handleError(err));
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (isRegister && password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }
    setIsLoading(true);
    try {
      if (isRegister) {
        await signUp(email, password);
        setError('');
        // Show success message — user needs to confirm email
        setError('נשלח אימייל אימות. בדוק את תיבת הדואר שלך.');
      } else {
        await signInWithEmail(email, password);
        navigate('/');
      }
    } catch (err) {
      setError(handleError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await sendOtp(otpEmail);
      setOtpSent(true);
    } catch (err) {
      setError(handleError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await verifyOtp(otpEmail, otpCode);
      navigate('/');
    } catch (err) {
      setError(handleError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-white text-2xl font-bold">🏗</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">בונים בית</h1>
          <p className="text-gray-500 mt-1 text-sm">מערכת ניהול בנייה</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">

          {/* Google Button */}
          <div className="p-6 pb-4">
            <Button
              onClick={handleGoogle}
              disabled={isLoading}
              variant="outline"
              className="w-full h-12 text-base font-medium border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
            >
              {isLoading ? (
                <svg className="animate-spin w-5 h-5 ms-2 text-blue-600" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5 ms-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {isLoading ? 'מתחבר לGoogle...' : 'כניסה עם Google'}
            </Button>
          </div>

          {/* Divider */}
          <div className="flex items-center px-6 pb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="px-3 text-xs text-gray-400">או</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 px-6">
            <button
              onClick={() => { setTab(TABS.password); setError(''); }}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors me-6 ${
                tab === TABS.password
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {isRegister ? 'הרשמה' : 'כניסה'} עם סיסמה
            </button>
            <button
              onClick={() => { setTab(TABS.otp); setError(''); setOtpSent(false); }}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                tab === TABS.otp
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              קוד חד-פעמי
            </button>
          </div>

          <div className="p-6 pt-5">
            {/* Error / Info */}
            {error && (
              <div className={`mb-4 px-4 py-3 rounded-xl text-sm text-right ${
                error.includes('נשלח אימייל')
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {error}
              </div>
            )}

            {/* Email + Password Tab */}
            {tab === TABS.password && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">דוא"ל</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    dir="ltr"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all text-left"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">סיסמה</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                  />
                </div>
                {isRegister && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">אימות סיסמה</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                    />
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      טוען...
                    </span>
                  ) : isRegister ? 'הרשמה' : 'כניסה'}
                </Button>
                <p className="text-center text-sm text-gray-500">
                  {isRegister ? 'כבר יש לך חשבון?' : 'אין לך חשבון עדיין?'}{' '}
                  <button
                    type="button"
                    onClick={() => { setIsRegister(!isRegister); setError(''); }}
                    className="text-blue-600 font-medium hover:underline"
                  >
                    {isRegister ? 'כניסה' : 'הרשמה'}
                  </button>
                </p>
              </form>
            )}

            {/* OTP Tab */}
            {tab === TABS.otp && (
              <div className="space-y-4">
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">דוא"ל</label>
                      <input
                        type="email"
                        value={otpEmail}
                        onChange={e => setOtpEmail(e.target.value)}
                        required
                        placeholder="you@example.com"
                        dir="ltr"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all text-left"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all"
                    >
                      {isLoading ? 'שולח...' : 'שלח קוד'}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700 text-right">
                      קוד אימות נשלח אל <span dir="ltr" className="font-medium">{otpEmail}</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">קוד אימות (6 ספרות)</label>
                      <input
                        type="text"
                        value={otpCode}
                        onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        required
                        placeholder="123456"
                        maxLength={6}
                        dir="ltr"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all text-center tracking-widest text-lg font-mono"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isLoading || otpCode.length < 6}
                      className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all"
                    >
                      {isLoading ? 'מאמת...' : 'אמת קוד'}
                    </Button>
                    <button
                      type="button"
                      onClick={() => { setOtpSent(false); setOtpCode(''); setError(''); }}
                      className="w-full text-sm text-gray-500 hover:text-gray-700 hover:underline"
                    >
                      שלח קוד חדש
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © 2025 בונים בית. כל הזכויות שמורות.
        </p>
      </div>
    </div>
  );
}
