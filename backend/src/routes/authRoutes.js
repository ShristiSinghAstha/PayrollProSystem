import express from 'express';
import {
    login,
    logout,
    getMe,
    changePassword,
    updateProfile,
    forgotPassword,
    resetPassword,
    verifyOTP,
    resendOTP
} from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// OTP-based login routes
router.post('/login', login);                    // Step 1: Send OTP
router.post('/verify-otp', verifyOTP);           // Step 2: Verify OTP & Login
router.post('/resend-otp', resendOTP);           // Resend OTP

router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.put('/update-profile', protect, updateProfile);

// Password reset routes (public)
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;
