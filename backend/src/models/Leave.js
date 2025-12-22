import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema(
    {
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
            required: true,
            index: true
        },
        leaveType: {
            type: String,
            enum: ['Casual', 'Sick', 'Earned', 'LOP', 'Maternity', 'Paternity'],
            required: true
        },
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date,
            required: true
        },
        totalDays: {
            type: Number,
            required: true,
            min: 0.5
        },
        reason: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500
        },
        status: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected'],
            default: 'Pending',
            index: true
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee'
        },
        approvedAt: {
            type: Date
        },
        rejectionReason: {
            type: String,
            trim: true,
            maxlength: 500
        },
        remarks: {
            type: String,
            trim: true,
            maxlength: 500
        }
    },
    {
        timestamps: true
    }
);

// Indexes for better query performance
leaveSchema.index({ employeeId: 1, status: 1 });
leaveSchema.index({ startDate: 1, endDate: 1 });
leaveSchema.index({ createdAt: -1 });

// Virtual for leave duration display
leaveSchema.virtual('duration').get(function () {
    return `${this.totalDays} day${this.totalDays > 1 ? 's' : ''}`;
});

// Method to approve leave
leaveSchema.methods.approve = function (approverId, remarks = '') {
    if (this.status !== 'Pending') {
        throw new Error('Only pending leaves can be approved');
    }
    this.status = 'Approved';
    this.approvedBy = approverId;
    this.approvedAt = new Date();
    this.remarks = remarks;
};

// Method to reject leave
leaveSchema.methods.reject = function (approverId, reason) {
    if (this.status !== 'Pending') {
        throw new Error('Only pending leaves can be rejected');
    }
    this.status = 'Rejected';
    this.approvedBy = approverId;
    this.approvedAt = new Date();
    this.rejectionReason = reason;
};

// Static method to get leave balance for an employee
leaveSchema.statics.getLeaveBalance = async function (employeeId, year = new Date().getFullYear()) {
    // Get all approved leaves (not filtered by year anymore)
    const leaves = await this.find({
        employeeId,
        status: 'Approved'
    });

    const balance = {
        Casual: { allocated: 12, used: 0, remaining: 12 },
        Sick: { allocated: 12, used: 0, remaining: 12 },
        Earned: { allocated: 18, used: 0, remaining: 18 },
        LOP: { used: 0 }
    };

    leaves.forEach(leave => {
        if (leave.leaveType === 'LOP') {
            balance.LOP.used += leave.totalDays;
        } else if (balance[leave.leaveType]) {
            balance[leave.leaveType].used += leave.totalDays;
            balance[leave.leaveType].remaining -= leave.totalDays;
        }
    });

    return balance;
};

// Static method to get LOP days for a specific month
leaveSchema.statics.getLOPDaysForMonth = async function (employeeId, year, month) {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const lopLeaves = await this.find({
        employeeId,
        leaveType: 'LOP',
        status: 'Approved',
        $or: [
            {
                startDate: { $gte: startOfMonth, $lte: endOfMonth }
            },
            {
                endDate: { $gte: startOfMonth, $lte: endOfMonth }
            },
            {
                startDate: { $lt: startOfMonth },
                endDate: { $gt: endOfMonth }
            }
        ]
    });

    let totalLOPDays = 0;

    lopLeaves.forEach(leave => {
        const leaveStart = leave.startDate > startOfMonth ? leave.startDate : startOfMonth;
        const leaveEnd = leave.endDate < endOfMonth ? leave.endDate : endOfMonth;

        const daysDiff = Math.floor((leaveEnd - leaveStart) / (1000 * 60 * 60 * 24)) + 1;
        totalLOPDays += Math.max(0, daysDiff);
    });

    return totalLOPDays;
};

// Validation before save
leaveSchema.pre('save', async function () {
    if (this.endDate < this.startDate) {
        throw new Error('End date must be after or equal to start date');
    }

    // Calculate total days if not set
    if (!this.totalDays) {
        const diffTime = Math.abs(this.endDate - this.startDate);
        this.totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
});

const Leave = mongoose.model('Leave', leaveSchema);

export default Leave;
