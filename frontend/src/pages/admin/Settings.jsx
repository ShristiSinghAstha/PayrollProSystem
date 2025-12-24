import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Form, message } from 'antd';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import axios from '@/api/axios';
import { useAuth } from '@/contexts/AuthContext';

const AdminSettings = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [errors, setErrors] = useState({});

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.currentPassword) {
            newErrors.currentPassword = 'Current password is required';
        }

        if (!formData.newPassword) {
            newErrors.newPassword = 'New password is required';
        } else if (formData.newPassword.length < 6) {
            newErrors.newPassword = 'Password must be at least 6 characters';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your new password';
        } else if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (formData.currentPassword === formData.newPassword) {
            newErrors.newPassword = 'New password must be different from current password';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            await axios.put('/api/auth/change-password', {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            });

            message.success('Password changed successfully!');

            // Reset form
            setFormData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setShowPasswords({
                current: false,
                new: false,
                confirm: false
            });

        } catch (error) {
            console.error('Password change error:', error);
            const errorMessage = error.response?.data?.message || 'Failed to change password';
            message.error(errorMessage);

            if (errorMessage.includes('Current password')) {
                setErrors({ currentPassword: errorMessage });
            }
        } finally {
            setLoading(false);
        }
    };

    const passwordStrength = (password) => {
        if (!password) return { strength: 0, label: '', color: '' };

        let strength = 0;
        if (password.length >= 6) strength++;
        if (password.length >= 10) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;

        if (strength <= 2) return { strength, label: 'Weak', color: 'bg-red-500' };
        if (strength === 3) return { strength, label: 'Fair', color: 'bg-yellow-500' };
        if (strength === 4) return { strength, label: 'Good', color: 'bg-blue-500' };
        return { strength, label: 'Strong', color: 'bg-green-500' };
    };

    const strength = passwordStrength(formData.newPassword);

    return (
        <PageContainer>
            {/* Header */}
            <div className="border-b bg-card mb-8" style={{ margin: '-24px -24px 32px -24px', padding: '32px' }}>
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground">Settings</h1>
                    <p className="mt-2 text-sm text-muted-foreground">Manage your account settings and preferences</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Info Card */}
                <Card className="border">
                    <CardHeader>
                        <CardTitle className="text-lg">Profile Information</CardTitle>
                        <CardDescription>Your account details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Name</p>
                            <p className="text-base font-medium text-foreground">
                                {user?.personalInfo?.firstName} {user?.personalInfo?.lastName}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="text-base font-medium text-foreground">{user?.personalInfo?.email}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Employee ID</p>
                            <p className="text-base font-medium text-foreground">{user?.employeeId}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Role</p>
                            <p className="text-base font-medium text-foreground capitalize">{user?.role}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Department</p>
                            <p className="text-base font-medium text-foreground">{user?.employment?.department}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Change Password Card */}
                <Card className="border lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Lock className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">Change Password</CardTitle>
                        </div>
                        <CardDescription>Update your password to keep your account secure</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Current Password */}
                            <div className="space-y-2">
                                <label htmlFor="currentPassword" className="text-sm font-medium text-foreground">Current Password</label>
                                <Input.Password
                                    id="currentPassword"
                                    name="currentPassword"
                                    value={formData.currentPassword}
                                    onChange={handleChange}
                                    status={errors.currentPassword ? 'error' : ''}
                                    placeholder="Enter your current password"
                                    iconRender={(visible) => (visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />)}
                                    className="w-full"
                                />
                                {errors.currentPassword && (
                                    <div className="flex items-center gap-1 text-sm text-red-500">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.currentPassword}
                                    </div>
                                )}
                            </div>

                            {/* New Password */}
                            <div className="space-y-2">
                                <label htmlFor="newPassword" className="text-sm font-medium text-foreground">New Password</label>
                                <Input.Password
                                    id="newPassword"
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    status={errors.newPassword ? 'error' : ''}
                                    placeholder="Enter your new password"
                                    iconRender={(visible) => (visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />)}
                                    className="w-full"
                                />
                                {errors.newPassword && (
                                    <div className="flex items-center gap-1 text-sm text-red-500">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.newPassword}
                                    </div>
                                )}

                                {/* Password Strength Indicator */}
                                {formData.newPassword && !errors.newPassword && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">Password strength:</span>
                                            <span className={`font-medium ${strength.label === 'Weak' ? 'text-red-500' :
                                                strength.label === 'Fair' ? 'text-yellow-500' :
                                                    strength.label === 'Good' ? 'text-blue-500' :
                                                        'text-green-500'
                                                }`}>
                                                {strength.label}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all ${strength.color}`}
                                                style={{ width: `${(strength.strength / 5) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">Confirm New Password</label>
                                <Input.Password
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    status={errors.confirmPassword ? 'error' : ''}
                                    placeholder="Confirm your new password"
                                    iconRender={(visible) => (visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />)}
                                    className="w-full"
                                />
                                {errors.confirmPassword && (
                                    <div className="flex items-center gap-1 text-sm text-red-500">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.confirmPassword}
                                    </div>
                                )}
                                {formData.confirmPassword && formData.newPassword === formData.confirmPassword && !errors.confirmPassword && (
                                    <div className="flex items-center gap-1 text-sm text-green-500">
                                        <CheckCircle className="h-3 w-3" />
                                        Passwords match
                                    </div>
                                )}
                            </div>

                            {/* Security Tips */}
                            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                <p className="text-sm font-medium text-foreground">Password requirements:</p>
                                <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                                    <li>At least 6 characters long</li>
                                    <li>Use a mix of uppercase and lowercase letters</li>
                                    <li>Include numbers and special characters</li>
                                    <li>Different from your current password</li>
                                </ul>
                            </div>

                            {/* Submit Button */}
                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Changing Password...
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="h-4 w-4" />
                                            Change Password
                                        </>
                                    )}
                                </Button>
                                {Object.keys(formData).some(key => formData[key]) && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                            setErrors({});
                                            setShowPasswords({ current: false, new: false, confirm: false });
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </PageContainer>
    );
};

export default AdminSettings;
