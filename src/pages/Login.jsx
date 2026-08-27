import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { requestPasswordReset, verifyResetOtp, confirmPasswordReset } from '../services/api';
import { Eye, EyeOff, Lock, Mail, ArrowLeft, Shield, Sparkles, CheckCircle2, Award, AlertTriangle, AlertCircle, KeyRound, X, RefreshCw, Copy, Check } from 'lucide-react';

// Universal Clipboard Copy Helper (Works on Android, iOS Safari, macOS, and Windows Desktop)
function copyTextToClipboard(text) {
  if (!text) return false;
  const clean = String(text).trim();

  // Strategy 1: navigator.clipboard API
  if (navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    navigator.clipboard.writeText(clean).catch(() => {
      fallbackExecCopy(clean);
    });
    return true;
  }

  // Strategy 2: Fallback textarea selection & execCommand('copy')
  return fallbackExecCopy(clean);
}

function fallbackExecCopy(text) {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.width = '2em';
    textarea.style.height = '2em';
    textarea.style.padding = '0';
    textarea.style.border = 'none';
    textarea.style.outline = 'none';
    textarea.style.boxShadow = 'none';
    textarea.style.background = 'transparent';
    textarea.style.opacity = '0.001';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return successful;
  } catch (_) {
    return false;
  }
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submittedPassword, setSubmittedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Signing in...');

  // Forgot Password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1 = request, 2 = verify & reset, 3 = success
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotShowPassword, setForgotShowPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Cross-Tab Instant Sync & 1-Click Auto-Fill from Email Link
  useEffect(() => {
    let channel;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel('nstp_password_reset_sync');
        channel.onmessage = (event) => {
          if (event?.data?.otp) {
            const receivedOtp = String(event.data.otp).trim();
            setForgotOtp(receivedOtp);
            copyTextToClipboard(receivedOtp);
            if (event.data.email) setForgotEmail(String(event.data.email).trim().toLowerCase());
            setShowForgotPassword(true);
            setForgotStep(2);
            setForgotSuccess('⚡ OTP automatically copied to clipboard & entered in this tab!');
          }
        };
      }
    } catch (_) {}

    // Universal cross-tab storage event listener
    const handleStorage = (e) => {
      if (e.key === 'nstp_broadcast_otp' && e.newValue) {
        try {
          const payload = JSON.parse(e.newValue);
          if (payload?.otp) {
            const receivedOtp = String(payload.otp).trim();
            setForgotOtp(receivedOtp);
            copyTextToClipboard(receivedOtp);
            if (payload.email) setForgotEmail(String(payload.email).trim().toLowerCase());
            setShowForgotPassword(true);
            setForgotStep(2);
            setForgotSuccess('⚡ OTP automatically copied to clipboard & entered in this tab!');
          }
        } catch (_) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // Check if THIS tab was opened with an OTP from Gmail link
    try {
      const search = window.location.search || window.location.hash.split('?')[1] || '';
      const params = new URLSearchParams(search);
      const urlOtp = params.get('otp') || params.get('code');
      const urlEmail = params.get('email') || params.get('reset_email');

      if (urlOtp) {
        const cleanOtp = String(urlOtp).trim();
        const cleanEmail = urlEmail ? String(urlEmail).trim().toLowerCase() : '';

        // 1. Copy to clipboard immediately using universal helper
        copyTextToClipboard(cleanOtp);

        // 2. Broadcast to other open NSTP System tabs so the original tab fills immediately
        if (channel) {
          channel.postMessage({ otp: cleanOtp, email: cleanEmail });
        }
        try {
          localStorage.setItem('nstp_broadcast_otp', JSON.stringify({ otp: cleanOtp, email: cleanEmail, ts: Date.now() }));
        } catch (_) {}

        // 3. Populate current tab as fallback
        if (cleanEmail) setForgotEmail(cleanEmail);
        setForgotOtp(cleanOtp);
        setShowForgotPassword(true);
        setForgotStep(2);
        setForgotSuccess('⚡ OTP code copied to clipboard & auto-filled!');

        // 4. If opened as a secondary tab from email, attempt auto-close
        setTimeout(() => {
          try {
            window.close();
          } catch (_) {}
        }, 1000);
      }
    } catch (_) {}

    return () => {
      window.removeEventListener('storage', handleStorage);
      if (channel) {
        try { channel.close(); } catch (_) {}
      }
    };
  }, []);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setSubmittedPassword(password);
    setLoading(true);
    setLoadingText('Verifying credentials...');

    const timer1 = setTimeout(() => {
      setLoadingText('Waking up Cloud Server (please wait ~15s)...');
    }, 3500);

    const timer2 = setTimeout(() => {
      setLoadingText('Connecting to Cloud Database...');
    }, 14000);

    try {
      const result = await login(cleanEmail, password);
      clearTimeout(timer1);
      clearTimeout(timer2);

      if (result.success) {
        if (result.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/instructor/dashboard');
        }
      } else {
        if (result.message && (result.message.includes('another device') || result.message.includes('currently active'))) {
          const retryResult = await login(cleanEmail, password, true);
          if (retryResult.success) {
            if (retryResult.role === 'admin') {
              navigate('/admin/dashboard');
            } else {
              navigate('/instructor/dashboard');
            }
            return;
          }
        }
        setError(result.message || 'Invalid email or password');
        setPassword('');
      }
    } catch (err) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      console.error('Login error:', err);
      const errMsg = err?.message || '';
      if (errMsg.includes('another device') || errMsg.includes('currently active')) {
        try {
          const retryResult = await login(cleanEmail, password, true);
          if (retryResult.success) {
            if (retryResult.role === 'admin') {
              navigate('/admin/dashboard');
            } else {
              navigate('/instructor/dashboard');
            }
            return;
          }
        } catch (_) {}
      }
      if (errMsg.includes('timeout') || errMsg.includes('waking up') || errMsg.includes('aborted')) {
        setError('Cloud server is waking up (~15s). Please tap Login again.');
      } else {
        setError(errMsg || 'Server connection failed. Please try again.');
      }
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  const handleSendForgotOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setForgotError('');
    const clean = forgotEmail.trim().toLowerCase();
    if (!clean) {
      setForgotError('Please enter your registered email address');
      return;
    }
    setForgotLoading(true);
    try {
      await requestPasswordReset(clean);
      setForgotOtp('');
      setResendCooldown(60);
      setForgotStep(2);
    } catch (err) {
      // Auto-retry once in case cloud server was cold-starting
      try {
        await new Promise(r => setTimeout(r, 1500));
        await requestPasswordReset(clean);
        setForgotOtp('');
        setResendCooldown(60);
        setForgotStep(2);
      } catch (retryErr) {
        var msg = retryErr?.message || err?.message || 'Failed to send reset code.';
        if (msg.toLowerCase().includes('timeout') || msg.toLowerCase().includes('waking up') || msg.toLowerCase().includes('network') || msg.toLowerCase().includes('failed to fetch')) {
          setForgotError('Cloud server was waking up from sleep. It is now active — please click "Send 6-Digit Reset Code" again!');
        } else {
          setForgotError(msg);
        }
      }
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtpOnly = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setForgotError('');
    const clean = forgotEmail.trim().toLowerCase();
    const otp = forgotOtp.trim();
    if (!otp || otp.length < 6) {
      setForgotError('Please enter the complete 6-digit verification code sent to your Gmail.');
      return;
    }
    setForgotLoading(true);
    try {
      await verifyResetOtp(clean, otp);
      setForgotStep(3);
    } catch (err) {
      setForgotError(err?.message || 'Invalid verification code. Please check the 6-digit code sent to your Gmail inbox.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleConfirmReset = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setForgotError('');
    const clean = forgotEmail.trim().toLowerCase();
    const otp = forgotOtp.trim();
    if (!otp || otp.length < 6) {
      setForgotError('Please enter the complete 6-digit verification code');
      return;
    }
    if (!forgotNewPassword) {
      setForgotError('Please enter your new password');
      return;
    }
    if (forgotNewPassword.length < 6) {
      setForgotError('Password must be at least 6 characters');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match');
      return;
    }
    setForgotLoading(true);
    try {
      await confirmPasswordReset(clean, otp, forgotNewPassword);
      setForgotStep(4);
      setPassword(forgotNewPassword);
      setEmail(clean);
    } catch (err) {
      setForgotError(err?.message || 'Invalid or expired verification code.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col justify-between bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white font-sans selection:bg-emerald-500 selection:text-white relative">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header - Edge-to-Edge Desktop & Compact Mobile Match */}
      <header className="bg-emerald-900/90 backdrop-blur-md text-white border-b border-emerald-800/80 shrink-0 z-10 w-full">
        <div className="w-full px-4 sm:px-8 lg:px-12 py-2 sm:py-3 flex justify-between items-center gap-2">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="w-7 h-7 sm:w-10 sm:h-10 bg-white rounded-lg sm:rounded-2xl p-0.5 sm:p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md border border-emerald-700">
              <img src={`${import.meta.env.BASE_URL}cvsu.png`} alt="CvSU Logo" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-[10px] xs:text-xs sm:text-base font-black tracking-tight truncate">Cavite State University Naic</h1>
              <p className="text-emerald-200 text-[8px] sm:text-[11px] truncate font-medium">National Service Training Program System</p>
            </div>
          </div>

          <Link 
            to="/" 
            className="flex items-center gap-1 bg-emerald-800/90 hover:bg-emerald-700 text-emerald-100 font-bold px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[9px] sm:text-xs border border-emerald-700/80 active:scale-95 transition-all shadow-sm shrink-0"
          >
            <ArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
            <span>Home</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area - Scaled & Non-Scrollable */}
      <main className="flex-1 flex items-center justify-center p-2.5 sm:p-6 overflow-hidden relative z-10">
        <div className="max-w-4xl w-full bg-white/95 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 text-gray-900 grid lg:grid-cols-12 overflow-hidden my-auto max-h-[calc(100vh-80px)]">
          {/* Left Decorative Hero Panel (Desktop) */}
          <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-emerald-900 via-emerald-950 to-teal-950 text-white p-8 flex-col justify-between relative overflow-hidden">
            <img 
              src={`${import.meta.env.BASE_URL}cvsunaiccampus.png`} 
              alt="CvSU Campus" 
              className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/70 to-transparent"></div>

            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-amber-400/30 mb-4">
                <Shield className="w-3.5 h-3.5" />
                Portal Access
              </span>
              <h2 className="text-2xl font-black tracking-tight text-white mb-2 leading-tight">
                CvSU Naic NSTP System
              </h2>
              <p className="text-emerald-200 text-xs leading-relaxed">
                Secure management portal for ROTC, CWTS, and LTS faculty coordinators and administrators.
              </p>
            </div>

            <div className="relative z-10 space-y-3 pt-6 border-t border-emerald-800/80">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-100">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Online Enrollment System</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-100">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Real-time Messaging &amp; Chat</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-100">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Academic &amp; Event Calendar</span>
              </div>

              <div className="pt-2 text-[11px] text-amber-300/90 font-bold">
                Core Values: Truth • Integrity • Excellence • Service
              </div>
            </div>
          </div>

          {/* Right Form Card (Scaled down for Mobile & Static) */}
          <div className="lg:col-span-7 p-3.5 sm:p-7 flex flex-col justify-center">
            {/* Mobile Decorative Hero Header Banner */}
            <div className="lg:hidden bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-xl p-2.5 mb-2.5 border border-emerald-800/60 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 bg-white rounded-lg p-0.5 flex items-center justify-center shrink-0 shadow-xs border border-emerald-700">
                  <img src={`${import.meta.env.BASE_URL}cvsu.png`} alt="CvSU Logo" className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-black text-white truncate">CvSU Naic NSTP Portal</h3>
                  <p className="text-[9px] text-emerald-200 truncate font-medium">Faculty &amp; Admin Portal</p>
                </div>
              </div>
              <span className="bg-amber-400/20 text-amber-300 text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-amber-400/30 shrink-0">
                Secure Access
              </span>
            </div>

            <div className="text-center sm:text-left mb-2.5 sm:mb-5">
              <h2 className="text-base sm:text-2xl font-black text-emerald-950 tracking-tight">Portal Login</h2>
              <p className="text-gray-500 text-[10px] sm:text-xs mt-0.5">Sign in with your official CvSU faculty or admin credentials</p>
            </div>

            <form onSubmit={handleSubmit} autoComplete="off" spellCheck="false" data-lpignore="true" className="space-y-3 sm:space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-2 animate-shake">
                  <span className="w-2 h-2 rounded-full bg-red-600 shrink-0"></span>
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    data-lpignore="true"
                    inputMode="email"
                    className="w-full pl-9 pr-3 py-2 text-[11px] sm:text-xs bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:border-transparent outline-none transition-all font-medium"
                    placeholder="e.g. admin@cvsu.edu.ph"
                    autoComplete="off"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    data-lpignore="true"
                    className="w-full pl-9 pr-9 py-2 text-[11px] sm:text-xs bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:border-transparent outline-none transition-all font-medium"
                    placeholder="••••••••••••"
                    autoComplete="off"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-emerald-700 cursor-pointer transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="flex justify-end mt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email.trim());
                      setForgotStep(1);
                      setForgotOtp('');
                      setForgotNewPassword('');
                      setForgotConfirmPassword('');
                      setForgotError('');
                      setShowForgotPassword(true);
                    }}
                    className="text-[11px] sm:text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer transition-colors inline-flex items-center gap-1 active:scale-95"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                    <span>Forgot Password?</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-emerald-950 font-black py-2.5 sm:py-3 rounded-xl transition-all shadow-md shadow-amber-950/20 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 text-[11px] sm:text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-emerald-950"></div>
                    <span>{loadingText}</span>
                  </>
                ) : (
                  <span>Sign In to Portal →</span>
                )}
              </button>
            </form>

            <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex flex-row items-center justify-between gap-1 text-[10px] sm:text-xs">
              <span className="text-gray-500">Incoming Student?</span>
              <Link 
                to="/enrollment" 
                className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold hover:underline"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Online Enrollment Application &rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Institutional Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3.5 sm:p-4 animate-fade-in" onClick={() => !forgotLoading && setShowForgotPassword(false)}>
          <div className="bg-white text-gray-900 rounded-2xl sm:rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-emerald-800/30 flex flex-col relative my-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 border-b border-emerald-800/60">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black tracking-tight text-white leading-tight">Account Password Recovery</h3>
                  <p className="text-emerald-200 text-[10px] sm:text-xs font-medium">Cavite State University Naic Campus</p>
                </div>
              </div>
              <button
                type="button"
                disabled={forgotLoading}
                onClick={() => setShowForgotPassword(false)}
                className="w-8 h-8 rounded-full bg-emerald-800/80 hover:bg-emerald-700 flex items-center justify-center text-emerald-200 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step Progress Indicators */}
            <div className="bg-emerald-950/20 px-4 py-2 border-b border-gray-100 flex items-center justify-between text-[10px] sm:text-xs font-bold text-gray-500 shrink-0">
              <div className={`flex items-center gap-1.5 ${forgotStep >= 1 ? 'text-emerald-800 font-extrabold' : 'text-gray-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${forgotStep >= 1 ? 'bg-emerald-800 text-white' : 'bg-gray-200 text-gray-600'}`}>1</span>
                <span>Email</span>
              </div>
              <div className="w-6 h-0.5 bg-gray-200"></div>
              <div className={`flex items-center gap-1.5 ${forgotStep >= 2 ? 'text-emerald-800 font-extrabold' : 'text-gray-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${forgotStep >= 2 ? 'bg-emerald-800 text-white' : 'bg-gray-200 text-gray-600'}`}>2</span>
                <span>OTP Code</span>
              </div>
              <div className="w-6 h-0.5 bg-gray-200"></div>
              <div className={`flex items-center gap-1.5 ${forgotStep >= 3 ? 'text-emerald-800 font-extrabold' : 'text-gray-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${forgotStep >= 3 ? 'bg-emerald-800 text-white' : 'bg-gray-200 text-gray-600'}`}>3</span>
                <span>New Password</span>
              </div>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto max-h-[70vh]">
              {forgotStep === 1 && (
                <>
                  <div className="text-center mb-4">
                    <h4 className="text-sm sm:text-base font-black text-gray-900">
                      Forgot Your Password?
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Enter your registered account email address below. We will verify your account and send a 6-digit OTP code to your inbox.
                    </p>
                  </div>

                  {forgotError && (
                    <div className="mb-4 bg-red-50 border-2 border-red-300 text-red-800 p-3 rounded-2xl text-xs font-semibold flex items-start gap-2.5 shadow-sm animate-shake">
                      <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <strong className="block text-red-900 font-extrabold mb-0.5">Account Verification Notice</strong>
                        <span>{forgotError}</span>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSendForgotOtp} className="space-y-3.5">
                    <div>
                      <label htmlFor="forgot-email" className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">
                        Registered Email Address
                      </label>
                      <div className="relative">
                        <Mail className={`absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 ${forgotError ? 'text-red-500' : 'text-gray-400'}`} />
                        <input
                          type="email"
                          id="forgot-email"
                          name="forgotEmail"
                          autoComplete="email"
                          value={forgotEmail}
                          onChange={(e) => {
                            setForgotEmail(e.target.value);
                            if (forgotError) setForgotError('');
                          }}
                          placeholder="e.g. youraccount@gmail.com"
                          className={`w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-gray-50 border ${
                            forgotError ? 'border-red-400 bg-red-50/20 focus:ring-red-500' : 'border-gray-300 focus:ring-emerald-600'
                          } rounded-xl focus:ring-2 focus:bg-white outline-none font-medium transition-all`}
                          required
                          autoFocus
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">Must be an existing registered account in the NSTP portal.</p>
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading || !forgotEmail.trim()}
                      className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {forgotLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Verifying Account &amp; Sending OTP...</span>
                        </>
                      ) : (
                        <span>Verify &amp; Send 6-Digit OTP &rarr;</span>
                      )}
                    </button>
                  </form>
                </>
              )}

              {forgotStep === 2 && (
                <>
                  <div className="text-center mb-4">
                    <h4 className="text-sm sm:text-base font-black text-gray-900">
                      Enter Verification Code
                    </h4>
                    <div className="mt-1.5 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                      <span>We sent a 6-digit OTP code to:</span>
                      <strong className="block text-emerald-950 font-black text-xs sm:text-sm mt-0.5 break-all">{forgotEmail}</strong>
                    </div>
                  </div>

                  {forgotSuccess && (
                    <div className="mb-3.5 bg-emerald-50 border-2 border-emerald-300 text-emerald-900 p-3 rounded-2xl text-xs font-semibold flex items-start gap-2.5 shadow-sm animate-fade-in">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <strong className="block text-emerald-950 font-extrabold mb-0.5">Code Detected</strong>
                        <span>{forgotSuccess}</span>
                      </div>
                    </div>
                  )}

                  {forgotError && (
                    <div className="mb-3.5 bg-red-50 border-2 border-red-300 text-red-800 p-3 rounded-2xl text-xs font-semibold flex items-start gap-2.5 shadow-sm animate-shake">
                      <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <strong className="block text-red-900 font-extrabold mb-0.5">Verification Error</strong>
                        <span>{forgotError}</span>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleVerifyOtpOnly} className="space-y-4">
                    <div>
                      <label htmlFor="forgot-otp" className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-2 text-center">
                        6-Digit Verification Code
                      </label>
                      <input
                        type="text"
                        id="forgot-otp"
                        name="forgotOtp"
                        autoComplete="one-time-code"
                        maxLength="6"
                        value={forgotOtp}
                        onChange={(e) => {
                          setForgotOtp(e.target.value.replace(/\D/g, ''));
                          if (forgotError) setForgotError('');
                        }}
                        placeholder="000000"
                        className="w-full text-center tracking-[10px] sm:tracking-[14px] font-mono text-2xl py-3 bg-gray-50 border-2 border-emerald-700/40 rounded-2xl focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none font-black text-emerald-950 shadow-inner"
                        required
                        autoFocus
                      />
                      {forgotOtp && forgotOtp.length >= 1 && (
                        <div className="mt-2 flex justify-center">
                          <button
                            type="button"
                            onClick={() => {
                              copyTextToClipboard(forgotOtp);
                              setCopiedOtp(true);
                              setTimeout(() => setCopiedOtp(false), 2500);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100/80 hover:bg-emerald-200 text-emerald-900 rounded-lg text-[11px] font-bold transition-all cursor-pointer active:scale-95 border border-emerald-300 shadow-2xs"
                          >
                            {copiedOtp ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Copied to Clipboard!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Copy OTP to Clipboard</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                      <p className="text-[10px] text-gray-400 text-center mt-1.5">Check your inbox or Spam/Junk folder for the code.</p>
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading || forgotOtp.length < 6}
                      className="w-full py-3 bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {forgotLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Verifying OTP Code...</span>
                        </>
                      ) : (
                        <span>Verify Code &amp; Proceed to Step 3 &rarr;</span>
                      )}
                    </button>

                    <div className="flex justify-between items-center pt-1 text-xs">
                      <button
                        type="button"
                        onClick={() => { setForgotStep(1); setForgotError(''); }}
                        className="text-gray-500 hover:text-gray-800 font-bold cursor-pointer transition-colors"
                      >
                        &larr; Change Email
                      </button>
                      <button
                        type="button"
                        onClick={handleSendForgotOtp}
                        disabled={forgotLoading || resendCooldown > 0}
                        className={`font-extrabold text-xs transition-colors ${
                          resendCooldown > 0
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-blue-600 hover:text-blue-800 hover:underline cursor-pointer'
                        }`}
                      >
                        {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend Code'}
                      </button>
                    </div>
                  </form>
                </>
              )}

              {forgotStep === 3 && (
                <>
                  <div className="text-center mb-4">
                    <h4 className="text-sm sm:text-base font-black text-gray-900">
                      Step 3: Create New Password
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Enter your new account password below for <strong className="text-emerald-900">{forgotEmail}</strong>.
                    </p>
                  </div>

                  {forgotError && (
                    <div className="mb-3.5 bg-red-50 border-2 border-red-300 text-red-800 p-3 rounded-2xl text-xs font-semibold flex items-start gap-2.5 shadow-sm animate-shake">
                      <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <strong className="block text-red-900 font-extrabold mb-0.5">Reset Error</strong>
                        <span>{forgotError}</span>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleConfirmReset} className="space-y-3.5">
                    <div>
                      <label htmlFor="forgot-new-password" className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type={forgotShowPassword ? 'text' : 'password'}
                          id="forgot-new-password"
                          name="forgotNewPassword"
                          value={forgotNewPassword}
                          onChange={(e) => {
                            setForgotNewPassword(e.target.value);
                            if (forgotError) setForgotError('');
                          }}
                          placeholder="••••••••••••"
                          autoComplete="new-password"
                          className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none font-medium transition-all"
                          required
                          minLength="6"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setForgotShowPassword(!forgotShowPassword)}
                          className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-emerald-700 cursor-pointer"
                        >
                          {forgotShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">Minimum 6 characters.</p>
                    </div>

                    <div>
                      <label htmlFor="forgot-confirm-password" className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type={forgotShowPassword ? 'text' : 'password'}
                          id="forgot-confirm-password"
                          name="forgotConfirmPassword"
                          value={forgotConfirmPassword}
                          onChange={(e) => {
                            setForgotConfirmPassword(e.target.value);
                            if (forgotError) setForgotError('');
                          }}
                          placeholder="••••••••••••"
                          autoComplete="new-password"
                          className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none font-medium transition-all"
                          required
                          minLength="6"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading || !forgotNewPassword || !forgotConfirmPassword}
                      className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {forgotLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Saving New Password...</span>
                        </>
                      ) : (
                        <span>Save New Password &amp; Finish &rarr;</span>
                      )}
                    </button>

                    <div className="flex justify-start pt-1 text-xs">
                      <button
                        type="button"
                        onClick={() => { setForgotStep(2); setForgotError(''); }}
                        className="text-gray-500 hover:text-gray-800 font-bold cursor-pointer"
                      >
                        &larr; Back to Verification Code
                      </button>
                    </div>
                  </form>
                </>
              )}

              {forgotStep === 4 && (
                <div className="text-center py-3">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3.5 mx-auto shadow-sm border border-emerald-300">
                    <CheckCircle2 className="w-9 h-9 text-emerald-600" />
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-gray-900 mb-1.5">
                    Password Successfully Reset!
                  </h4>
                  <p className="text-xs text-gray-600 mb-6 leading-relaxed">
                    Your account password has been updated in the database. You can now sign in using your new credentials.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="w-full py-3 bg-emerald-800 hover:bg-emerald-700 text-white font-black rounded-xl text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    Proceed to Sign In &rarr;
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer Bar - Matching Landing Page Edge-to-Edge Footer Bar */}
      <footer className="bg-emerald-950/90 border-t border-emerald-900 py-2.5 px-4 sm:px-8 lg:px-12 text-center shrink-0 z-10 w-full">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-0.5 sm:gap-1 text-[10px] sm:text-[11px] text-emerald-400 font-medium">
          <p>© {new Date().getFullYear()} Cavite State University Naic Campus • NSTP System</p>
          <p className="text-emerald-300/70">Authorized Faculty &amp; Admin Personnel Access Only</p>
        </div>
      </footer>
    </div>
  );
}

export default Login;
