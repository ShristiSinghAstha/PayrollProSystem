import Payroll from '../models/Payroll.js';
import Employee from '../models/Employee.js';
import { asyncHandler, AppError } from '../middlewares/errorHandler.js';
import { calculateSalary } from '../utils/salaryCalculator.js';
import { logPayrollProcess, logPayrollApproval } from '../utils/auditLogger.js';

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

export const processMonthlyPayroll = asyncHandler(async (req, res) => {
    const { month, year } = req.body;

    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    const monthNum = parseInt(month);
    if (monthNum < 1 || monthNum > 12) {
        throw new AppError('Month must be between 1 and 12', 400);
    }

    const existingPayroll = await Payroll.findOne({ month: monthStr });
    if (existingPayroll) {
        throw new AppError(`Payroll for ${monthStr} has already been processed`, 409);
    }

    const activeEmployees = await Employee.find({ 'employment.status': 'Active' });

    if (activeEmployees.length === 0) {
        throw new AppError('No active employees found', 404);
    }

    const payrollRecords = [];
    const errors = [];

    for (const employee of activeEmployees) {
        try {
            const salaryBreakdown = calculateSalary(employee.salaryStructure);

            const payroll = await Payroll.create({
                employeeId: employee._id,
                month: monthStr,
                year: parseInt(year),
                earnings: salaryBreakdown.earnings,
                deductions: salaryBreakdown.deductions,
                netSalary: salaryBreakdown.netSalary,
                status: 'Pending',
                processedAt: new Date()
            });

            await logPayrollProcess(payroll._id, getPerformedBy(req), getAuditMetadata(req));

            payrollRecords.push(payroll);

        } catch (error) {
            errors.push({
                employeeId: employee.employeeId,
                name: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
                error: error.message
            });
        }
    }

    res.status(201).json({
        success: true,
        message: `Payroll processed for ${monthStr}`,
        data: {
            month: monthStr,
            totalProcessed: payrollRecords.length,
            totalErrors: errors.length,
            payrollRecords,
            errors: errors.length > 0 ? errors : undefined
        }
    });
});

export const getPayrollRecords = asyncHandler(async (req, res) => {
    const { month, year, status, page = 1, limit = 10 } = req.query;

    const query = {};

    if (month && year) {
        const monthStr = `${year}-${String(month).padStart(2, '0')}`;
        query.month = monthStr;
    }

    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const payrolls = await Payroll.find(query)
        .populate('employeeId', 'employeeId personalInfo.firstName personalInfo.lastName employment.department employment.designation')
        .select('-__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Payroll.countDocuments(query);

    res.status(200).json({
        success: true,
        data: payrolls,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit))
        }
    });
});

export const getPayrollById = asyncHandler(async (req, res) => {
    const payroll = await Payroll.findById(req.params.id)
        .populate('employeeId', 'employeeId personalInfo employment bankDetails')
        .select('-__v');

    if (!payroll) {
        throw new AppError('Payroll record not found', 404);
    }

    res.status(200).json({
        success: true,
        data: payroll
    });
});

export const getPayrollByMonth = asyncHandler(async (req, res) => {
    const { month } = req.params;

    const payrolls = await Payroll.find({ month })
        .populate('employeeId', 'employeeId personalInfo.firstName personalInfo.lastName employment.department employment.designation')
        .select('-__v')
        .sort({ 'employeeId.personalInfo.firstName': 1 });

    if (payrolls.length === 0) {
        throw new AppError(`No payroll records found for ${month}`, 404);
    }

    const summary = {
        totalEmployees: payrolls.length,
        totalGross: payrolls.reduce((sum, p) => sum + p.earnings.gross, 0),
        totalDeductions: payrolls.reduce((sum, p) => sum + p.deductions.total, 0),
        totalNet: payrolls.reduce((sum, p) => sum + p.netSalary, 0),
        statusBreakdown: {
            pending: payrolls.filter(p => p.status === 'Pending').length,
            approved: payrolls.filter(p => p.status === 'Approved').length,
            paid: payrolls.filter(p => p.status === 'Paid').length
        }
    };

    res.status(200).json({
        success: true,
        data: { month, summary, payrolls }
    });
});

export const addAdjustment = asyncHandler(async (req, res) => {
    const { type = 'Bonus', amount, description } = req.body;

    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
        throw new AppError('Payroll record not found', 404);
    }

    if (payroll.status === 'Paid') {
        throw new AppError('Cannot adjust payroll that has already been paid', 400);
    }

    if (!amount || !description) {
        throw new AppError('Amount and description are required', 400);
    }

    payroll.addAdjustment(type, parseFloat(amount), description, null);
    await payroll.save();

    res.status(200).json({
        success: true,
        message: 'Adjustment added successfully',
        data: payroll
    });
});

export const approvePayroll = asyncHandler(async (req, res) => {
    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
        throw new AppError('Payroll record not found', 404);
    }

    if (payroll.status !== 'Pending') {
        throw new AppError(`Cannot approve payroll with status: ${payroll.status}`, 400);
    }

    payroll.approve(null);
    await payroll.save();

    await logPayrollApproval(payroll, getPerformedBy(req), getAuditMetadata(req));

    res.status(200).json({
        success: true,
        message: 'Payroll approved successfully',
        data: payroll
    });
});

export const markAsPaid = asyncHandler(async (req, res) => {
    const payroll = await Payroll.findById(req.params.id)
        .populate('employeeId', 'employeeId personalInfo bankDetails');

    if (!payroll) {
        throw new AppError('Payroll record not found', 404);
    }

    if (payroll.status !== 'Approved') {
        throw new AppError('Payroll must be approved before payment', 400);
    }

    const transactionId = `TXN-${Date.now()}-${payroll.employeeId.employeeId}`;
    payroll.markAsPaid(transactionId);
    await payroll.save();

    res.status(200).json({
        success: true,
        message: 'Payment processed successfully',
        data: {
            payrollId: payroll._id,
            employeeId: payroll.employeeId.employeeId,
            employeeName: `${payroll.employeeId.personalInfo.firstName} ${payroll.employeeId.personalInfo.lastName}`,
            amount: payroll.netSalary,
            transactionId: payroll.transactionId,
            paidAt: payroll.paidAt,
            bankDetails: {
                accountNumber: '****' + payroll.employeeId.bankDetails.accountNumber.slice(-4),
                bankName: payroll.employeeId.bankDetails.bankName,
                ifscCode: payroll.employeeId.bankDetails.ifscCode
            }
        }
    });
});

export const approveAllForMonth = asyncHandler(async (req, res) => {
    const { month } = req.params;

    const result = await Payroll.updateMany(
        { month, status: 'Pending' },
        {
            $set: {
                status: 'Approved',
                approvedAt: new Date()
            }
        }
    );

    if (result.modifiedCount === 0) {
        throw new AppError('No pending payroll records found for this month', 404);
    }

    res.status(200).json({
        success: true,
        message: `Approved ${result.modifiedCount} payroll records for ${month}`,
        data: {
            month,
            approved: result.modifiedCount
        }
    });
});

export const getPayrollStats = asyncHandler(async (req, res) => {
    const { month } = req.query;

    const query = month ? { month } : {};

    const stats = await Payroll.aggregate([
        { $match: query },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$netSalary' }
            }
        }
    ]);

    const monthlyStats = await Payroll.aggregate([
        {
            $group: {
                _id: '$month',
                totalEmployees: { $sum: 1 },
                totalGross: { $sum: '$earnings.gross' },
                totalDeductions: { $sum: '$deductions.total' },
                totalNet: { $sum: '$netSalary' }
            }
        },
        { $sort: { _id: -1 } },
        { $limit: 6 }
    ]);

    res.status(200).json({
        success: true,
        data: {
            byStatus: stats,
            byMonth: monthlyStats
        }
    });
});