import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, ArrowLeft } from "lucide-react";
import { motion } from 'framer-motion';
import { message } from 'antd';
import axios from '@/api/axios';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            message.error('Please enter your email address');
            return;
        }

        setLoading(true);
        try {
            await axios.post('/api/auth/forgot-password', { email });
            setSubmitted(true);
            message.success('Password reset link sent to your email');
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to send reset link');
        } finally {
            setLoading(false);
        }
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
                        <p className="text-muted-foreground">Reset your password</p>
                    </motion.div>
                </div>

                {/* Card */}
                <Card className="border shadow-lg">
                    <CardContent className="pt-6">
                        {!submitted ? (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="text-center mb-6">
                                    <p className="text-sm text-muted-foreground">
                                        Enter your email address and we'll send you a link to reset your password.
                                    </p>
                                </div>

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
                                        />
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    className="w-full py-6 text-base font-medium"
                                    disabled={loading}
                                >
                                    {loading ? 'Sending...' : 'Send Reset Link'}
                                </Button>

                                {/* Back to Login */}
                                <div className="text-center">
                                    <Link to="/login" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                                        <ArrowLeft className="h-4 w-4" />
                                        Back to Login
                                    </Link>
                                </div>
                            </form>
                        ) : (
                            <div className="text-center py-8">
                                <div className="rounded-full bg-green-50 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                    <Mail className="h-8 w-8 text-green-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground mb-2">
                                    Check your email
                                </h3>
                                <p className="text-sm text-muted-foreground mb-6">
                                    We've sent a password reset link to <strong>{email}</strong>
                                </p>
                                <Link to="/login">
                                    <Button variant="outline" className="gap-2">
                                        <ArrowLeft className="h-4 w-4" />
                                        Back to Login
                                    </Button>
                                </Link>
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

export default ForgotPassword;
