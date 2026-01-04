import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, Clock, RefreshCw } from "lucide-react";
import { motion } from 'framer-motion';
import OTPInput from '@/components/auth/OTPInput';

const Login = () => {
  const navigate = useNavigate();

  // Step management
  const [step, setStep] = useState(1); // 1 = Credentials, 2 = OTP

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      // Call login API directly (not through context)
      const { login } = await import('@/api/authApi');
      const response = await login({ email, password });

      // Login now sends OTP instead of returning token
      setMaskedEmail(response.data.email || email);
      setStep(2);
      startResendCooldown();
    } catch (error) {
      setError(error.response?.data?.error?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (otpValue) => {
    setError('');
    setLoading(true);

    try {
      const { verifyOTP } = await import('@/api/authApi');
      const response = await verifyOTP(email, otpValue);

      // Store token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));

      // Navigate based on role
      const isAdmin = response.data.data.user.role === 'admin';
      navigate(isAdmin ? '/admin/dashboard' : '/employee/dashboard');

      // Reload to update auth context
      window.location.reload();
    } catch (error) {
      setError(error.response?.data?.error?.message || 'Invalid OTP. Please try again.');
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;

    setError('');
    setLoading(true);

    try {
      const { resendOTP } = await import('@/api/authApi');
      await resendOTP(email);
      startResendCooldown();
      setError(''); // Clear any previous errors
    } catch (error) {
      setError(error.response?.data?.error?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  // Cooldown timer
  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Back to credentials
  const handleBack = () => {
    setStep(1);
    setOtp('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
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
            <h1 className="text-4xl font-bold text-foreground mb-2">PayrollPro</h1>
            <p className="text-muted-foreground">
              {step === 1 ? 'Sign in to your account' : 'Enter verification code'}
            </p>
          </motion.div>
        </div>

        {/* Login Card */}
        <Card className="border shadow-lg">
          <CardContent className="pt-6">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md mb-6"
              >
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </motion.div>
            )}

            {/* STEP 1: Credentials */}
            {step === 1 && (
              <form onSubmit={handleSendOTP} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-foreground">
                      Password
                    </label>
                    <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-12 py-3 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full py-6 text-base font-medium"
                  disabled={loading}
                >
                  {loading ? 'Sending OTP...' : 'Continue'}
                </Button>
              </form>
            )}

            {/* STEP 2: OTP Verification */}
            {step === 2 && (
              <div className="space-y-6">
                {/* Back Button */}
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                  disabled={loading}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </button>

                {/* Instructions */}
                <div className="text-center">
                  <Clock className="h-12 w-12 mx-auto mb-3 text-primary" />
                  <p className="text-sm text-muted-foreground mb-1">
                    We've sent a 6-digit code to
                  </p>
                  <p className="font-semibold text-foreground mb-4">{maskedEmail}</p>
                  <p className="text-xs text-muted-foreground">
                    Code expires in 5 minutes
                  </p>
                </div>

                {/* OTP Input */}
                <div>
                  <OTPInput
                    length={6}
                    onComplete={handleVerifyOTP}
                    disabled={loading}
                  />
                </div>

                {/* Resend OTP */}
                <div className="text-center">
                  {resendCooldown > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Resend code in <span className="font-semibold">{resendCooldown}s</span>
                    </p>
                  ) : (
                    <button
                      onClick={handleResendOTP}
                      disabled={loading}
                      className="text-sm text-primary hover:underline font-medium flex items-center gap-2 mx-auto"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Resend OTP
                    </button>
                  )}
                </div>

                {/* Security Note */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-xs text-blue-800 text-center">
                    🔒 For your security, never share this code with anyone
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          © 2025 PayrollPro. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
};

export default Login;