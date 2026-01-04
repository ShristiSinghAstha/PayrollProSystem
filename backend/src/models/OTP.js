import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true
    },
    otp: {
        type: String,
        required: true
    },
    attempts: {
        type: Number,
        default: 0,
        max: 3
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300 // Auto-delete after 5 minutes (300 seconds)
    }
});

// Hash OTP before saving
otpSchema.pre('save', async function () {
    if (!this.isModified('otp')) return;

    const salt = await bcrypt.genSalt(10);
    this.otp = await bcrypt.hash(this.otp, salt);
});

// Method to verify OTP
otpSchema.methods.verifyOTP = async function (candidateOTP) {
    return await bcrypt.compare(candidateOTP, this.otp);
};

// Static method to find valid OTP
otpSchema.statics.findValidOTP = function (email) {
    return this.findOne({
        email,
        expiresAt: { $gt: new Date() },
        attempts: { $lt: 3 }
    });
};

export default mongoose.model('OTP', otpSchema);
