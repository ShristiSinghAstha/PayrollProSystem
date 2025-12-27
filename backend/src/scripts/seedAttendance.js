import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const EMPLOYEE_ID = '693ae3958a26cfca72ca9edc';

// Attendance Schema
const attendanceSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Employee'
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Half-Day', 'Leave', 'Holiday', 'Weekend'],
        default: 'Present'
    },
    checkIn: {
        time: Date,
        source: String
    },
    checkOut: {
        time: Date,
        source: String
    },
    workHours: Number,
    isLate: {
        type: Boolean,
        default: false
    },
    remarks: String
}, { timestamps: true });

const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);

// Helper to generate random time
const randomTime = (baseHour, minuteVariation = 15) => {
    const randomMinutes = Math.floor(Math.random() * minuteVariation);
    return `${String(baseHour).padStart(2, '0')}:${String(randomMinutes).padStart(2, '0')}`;
};

// Helper to calculate work hours
const calculateWorkHours = (checkIn, checkOut) => {
    const [inHour, inMin] = checkIn.split(':').map(Number);
    const [outHour, outMin] = checkOut.split(':').map(Number);

    const inMinutes = inHour * 60 + inMin;
    const outMinutes = outHour * 60 + outMin;

    return ((outMinutes - inMinutes) / 60).toFixed(2);
};

// Seed attendance data
const seedAttendance = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing attendance for this employee
        await Attendance.deleteMany({ employeeId: EMPLOYEE_ID });
        console.log('Cleared existing attendance data');


        const attendanceRecords = [];
        const today = new Date('2025-12-28');

        // Generate for past 3 months (Oct, Nov, Dec 2025)
        for (let monthOffset = 2; monthOffset >= 0; monthOffset--) {
            const currentDate = new Date(today);
            currentDate.setMonth(currentDate.getMonth() - monthOffset);
            currentDate.setDate(1);

            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);

                // Stop at current date
                if (date > today) break;

                const dayOfWeek = date.getDay();
                const dateStr = date.toISOString().split('T')[0];

                let record = {
                    employeeId: EMPLOYEE_ID,
                    date: date,
                    status: 'Present'
                };

                // Weekends (Saturday = 6, Sunday = 0)
                if (dayOfWeek === 0 || dayOfWeek === 6) {
                    record.status = 'Weekend';
                }
                // Holidays (Dec 25 - Christmas, Nov 1 - Diwali, Oct 31 - Diwali)
                else if (
                    (month === 11 && day === 25) || // Christmas
                    (month === 10 && day === 1) ||  // Diwali
                    (month === 9 && day === 31)     // Diwali
                ) {
                    record.status = 'Holiday';
                    record.remarks = month === 11 ? 'Christmas' : 'Diwali';
                }
                // Random absences (5% chance)
                else if (Math.random() < 0.05) {
                    record.status = 'Absent';
                }
                // Random leaves (8% chance)
                else if (Math.random() < 0.08) {
                    record.status = 'Leave';
                    const leaveTypes = ['Sick Leave', 'Casual Leave', 'Personal Leave'];
                    record.remarks = leaveTypes[Math.floor(Math.random() * leaveTypes.length)];
                }
                // Random half-days (3% chance)
                else if (Math.random() < 0.03) {
                    record.status = 'Half-Day';
                    const checkInTime = randomTime(10, 30); // Late check-in
                    const checkOutTime = randomTime(14, 30); // Early check-out

                    record.checkIn = {
                        time: new Date(`${dateStr}T${checkInTime}:00.000Z`),
                        source: 'Biometric Device - Main Gate'
                    };
                    record.checkOut = {
                        time: new Date(`${dateStr}T${checkOutTime}:00.000Z`),
                        source: 'Biometric Device - Main Gate'
                    };
                    record.workHours = parseFloat(calculateWorkHours(checkInTime, checkOutTime));
                }
                // Regular present days
                else {
                    // Check-in: 9:00-10:00 AM
                    const checkInHour = 9 + (Math.random() < 0.7 ? 0 : 1); // 70% on time, 30% late
                    const checkInTime = randomTime(checkInHour, 45);

                    // Check-out: 6:00-7:30 PM
                    const checkOutHour = 18 + (Math.random() > 0.5 ? 0 : 1);
                    const checkOutTime = randomTime(checkOutHour, 45);

                    record.checkIn = {
                        time: new Date(`${dateStr}T${checkInTime}:00.000Z`),
                        source: 'Biometric Device - Main Gate'
                    };
                    record.checkOut = {
                        time: new Date(`${dateStr}T${checkOutTime}:00.000Z`),
                        source: 'Biometric Device - Main Gate'
                    };
                    record.workHours = parseFloat(calculateWorkHours(checkInTime, checkOutTime));

                    // Mark as late if check-in after 9:15
                    if (checkInHour >= 10 || (checkInHour === 9 && parseInt(checkInTime.split(':')[1]) > 15)) {
                        record.isLate = true;
                    }
                }

                attendanceRecords.push(record);
            }
        }

        // Insert all records
        await Attendance.insertMany(attendanceRecords);

        console.log(`✅ Successfully seeded ${attendanceRecords.length} attendance records for Tommy Vercetti`);

        // Show summary
        const summary = attendanceRecords.reduce((acc, record) => {
            acc[record.status] = (acc[record.status] || 0) + 1;
            return acc;
        }, {});

        console.log('\nAttendance Summary:');
        console.log('==================');
        Object.entries(summary).forEach(([status, count]) => {
            console.log(`${status}: ${count}`);
        });

        const lateCount = attendanceRecords.filter(r => r.isLate).length;
        console.log(`Late Days: ${lateCount}`);

        await mongoose.disconnect();
        console.log('\n✅ Database disconnected');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding attendance:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
};

seedAttendance();
