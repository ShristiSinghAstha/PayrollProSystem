import mongoose from 'mongoose';

const performanceReviewSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
        index: true
    },

    reviewPeriod: {
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true }
    },

    reviewType: {
        type: String,
        enum: ['Quarterly', 'Half-Yearly', 'Annual', 'Probation', 'Ad-hoc'],
        default: 'Quarterly'
    },

    // Performance Metrics
    ratings: {
        technicalSkills: {
            score: { type: Number, min: 1, max: 5, required: true },
            comments: String
        },
        communication: {
            score: { type: Number, min: 1, max: 5, required: true },
            comments: String
        },
        teamwork: {
            score: { type: Number, min: 1, max: 5, required: true },
            comments: String
        },
        productivity: {
            score: { type: Number, min: 1, max: 5, required: true },
            comments: String
        },
        initiative: {
            score: { type: Number, min: 1, max: 5, required: true },
            comments: String
        },
        overallRating: {
            type: Number,
            min: 1,
            max: 5
        }
    },

    // Goals & Achievements
    achievements: [{
        title: String,
        description: String,
        impact: String
    }],

    areasOfImprovement: [{
        area: String,
        actionPlan: String
    }],

    goalsForNextPeriod: [{
        goal: String,
        deadline: Date,
        priority: { type: String, enum: ['High', 'Medium', 'Low'] }
    }],

    // Manager Feedback
    managerComments: {
        strengths: String,
        weaknesses: String,
        overallFeedback: String
    },

    // Employee Self-Assessment (optional)
    selfAssessment: {
        achievements: String,
        challenges: String,
        goals: String,
        submitted: { type: Boolean, default: false }
    },

    // Salary Adjustment Recommendation
    salaryAdjustment: {
        recommended: { type: Boolean, default: false },
        type: { type: String, enum: ['Increment', 'Bonus', 'Promotion', 'None'], default: 'None' },
        percentage: Number,
        amount: Number,
        effectiveDate: Date,
        reason: String
    },

    // Workflow
    status: {
        type: String,
        enum: ['Draft', 'Self-Assessment-Pending', 'Under-Review', 'Completed', 'Acknowledged'],
        default: 'Draft',
        index: true
    },

    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
    },

    reviewedAt: Date,
    acknowledgedAt: Date,

    // Attachments (optional)
    attachments: [{
        fileName: String,
        fileUrl: String,
        uploadedAt: { type: Date, default: Date.now }
    }]

}, {
    timestamps: true
});

// Compound index
performanceReviewSchema.index({ employeeId: 1, reviewPeriod: 1 });

// Unique constraint: Prevent duplicate reviews for same period
performanceReviewSchema.index({
    employeeId: 1,
    'reviewPeriod.startDate': 1,
    'reviewPeriod.endDate': 1
}, { unique: true });

// Pre-save hook: Calculate overall rating
performanceReviewSchema.pre('save', function () {
    if (this.ratings) {
        const scores = [
            this.ratings.technicalSkills?.score || 0,
            this.ratings.communication?.score || 0,
            this.ratings.teamwork?.score || 0,
            this.ratings.productivity?.score || 0,
            this.ratings.initiative?.score || 0
        ];

        const validScores = scores.filter(s => s > 0);
        if (validScores.length > 0) {
            const sum = validScores.reduce((acc, val) => acc + val, 0);
            this.ratings.overallRating = Math.round((sum / validScores.length) * 10) / 10;
        }
    }
});

// Instance method: Complete review
performanceReviewSchema.methods.complete = function (reviewerId) {
    this.status = 'Completed';
    this.reviewedBy = reviewerId;
    this.reviewedAt = new Date();
};

// Instance method: Acknowledge review
performanceReviewSchema.methods.acknowledge = function () {
    this.status = 'Acknowledged';
    this.acknowledgedAt = new Date();
};

// Static method: Get employee reviews
performanceReviewSchema.statics.getEmployeeReviews = function (employeeId, limit = 5) {
    return this.find({ employeeId })
        .populate('reviewedBy', 'personalInfo.firstName personalInfo.lastName')
        .sort({ createdAt: -1 })
        .limit(limit);
};

// Static method: Get pending reviews
performanceReviewSchema.statics.getPendingReviews = function () {
    return this.find({
        status: { $in: ['Draft', 'Self-Assessment-Pending', 'Under-Review'] }
    })
        .populate('employeeId', 'personalInfo employment employeeId')
        .populate('reviewedBy', 'personalInfo.firstName personalInfo.lastName')
        .sort({ createdAt: -1 });
};

// Static method: Get reviews for salary adjustment
performanceReviewSchema.statics.getReviewsForSalaryAdjustment = function () {
    return this.find({
        status: 'Completed',
        'salaryAdjustment.recommended': true,
        'salaryAdjustment.effectiveDate': { $lte: new Date() }
    })
        .populate('employeeId', 'personalInfo employment salaryStructure employeeId');
};

// Static method: Get review statistics
performanceReviewSchema.statics.getReviewStats = async function (filters = {}) {
    const matchStage = {};

    if (filters.startDate && filters.endDate) {
        matchStage.createdAt = {
            $gte: new Date(filters.startDate),
            $lte: new Date(filters.endDate)
        };
    }

    const stats = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                avgOverallRating: { $avg: '$ratings.overallRating' }
            }
        }
    ]);

    return stats;
};

export default mongoose.model('PerformanceReview', performanceReviewSchema);
