import Payroll from '../models/Payroll.js';
import { asyncHandler, AppError } from '../middlewares/errorHandler.js';
import { sendPayslipEmail } from '../utils/emailService.js';

// Employee: Get all their payslips
export const getMyPayslips = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const payslips = await Payroll.find({
        employeeId,
        status: 'Paid',
        payslipGenerated: true
    })
        .select('month year earnings.gross deductions.total netSalary payslipUrl paidAt status')
        .sort({ year: -1, month: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Payroll.countDocuments({
        employeeId,
        status: 'Paid',
        payslipGenerated: true
    });

    res.status(200).json({
        success: true,
        data: payslips,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit))
        }
    });
});

// Employee: Get specific payslip details
export const getPayslipById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const employeeId = req.user._id;

    const payslip = await Payroll.findOne({
        _id: id,
        employeeId,
        status: 'Paid',
        payslipGenerated: true
    }).populate('employeeId', 'employeeId personalInfo employment');

    if (!payslip) {
        throw new AppError('Payslip not found', 404);
    }

    res.status(200).json({
        success: true,
        data: payslip
    });
});

// Employee: Download payslip (returns URL for redirect)
export const downloadPayslip = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const employeeId = req.user._id;

    const payslip = await Payroll.findOne({
        _id: id,
        employeeId,
        status: 'Paid',
        payslipGenerated: true
    });

    if (!payslip) {
        throw new AppError('Payslip not found', 404);
    }

    if (!payslip.payslipUrl) {
        throw new AppError('Payslip PDF not available', 404);
    }

    res.status(200).json({
        success: true,
        data: {
            payslipUrl: payslip.payslipUrl,
            month: payslip.month,
            message: 'Use this URL to download the payslip'
        }
    });
});

// Admin: Resend payslip email for specific employee
export const resendPayslipEmail = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const payroll = await Payroll.findById(id)
        .populate('employeeId', 'personalInfo');

    if (!payroll) {
        throw new AppError('Payroll record not found', 404);
    }

    if (payroll.status !== 'Paid' || !payroll.payslipGenerated) {
        throw new AppError('Payslip not yet generated for this employee', 400);
    }

    const employee = payroll.employeeId;

    const emailResult = await sendPayslipEmail(
        employee.personalInfo.email,
        `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
        payroll.payslipUrl,
        payroll
    );

    if (!emailResult.success) {
        throw new AppError(`Email sending failed: ${emailResult.error}`, 500);
    }

    payroll.notificationSent = true;
    payroll.notificationSentAt = new Date();
    await payroll.save();

    res.status(200).json({
        success: true,
        message: 'Payslip email resent successfully',
        data: {
            employeeEmail: employee.personalInfo.email,
            sentAt: new Date()
        }
    });
});

// Admin: Get payslip generation status for a month
export const getPayslipStatus = asyncHandler(async (req, res) => {
    const { month } = req.params;

    const payrolls = await Payroll.find({ month })
        .populate('employeeId', 'employeeId personalInfo.firstName personalInfo.lastName');

    if (payrolls.length === 0) {
        throw new AppError('No payroll records found for this month', 404);
    }

    const summary = {
        total: payrolls.length,
        payslipsGenerated: payrolls.filter(p => p.payslipGenerated).length,
        emailsSent: payrolls.filter(p => p.notificationSent).length,
        pending: payrolls.filter(p => !p.payslipGenerated).length,
        details: payrolls.map(p => ({
            employeeId: p.employeeId.employeeId,
            name: `${p.employeeId.personalInfo.firstName} ${p.employeeId.personalInfo.lastName}`,
            payslipGenerated: p.payslipGenerated,
            emailSent: p.notificationSent,
            payslipUrl: p.payslipUrl
        }))
    };

    res.status(200).json({
        success: true,
        data: summary
    });
});