import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
        index: true
    },
    date: {
        type: Date,
        required: true,
        index: true
    },
    checkIn: {
        time: Date,
        location: String,
        ip: String
    },
    checkOut: {
        time: Date,
        location: String,
        ip: String
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Half-Day', 'Leave', 'Holiday', 'Weekend'],
        default: 'Absent'
    },
    workHours: {
        type: Number,
        default: 0
    },
    isLate: {
        type: Boolean,
        default: false
    },
    lateMinutes: {
        type: Number,
        default: 0
    },
    remarks: String
}, {
    timestamps: true
});

// Compound index - one attendance record per employee per day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

// Pre-save hook: Calculate work hours and late status
attendanceSchema.pre('save', function () {
    // Calculate work hours if both check-in and check-out exist
    if (this.checkIn?.time && this.checkOut?.time) {
        const diffMs = this.checkOut.time - this.checkIn.time;
        this.workHours = diffMs / (1000 * 60 * 60); // Convert to hours

        // Auto-update status to Present if checked in and out
        if (this.status === 'Absent') {
            this.status = this.workHours >= 4 ? 'Present' : 'Half-Day';
        }
    }

    // Check if late (after 9:30 AM)
    if (this.checkIn?.time) {
        const checkInTime = new Date(this.checkIn.time);
        const hour = checkInTime.getHours();
        const minute = checkInTime.getMinutes();

        // Late if after 9:30 AM
        if (hour > 9 || (hour === 9 && minute > 30)) {
            this.isLate = true;
            this.lateMinutes = (hour - 9) * 60 + (minute - 30);
        } else {
            this.isLate = false;
            this.lateMinutes = 0;
        }
    }
});

// Static method: Get monthly attendance report for an employee
attendanceSchema.statics.getMonthlyReport = async function (employeeId, month, year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const records = await this.find({
        employeeId,
        date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    const summary = {
        totalDays: records.length,
        present: records.filter(r => r.status === 'Present').length,
        absent: records.filter(r => r.status === 'Absent').length,
        halfDay: records.filter(r => r.status === 'Half-Day').length,
        leave: records.filter(r => r.status === 'Leave').length,
        holiday: records.filter(r => r.status === 'Holiday').length,
        weekend: records.filter(r => r.status === 'Weekend').length,
        totalWorkHours: records.reduce((sum, r) => sum + (r.workHours || 0), 0),
        lateDays: records.filter(r => r.isLate).length,
        records
    };

    return summary;
};

// Static method: Get attendance stats
attendanceSchema.statics.getAttendanceStats = async function (employeeId, startDate, endDate) {
    const stats = await this.aggregate([
        {
            $match: {
                employeeId: new mongoose.Types.ObjectId(employeeId),
                date: { $gte: new Date(startDate), $lte: new Date(endDate) }
            }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalWorkHours: { $sum: '$workHours' }
            }
        }
    ]);

    return stats;
};

export default mongoose.model('Attendance', attendanceSchema);
