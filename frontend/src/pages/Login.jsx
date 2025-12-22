import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!credentials.email || !credentials.password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      await login(credentials);
      navigate('/admin/dashboard');
    } catch (error) {
      setError(error.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-700 text-white mb-4 shadow-lg">
              <span className="text-2xl font-bold">P</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">PayrollPro</h1>
            <p className="text-slate-600">Sign in to your account</p>
          </motion.div>
        </div>

        {/* Login Card */}
        <Card className="border-2 shadow-xl bg-white">
          <CardContent className="pt-6 pb-8 px-8">
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </motion.div>
              )}

              {/* Email Field */}
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all hover:border-slate-300"
                    value={credentials.email}
                    onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-sm text-slate-600 hover:text-slate-900 hover:underline transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-3 border-2 border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all hover:border-slate-300"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full py-6 text-base font-semibold shadow-md hover:shadow-lg"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-xs text-slate-600 mb-2 font-semibold">Demo Credentials:</p>
              <div className="space-y-1.5 text-xs">
                <p className="text-slate-700 font-mono">
                  <span className="font-semibold text-slate-900">Admin:</span> admin@payrollpro.com / admin123
                </p>
                <p className="text-slate-700 font-mono">
                  <span className="font-semibold text-slate-900">Employee:</span> employee@payrollpro.com / employee123
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 mt-6">
          © 2025 PayrollPro. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
};

export default Login;