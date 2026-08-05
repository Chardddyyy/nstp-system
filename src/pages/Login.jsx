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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
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
      console.error('Login error:', err);
      setError('Server connection failed. Please try again.');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col justify-between bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white font-sans selection:bg-emerald-500 selection:text-white relative">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header - Matching Landing Page Aesthetics */}
      <header className="bg-emerald-900/90 backdrop-blur-md text-white border-b border-emerald-800/80 shrink-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 bg-white rounded-2xl p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md border border-emerald-700">
              <img src={`${import.meta.env.BASE_URL}cvsu.png`} alt="CvSU Logo" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black tracking-tight truncate">Cavite State University Naic</h1>
                <span className="hidden sm:inline-flex bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                  NSTP Portal
                </span>
              </div>
              <p className="text-emerald-200 text-[11px] truncate">National Service Training Program System</p>
            </div>
          </div>

          <Link 
            to="/" 
            className="flex items-center gap-1.5 bg-emerald-800/90 hover:bg-emerald-700 text-emerald-100 font-bold px-3.5 py-1.5 rounded-xl text-xs border border-emerald-700/80 active:scale-95 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area - Fixed & Non-Scrollable */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-hidden relative z-10">
        <div className="max-w-4xl w-full bg-white/95 rounded-3xl shadow-2xl border border-white/20 text-gray-900 grid lg:grid-cols-12 overflow-hidden my-auto max-h-[calc(100vh-120px)]">
          {/* Left Decorative Hero Panel */}
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

          {/* Right Form Card */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center overflow-y-auto">
            <div className="text-center sm:text-left mb-6">
              <div className="lg:hidden flex justify-center mb-3">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl p-2 flex items-center justify-center border border-emerald-100 shadow-sm">
                  <img src={`${import.meta.env.BASE_URL}cvsu.png`} alt="CvSU Logo" className="w-full h-full object-contain" />
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight">Portal Login</h2>
              <p className="text-gray-500 text-xs mt-1">Sign in with your official CvSU faculty or admin credentials</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-shake">
                  <span className="w-2 h-2 rounded-full bg-red-600 shrink-0"></span>
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:border-transparent outline-none transition-all font-medium"
                    placeholder="e.g. admin@cvsu.edu.ph"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:border-transparent outline-none transition-all font-medium"
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-emerald-700 cursor-pointer transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-emerald-950 font-black py-3 rounded-xl transition-all shadow-md shadow-amber-950/20 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 text-xs sm:text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Authenticating...' : 'Sign In to Portal →'}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <span className="text-gray-500">Incoming Student?</span>
              <Link 
                to="/enrollment" 
                className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold hover:underline"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Online Enrollment Application &rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Bar - Matching Landing Page Footer Bar */}
      <footer className="bg-emerald-950/90 border-t border-emerald-900 py-2.5 px-4 text-center shrink-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px] text-emerald-400 font-medium">
          <p>© {new Date().getFullYear()} Cavite State University Naic Campus • NSTP System</p>
          <p className="text-emerald-300/70">Authorized Faculty &amp; Admin Personnel Access Only</p>
        </div>
      </footer>
    </div>
  );
}

export default Login;
