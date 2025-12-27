import OTP from '../models/OTP.js';
import crypto from 'crypto';

/**
 * Generate a 6-digit OTP
 */
export const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

/**
 * Create and store OTP for email
 */
export const createOTP = async (email) => {
    try {
        console.log('📧 Creating OTP for email:', email);

        // Delete any existing OTPs for this email
        await OTP.deleteMany({ email });
        console.log('✅ Deleted existing OTPs');

        // Generate new OTP
        const otpCode = generateOTP();
        console.log('🔢 Generated OTP:', otpCode);

        // Create OTP record with 5-minute expiry
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        console.log('⏰ Expiry time:', expiresAt);

        const otpRecord = await OTP.create({
            email,
            otp: otpCode,
            expiresAt
        });
        console.log('✅ OTP record created:', otpRecord._id);

        // Return the plain OTP (before hashing) to send via email
        return otpCode;
    } catch (error) {
        console.error('❌ Error creating OTP:', error);
        console.error('Error details:', error.message);
        console.error('Stack:', error.stack);
        throw new Error('Failed to create OTP');
    }
};

/**
 * Verify OTP for email
 */
export const verifyOTP = async (email, otpCode) => {
    try {
        // Find valid OTP
        const otpRecord = await OTP.findValidOTP(email);

        if (!otpRecord) {
            return {
                success: false,
                message: 'Invalid or expired OTP'
            };
        }

        // Check if max attempts reached
        if (otpRecord.attempts >= 3) {
            await OTP.deleteOne({ _id: otpRecord._id });
            return {
                success: false,
                message: 'Maximum verification attempts exceeded. Please request a new OTP.'
            };
        }

        // Verify OTP
        const isValid = await otpRecord.verifyOTP(otpCode);

        if (!isValid) {
            // Increment attempts
            otpRecord.attempts += 1;
            await otpRecord.save();

            return {
                success: false,
                message: `Invalid OTP. ${3 - otpRecord.attempts} attempts remaining.`
            };
        }

        // OTP is valid - delete it
        await OTP.deleteOne({ _id: otpRecord._id });

        return {
            success: true,
            message: 'OTP verified successfully'
        };
    } catch (error) {
        console.error('Error verifying OTP:', error);
        throw new Error('Failed to verify OTP');
    }
};

/**
 * Mask email for security
 */
export const maskEmail = (email) => {
    const [localPart, domain] = email.split('@');
    const maskedLocal = localPart[0] + '***' + localPart[localPart.length - 1];
    return `${maskedLocal}@${domain}`;
};

/**
 * Check if user can request OTP (rate limiting)
 */
export const canRequestOTP = async (email) => {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const recentOTPs = await OTP.countDocuments({
        email,
        createdAt: { $gte: fifteenMinutesAgo }
    });

    return recentOTPs < 3;
};

export default {
    generateOTP,
    createOTP,
    verifyOTP,
    maskEmail,
    canRequestOTP
};
