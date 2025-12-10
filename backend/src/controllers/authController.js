import jwt from 'jsonwebtoken';
import Employee from '../models/Employee.js';
import { asyncHandler, AppError } from '../middlewares/errorHandler.js';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });
};

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new AppError('Please provide email and password', 400);
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

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

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