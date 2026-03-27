import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import { Eye, EyeOff, GraduationCap, Lock, Mail, ArrowLeft } from 'lucide-react';

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
    
    console.log('Login form submitted:', email);

    try {
      const result = await login(email, password);
      console.log('Login result:', result);
      
      if (result.success) {
        console.log('Login success, navigating to dashboard...');
        if (result.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/instructor/dashboard');
        }
      } else {
        console.log('Login failed:', result.message);
        setError(result.message || 'Invalid email or password');
        // Clear password field on error
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
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-900 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center text-gray-500 hover:text-green-700 mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-1" />
          Back to Home
        </Link>

        {/* Logo & Header */}
        <div className="text-center mb-8">
          <img src="/cvsu.png" alt="CvSU Logo" className="w-20 h-20 mx-auto mb-4 object-contain" />
          <h1 className="text-xl font-bold">Cavite State University Naic</h1>
          <p className="text-gray-600">NSTP Record & Report Management</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Credentials */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center mb-4">Demo Credentials</p>
          <div className="space-y-2 text-xs text-gray-600 bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between">
              <span>Admin:</span>
              <span className="font-mono">admin@cvsu.edu.ph / admin123</span>
            </div>
            <div className="flex justify-between">
              <span>CWTS:</span>
              <span className="font-mono">cwts@cvsu.edu.ph / cwts123</span>
            </div>
            <div className="flex justify-between">
              <span>LTS:</span>
              <span className="font-mono">lts@cvsu.edu.ph / lts123</span>
            </div>
            <div className="flex justify-between">
              <span>ROTC:</span>
              <span className="font-mono">rotc@cvsu.edu.ph / rotc123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
