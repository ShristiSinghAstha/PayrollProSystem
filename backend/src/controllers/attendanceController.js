import Attendance from '../models/Attendance.js';
import Leave from '../models/Leave.js';
import { asyncHandler, AppError } from '../middlewares/errorHandler.js';

// Employee: Check-in
export const checkIn = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    const existingAttendance = await Attendance.findOne({
        employeeId,
        date: today
    });

    if (existingAttendance && existingAttendance.checkIn) {
        throw new AppError('Already checked in today', 400);
    }

    // Get IP and location from request
    const ip = req.ip || req.connection.remoteAddress;
    const location = req.body.location || 'Office';

    const attendance = existingAttendance || new Attendance({
        employeeId,
        date: today
    });

    attendance.checkIn = {
        time: new Date(),
        location,
        ip
    };
    attendance.status = 'Present';

    await attendance.save();

    res.status(200).json({
        success: true,
        message: 'Checked in successfully',
        data: attendance
    });
});

// Employee: Check-out
export const checkOut = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
        employeeId,
        date: today
    });

    if (!attendance || !attendance.checkIn) {
        throw new AppError('Please check in first', 400);
    }

    if (attendance.checkOut) {
        throw new AppError('Already checked out today', 400);
    }

    const ip = req.ip || req.connection.remoteAddress;
    const location = req.body.location || 'Office';

    attendance.checkOut = {
        time: new Date(),
        location,
        ip
    };

    await attendance.save();

    res.status(200).json({
        success: true,
        message: 'Checked out successfully',
        data: attendance
    });
});

// Employee: Get my attendance
export const getMyAttendance = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;
    const { month, year, page = 1, limit = 31 } = req.query;

    const query = { employeeId };

    if (month && year) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        query.date = { $gte: startDate, $lte: endDate };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const attendance = await Attendance.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Attendance.countDocuments(query);

    res.status(200).json({
        success: true,
        data: attendance,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit))
        }
    });
});

// Admin: Get all attendance
export const getAllAttendance = asyncHandler(async (req, res) => {
    const { department, status, startDate, endDate, employeeId, page = 1, limit = 50 } = req.query;

    const query = {};

    if (employeeId) query.employeeId = employeeId;
    if (status) query.status = status;

    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let attendanceQuery = Attendance.find(query)
        .populate('employeeId', 'personalInfo employment employeeId')
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    // Filter by department if specified
    if (department) {
        attendanceQuery = attendanceQuery.where('employeeId.employment.department').equals(department);
    }

    const attendance = await attendanceQuery;
    const total = await Attendance.countDocuments(query);

    res.status(200).json({
        success: true,
        data: attendance,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit))
        }
    });
});

// Admin: Get attendance by ID
export const getAttendanceById = asyncHandler(async (req, res) => {
    const attendance = await Attendance.findById(req.params.id)
        .populate('employeeId', 'personalInfo employment employeeId');

    if (!attendance) {
        throw new AppError('Attendance record not found', 404);
    }

    res.status(200).json({
        success: true,
        data: attendance
    });
});

// Admin: Get monthly report
export const getMonthlyReport = asyncHandler(async (req, res) => {
    const { employeeId, month, year } = req.query;

    if (!employeeId || !month || !year) {
        throw new AppError('Employee ID, month, and year are required', 400);
    }

    const report = await Attendance.getMonthlyReport(
        employeeId,
        parseInt(month),
        parseInt(year)
    );

    res.status(200).json({
        success: true,
        data: report
    });
});

// Admin: Update attendance
export const updateAttendance = asyncHandler(async (req, res) => {
    const { status, remarks, checkIn, checkOut } = req.body;

    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
        throw new AppError('Attendance record not found', 404);
    }

    // Update fields
    if (status) attendance.status = status;
    if (remarks) attendance.remarks = remarks;
    if (checkIn) attendance.checkIn = checkIn;
    if (checkOut) attendance.checkOut = checkOut;

    await attendance.save();

    res.status(200).json({
        success: true,
        message: 'Attendance updated successfully',
        data: attendance
    });
});

// Admin/Cron: Mark absent for employees who didn't check in
export const markAbsent = asyncHandler(async (req, res) => {
    const targetDate = req.body.date ? new Date(req.body.date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    // Get all active employees
    const Employee = (await import('../models/Employee.js')).default;
    const activeEmployees = await Employee.find({ 'employment.status': 'Active' }).select('_id');

    // Get employees who already have attendance for this date
    const existingAttendance = await Attendance.find({
        date: targetDate
    }).distinct('employeeId');

    // Get employees on approved leave for this date
    const employeesOnLeave = await Leave.find({
        startDate: { $lte: targetDate },
        endDate: { $gte: targetDate },
        status: 'Approved'
    }).distinct('employeeId');

    // Find employees without attendance and not on leave
    const employeesToMarkAbsent = activeEmployees.filter(emp =>
        !existingAttendance.some(id => id.equals(emp._id)) &&
        !employeesOnLeave.some(id => id.equals(emp._id))
    );

    // Create absent records
    const absentRecords = await Attendance.insertMany(
        employeesToMarkAbsent.map(emp => ({
            employeeId: emp._id,
            date: targetDate,
            status: 'Absent',
            remarks: 'Auto-marked absent'
        }))
    );

    res.status(200).json({
        success: true,
        message: `Marked ${absentRecords.length} employees as absent`,
        data: {
            date: targetDate,
            count: absentRecords.length
        }
    });
});

// Get attendance stats
export const getAttendanceStats = asyncHandler(async (req, res) => {
    const { startDate, endDate, employeeId } = req.query;

    if (!startDate || !endDate) {
        throw new AppError('Start date and end date are required', 400);
    }

    const matchStage = {
        date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    };

    if (employeeId) {
        matchStage.employeeId = employeeId;
    }

    const stats = await Attendance.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalWorkHours: { $sum: '$workHours' }
            }
        }
    ]);

    const lateCount = await Attendance.countDocuments({
        ...matchStage,
        isLate: true
    });

    res.status(200).json({
        success: true,
        data: {
            byStatus: stats,
            totalLate: lateCount
        }
    });
});
