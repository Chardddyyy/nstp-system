import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, ArrowLeft, Shield, Sparkles, CheckCircle2, Award } from 'lucide-react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loadingText, setLoadingText] = useState('Connecting to Portal...');

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        setError(result.message || 'Invalid email or password');
        setPassword('');
      }
    } catch (err) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      console.error('Login error:', err);
      const errMsg = err?.message || '';
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

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col justify-between bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white font-sans selection:bg-emerald-500 selection:text-white relative">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header - Edge-to-Edge Desktop & Compact Mobile Match */}
      <header className="bg-emerald-900/90 backdrop-blur-md text-white border-b border-emerald-800/80 shrink-0 z-10">
        <div className="w-full px-3 sm:px-8 py-2 sm:py-3 flex justify-between items-center gap-2">
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

          {/* Right Form Card (Scaled down for Mobile) */}
          <div className="lg:col-span-7 p-3.5 sm:p-8 flex flex-col justify-center overflow-y-auto">
            {/* Mobile Decorative Hero Header Banner (Exact Desktop Style) */}
            <div className="lg:hidden bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-xl p-3 mb-3 border border-emerald-800/60 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 bg-white rounded-lg p-0.5 flex items-center justify-center shrink-0 shadow-xs border border-emerald-700">
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

            <div className="text-center sm:text-left mb-3 sm:mb-6">
              <h2 className="text-base sm:text-3xl font-black text-emerald-950 tracking-tight">Portal Login</h2>
              <p className="text-gray-500 text-[10px] sm:text-xs mt-0.5">Sign in with your official CvSU faculty or admin credentials</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-2 animate-shake">
                  <span className="w-2 h-2 rounded-full bg-red-600 shrink-0"></span>
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1">
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
                    inputMode="email"
                    className="w-full pl-9 pr-3 py-2 text-[11px] sm:text-xs bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:border-transparent outline-none transition-all font-medium"
                    placeholder="e.g. admin@cvsu.edu.ph"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1">
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
                    className="w-full pl-9 pr-9 py-2 text-[11px] sm:text-xs bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:border-transparent outline-none transition-all font-medium"
                    placeholder="••••••••••••"
                    autoComplete="current-password"
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
              </div>

              {/* Quick Fill One-Tap Account Chips */}
              <div className="pt-1">
                <p className="text-[10px] font-bold text-gray-500 mb-1.5 flex items-center justify-between">
                  <span>Quick Tap Sign-In:</span>
                </p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('admin@cvsu.edu.ph');
                      setPassword('admin123');
                      setError('');
                    }}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-black cursor-pointer active:scale-95 transition-all"
                  >
                    🛡️ Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('instructor@cvsu.edu.ph');
                      setPassword('instructor123');
                      setError('');
                    }}
                    className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-[10px] font-black cursor-pointer active:scale-95 transition-all"
                  >
                    👨‍🏫 CWTS Instructor
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

            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-row items-center justify-between gap-1 text-[10px] sm:text-xs">
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

      {/* Footer Bar - Matching Landing Page Edge-to-Edge Footer Bar */}
      <footer className="bg-emerald-950/90 border-t border-emerald-900 py-2 px-3 sm:px-8 text-center shrink-0 z-10">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-0.5 sm:gap-1 text-[10px] sm:text-[11px] text-emerald-400 font-medium">
          <p>© {new Date().getFullYear()} Cavite State University Naic Campus • NSTP System</p>
          <p className="text-emerald-300/70">Authorized Faculty &amp; Admin Personnel Access Only</p>
        </div>
      </footer>
    </div>
  );
}

export default Login;
