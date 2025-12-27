import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Employee from '../models/Employee.js';
import { asyncHandler, AppError } from '../middlewares/errorHandler.js';
import { sendPasswordResetEmail, sendOTPEmail } from '../utils/emailService.js';
import { createOTP, verifyOTP as verifyOTPUtil, maskEmail, canRequestOTP } from '../utils/otpService.js';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });
};

// Step 1: Login with email and password - Send OTP
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new AppError('Please provide email and password', 400);
    }

    // Check rate limiting
    const canRequest = await canRequestOTP(email);
    if (!canRequest) {
        throw new AppError('Too many OTP requests. Please try again after 15 minutes', 429);
    }

    const user = await Employee.findOne({ 'personalInfo.email': email })
        .select('+password');

    if (!user) {
        throw new AppError('Invalid email or password', 401);
    }

    if (user.employment.status !== 'Active') {
        throw new AppError('Your account is inactive. Contact admin', 403);
    }

    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
        throw new AppError('Invalid email or password', 401);
    }

    // Generate and send OTP
    const otpCode = await createOTP(email);

    // Send OTP via email
    const userName = `${user.personalInfo.firstName} ${user.personalInfo.lastName}`;
    await sendOTPEmail(email, otpCode, userName);

    res.status(200).json({
        success: true,
        message: 'OTP has been sent to your email',
        email: maskEmail(email)
    });
});

// Step 2: Verify OTP and complete login
export const verifyOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        throw new AppError('Please provide email and OTP', 400);
    }

    // Verify OTP
    const verification = await verifyOTPUtil(email, otp);

    if (!verification.success) {
        throw new AppError(verification.message, 401);
    }

    // OTP is valid - fetch user and complete login
    const user = await Employee.findOne({ 'personalInfo.email': email });

    if (!user) {
        throw new AppError('User not found', 404);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate JWT token
    const token = generateToken(user._id);
    const userData = user.getPublicProfile();

    res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        data: {
            user: userData
        }
    });
});

// Resend OTP
export const resendOTP = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new AppError('Please provide email', 400);
    }

    // Check rate limiting
    const canRequest = await canRequestOTP(email);
    if (!canRequest) {
        throw new AppError('Too many OTP requests. Please try again after 15 minutes', 429);
    }

    const user = await Employee.findOne({ 'personalInfo.email': email });

    if (!user) {
        throw new AppError('User not found', 404);
    }

    // Generate and send new OTP
    const otpCode = await createOTP(email);
    const userName = `${user.personalInfo.firstName} ${user.personalInfo.lastName}`;
    await sendOTPEmail(email, otpCode, userName);

    res.status(200).json({
        success: true,
        message: 'New OTP has been sent to your email'
    });
});

export const logout = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Logout successful'
    });
});

export const getMe = asyncHandler(async (req, res) => {
    const user = await Employee.findById(req.user._id).select('-password');

    if (!user) {
        throw new AppError('User not found', 404);
    }

    res.status(200).json({
        success: true,
        data: user.getPublicProfile()
    });
});

export const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        throw new AppError('Please provide current password and new password', 400);
    }

    if (newPassword.length < 6) {
        throw new AppError('New password must be at least 6 characters', 400);
    }

    const user = await Employee.findById(req.user._id).select('+password');

    const isPasswordCorrect = await user.comparePassword(currentPassword);

    if (!isPasswordCorrect) {
        throw new AppError('Current password is incorrect', 401);
    }

    user.password = newPassword;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
        success: true,
        message: 'Password changed successfully',
        token
    });
});

export const updateProfile = asyncHandler(async (req, res) => {
    const { personalInfo } = req.body;

    if (!personalInfo) {
        throw new AppError('Please provide data to update', 400);
    }

    const allowedFields = ['phone', 'address'];
    const updates = {};

    Object.keys(personalInfo).forEach(key => {
        if (allowedFields.includes(key)) {
            updates[`personalInfo.${key}`] = personalInfo[key];
        }
    });

    if (Object.keys(updates).length === 0) {
        throw new AppError('No valid fields to update', 400);
    }

    const user = await Employee.findByIdAndUpdate(
        req.user._id,
        { $set: updates },
        { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: user.getPublicProfile()
    });
});

// Forgot Password - Send reset email
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new AppError('Please provide your email address', 400);
    }

    const user = await Employee.findOne({ 'personalInfo.email': email });

    if (!user) {
        // Don't reveal if user exists for security
        return res.status(200).json({
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent'
        });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token and save to database
    const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour

    await user.save({ validateBeforeSave: false });

    // Send email with reset link
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    try {
        await sendPasswordResetEmail(user.personalInfo.email, {
            name: `${user.personalInfo.firstName} ${user.personalInfo.lastName}`,
            resetUrl
        });

        res.status(200).json({
            success: true,
            message: 'Password reset link sent to your email'
        });
    } catch (error) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        throw new AppError('Error sending email. Please try again later', 500);
    }
});

// Reset Password with token
export const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
        throw new AppError('Please provide a new password', 400);
    }

    if (password.length < 6) {
        throw new AppError('Password must be at least 6 characters', 400);
    }

    // Hash the token from URL
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    // Find user with valid token
    const user = await Employee.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
        throw new AppError('Invalid or expired reset token', 400);
    }

    // Update password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Generate new JWT token
    const jwtToken = generateToken(user._id);

    res.status(200).json({
        success: true,
        message: 'Password reset successfully',
        token: jwtToken
    });
});