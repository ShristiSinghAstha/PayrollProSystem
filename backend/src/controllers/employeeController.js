import Employee from '../models/Employee.js';
import Payroll from '../models/Payroll.js';
import Notification from '../models/Notification.js';
import { asyncHandler, AppError } from '../middlewares/errorHandler.js';
import {
    logEmployeeCreation,
    logEmployeeUpdate,
    logEmployeeDelete
} from '../utils/auditLogger.js';
import { sendWelcomeEmail } from '../utils/emailService.js';

const getAuditMetadata = (req) => ({
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    requestMethod: req.method,
    requestUrl: req.originalUrl
});

const getPerformedBy = (req) => ({
    userId: req.user._id,
    userName: `${req.user.personalInfo.firstName} ${req.user.personalInfo.lastName}`,
    userRole: req.user.role
});

export const createEmployee = asyncHandler(async (req, res) => {
    const { personalInfo, employment, bankDetails, salaryStructure, password } = req.body;

    const existingEmployee = await Employee.findOne({
        'personalInfo.email': personalInfo.email
    });

    if (existingEmployee) {
        throw new AppError('Employee with this email already exists', 409);
    }

    const tempPassword = password || 'temp123';

    const employee = await Employee.create({
        personalInfo,
        employment,
        bankDetails,
        salaryStructure,
        password: tempPassword
    });

    await logEmployeeCreation(
        employee,
        getPerformedBy(req),
        getAuditMetadata(req)
    );

    res.status(201).json({
        success: true,
        message: 'Employee created successfully',
        data: employee.getPublicProfile()
    });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(
        personalInfo.email,
        `${personalInfo.firstName} ${personalInfo.lastName}`,
        tempPassword,
        process.env.PORTAL_URL
    ).then((result) => {
        if (!result.success) {
            console.warn(`⚠️ Welcome email failed for ${personalInfo.email}:`, result.error);
        }
    }).catch(console.error);
});

export const getAllEmployees = asyncHandler(async (req, res) => {
    const { department, status, search, page = 1, limit = 10 } = req.query;

    const query = {};

    if (department) query['employment.department'] = department;
    if (status) query['employment.status'] = status;

    if (search) {
        query.$or = [
            { 'personalInfo.firstName': { $regex: search, $options: 'i' } },
            { 'personalInfo.lastName': { $regex: search, $options: 'i' } },
            { 'personalInfo.email': { $regex: search, $options: 'i' } },
            { employeeId: { $regex: search, $options: 'i' } }
        ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const employees = await Employee.find(query)
        .select('-__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Employee.countDocuments(query);

    const employeesData = employees.map(emp => emp.getPublicProfile());

    res.status(200).json({
        success: true,
        data: employeesData,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit))
        }
    });
});

export const getEmployeeById = asyncHandler(async (req, res) => {
    const employee = await Employee.findById(req.params.id).select('-__v');

    if (!employee) {
        throw new AppError('Employee not found', 404);
    }

    res.status(200).json({
        success: true,
        data: employee.getPublicProfile()
    });
});

export const updateEmployee = asyncHandler(async (req, res) => {
    const oldEmployee = await Employee.findById(req.params.id);

    if (!oldEmployee) {
        throw new AppError('Employee not found', 404);
    }

    if (req.body.personalInfo?.email &&
        req.body.personalInfo.email !== oldEmployee.personalInfo.email) {
        const emailExists = await Employee.findOne({
            'personalInfo.email': req.body.personalInfo.email
        });

        if (emailExists) {
            throw new AppError('Email already in use by another employee', 409);
        }
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
    ).select('-__v');

    await logEmployeeUpdate(
        oldEmployee,
        updatedEmployee,
        getPerformedBy(req),
        getAuditMetadata(req)
    );

    res.status(200).json({
        success: true,
        message: 'Employee updated successfully',
        data: updatedEmployee.getPublicProfile()
    });
});

export const deactivateEmployee = asyncHandler(async (req, res) => {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
        throw new AppError('Employee not found', 404);
    }

    if (employee.employment.status === 'Inactive') {
        throw new AppError('Employee is already inactive', 400);
    }

    employee.employment.status = 'Inactive';
    await employee.save();

    await logEmployeeDelete(
        employee,
        getPerformedBy(req),
        getAuditMetadata(req)
    );

    res.status(200).json({
        success: true,
        message: 'Employee deactivated successfully',
        data: {
            employeeId: employee.employeeId,
            status: employee.employment.status
        }
    });
});

export const getEmployeeStats = asyncHandler(async (req, res) => {
    const stats = await Employee.aggregate([
        {
            $group: {
                _id: '$employment.status',
                count: { $sum: 1 }
            }
        }
    ]);

    const departmentStats = await Employee.aggregate([
        { $match: { 'employment.status': 'Active' } },
        {
            $group: {
                _id: '$employment.department',
                count: { $sum: 1 }
            }
        }
    ]);

    const total = await Employee.countDocuments();
    const active = await Employee.countDocuments({ 'employment.status': 'Active' });

    res.status(200).json({
        success: true,
        data: {
            total,
            active,
            byStatus: stats,
            byDepartment: departmentStats
        }
    });
});

//Dashboard - Module 5 - Status
export const getEmployeeDashboard = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;
    const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
    const currentYear = new Date().getFullYear();

    const currentPayroll = await Payroll.findOne({
        employeeId,
        month: currentMonth
    }).select('month status netSalary paidAt payslipGenerated payslipUrl');

    const recentPayslips = await Payroll.find({
        employeeId,
        status: 'Paid',
        payslipGenerated: true
    })
        .select('month netSalary paidAt payslipUrl')
        .sort({ year: -1, month: -1 })
        .limit(3);

    const unreadCount = await Notification.countDocuments({
        employeeId,
        read: false
    });

    // Import Leave model and get leave balance
    const Leave = (await import('../models/Leave.js')).default;
    const leaveBalance = await Leave.getLeaveBalance(employeeId);

    // Get Year-to-Date earnings
    const ytdEarnings = await Payroll.aggregate([
        {
            $match: {
                employeeId,
                year: currentYear,
                status: 'Paid'
            }
        },
        {
            $group: {
                _id: null,
                totalGross: { $sum: '$earnings.gross' },
                totalDeductions: { $sum: '$deductions.total' },
                totalNet: { $sum: '$netSalary' },
                count: { $sum: 1 }
            }
        }
    ]);

    // Get upcoming approved leaves
    const upcomingLeaves = await Leave.find({
        employeeId,
        status: 'Approved',
        startDate: { $gte: new Date() }
    })
        .select('leaveType startDate endDate totalDays reason')
        .sort({ startDate: 1 })
        .limit(5);

    // Get recent notifications (last 5)
    const recentNotifications = await Notification.find({
        employeeId
    })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('message type createdAt read');

    res.status(200).json({
        success: true,
        data: {
            currentPayroll,
            recentPayslips,
            unreadNotifications: unreadCount,
            leaveBalance,
            ytdEarnings: ytdEarnings[0] || { totalGross: 0, totalDeductions: 0, totalNet: 0, count: 0 },
            upcomingLeaves,
            recentNotifications
        }
    });
});

// Get employee growth over time (Admin)
export const getEmployeeGrowth = asyncHandler(async (req, res) => {
    const { months = 12 } = req.query;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    const growth = await Employee.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { '_id.year': 1, '_id.month': 1 }
        }
    ]);

    // Format for chart display
    const formattedGrowth = growth.map(item => ({
        month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
        count: item.count
    }));

    res.status(200).json({
        success: true,
        data: formattedGrowth
    });
});