import Payroll from '../models/Payroll.js';
import Employee from '../models/Employee.js';
import { asyncHandler, AppError } from '../middlewares/errorHandler.js';
import { calculateSalary, calculateLOPFromAttendance } from '../utils/salaryCalculator.js';
import { logPayrollProcess, logPayrollApproval } from '../utils/auditLogger.js';
import { generatePayslipPDF, uploadPDFToCloudinary } from '../utils/pdfGenerator.js';
import { sendPayslipEmail } from '../utils/emailService.js';
import { createPayslipNotification } from '../utils/notificationService.js';


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
    let { month, year } = req.body;

    // Handle both formats: numeric month (12) OR "YYYY-MM" string
    if (typeof month === 'string' && month.includes('-')) {
        const [y, m] = month.split('-');
        year = parseInt(y, 10);
        month = parseInt(m, 10);
    } else {
        month = parseInt(month, 10);
        year = parseInt(year, 10);
    }

    const monthStr = `${year}-${String(month).padStart(2, '0')}`;

    // Fetch all active employees
    const activeEmployees = await Employee.find({ 'employment.status': 'Active' });

    if (activeEmployees.length === 0) {
        throw new AppError('No active employees found', 404);
    }

    // Check which employees already have payroll for this month
    const existingPayrolls = await Payroll.find({ month: monthStr }).distinct('employeeId');

    // Filter to only process employees who DON'T have payroll yet
    const employeesToProcess = activeEmployees.filter(emp =>
        !existingPayrolls.some(existingId => existingId.equals(emp._id))
    );

    if (employeesToProcess.length === 0) {
        throw new AppError(
            `Payroll for ${monthStr} has already been processed for all active employees`,
            409
        );
    }

    const payrollRecords = [];
    const errors = [];

    for (const employee of employeesToProcess) {
        try {
            // Calculate LOP days from attendance records
            let lopDays = 0;
            try {
                lopDays = await calculateLOPFromAttendance(employee._id, month, year);
            } catch (attendanceError) {
                console.warn(`Could not calculate LOP from attendance for employee ${employee.employeeId}, using 0:`, attendanceError.message);
                lopDays = 0;
            }

            // Calculate salary with LOP deduction
            const salaryBreakdown = calculateSalary(employee.salaryStructure, { lopDays });

            const payroll = await Payroll.create({
                employeeId: employee._id,
                month: monthStr,
                year: year,
                earnings: salaryBreakdown.earnings,
                deductions: salaryBreakdown.deductions,
                netSalary: salaryBreakdown.netSalary,
                status: 'Pending',
                processedAt: new Date(),
                adjustments: lopDays > 0 ? [{
                    type: 'LOP',
                    amount: salaryBreakdown.deductions.lop,
                    reason: `${lopDays} day(s) Loss of Pay (based on attendance)`,
                    appliedBy: 'SYSTEM'
                }] : []
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
            skippedExisting: existingPayrolls.length,
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

export const revokePayroll = asyncHandler(async (req, res) => {
    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
        throw new AppError('Payroll record not found', 404);
    }

    // Safety check: Can only revoke if Approved
    if (payroll.status !== 'Approved') {
        throw new AppError('Only approved payrolls can be revoked. Current status: ' + payroll.status, 400);
    }

    // Store the previous status for audit
    const previousStatus = payroll.status;

    // Revert to Pending
    payroll.status = 'Pending';
    payroll.approvedBy = undefined;
    payroll.approvedAt = undefined;
    await payroll.save();

    // Audit logging
    await logPayrollApproval(payroll, getPerformedBy(req), {
        ...getAuditMetadata(req),
        action: 'REVOKE',
        previousStatus,
        newStatus: 'Pending'
    });

    res.status(200).json({
        success: true,
        message: 'Payroll approval revoked successfully',
        data: payroll
    });
});

export const markAsPaid = asyncHandler(async (req, res) => {
    const payroll = await Payroll.findById(req.params.id)
        .populate('employeeId', 'employeeId personalInfo employment bankDetails');

    if (!payroll) {
        throw new AppError('Payroll record not found', 404);
    }

    if (payroll.status !== 'Approved') {
        throw new AppError('Payroll must be approved before payment', 400);
    }

    const originalStatus = payroll.status;

    try {
        // Step 1: Generate PDF
        const pdfBuffer = await generatePayslipPDF(payroll, payroll.employeeId);
        const filename = `${payroll.employeeId.employeeId}-${payroll.month}`;

        // Step 2: Upload to Cloudinary
        const payslipUrl = await uploadPDFToCloudinary(pdfBuffer, filename);

        // Step 3: Mark as paid
        const transactionId = `TXN-${Date.now()}-${payroll.employeeId.employeeId}`;
        payroll.markAsPaid(transactionId);
        payroll.payslipUrl = payslipUrl;
        payroll.payslipGenerated = true;
        payroll.payslipGeneratedAt = new Date();
        await payroll.save();

        // Step 4: Send email
        const emailResult = await sendPayslipEmail(
            payroll.employeeId.personalInfo.email,
            `${payroll.employeeId.personalInfo.firstName} ${payroll.employeeId.personalInfo.lastName}`,
            payslipUrl,
            payroll
        );

        if (emailResult.success) {
            payroll.notificationSent = true;
            payroll.notificationSentAt = new Date();
            await payroll.save();
        }

        // Step 4: Create notification (non-critical)
        try {
            await createPayslipNotification(
                payroll.employeeId._id,
                payslipUrl,
                payroll.month,
                payroll.netSalary
            );
        } catch (notifError) {
            console.error('Notification creation failed:', notifError.message);
        }

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
                payslipUrl,
                emailSent: emailResult.success,
                bankDetails: {
                    accountNumber: '****' + payroll.employeeId.bankDetails.accountNumber.slice(-4),
                    bankName: payroll.employeeId.bankDetails.bankName,
                    ifscCode: payroll.employeeId.bankDetails.ifscCode
                }
            }
        });

    } catch (error) {
        // Rollback: Restore original status
        payroll.status = originalStatus;
        payroll.payslipUrl = null;
        payroll.payslipGenerated = false;
        await payroll.save();

        throw new AppError(`Payment failed: ${error.message}`, 500);
    }
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

export const revokeAllForMonth = asyncHandler(async (req, res) => {
    const { month } = req.params;

    const result = await Payroll.updateMany(
        { month, status: 'Approved' },
        {
            $set: {
                status: 'Pending',
                approvedAt: null,
                approvedBy: null
            }
        }
    );

    if (result.modifiedCount === 0) {
        throw new AppError('No approved payroll records found for this month', 404);
    }

    // Audit logging for bulk revoke
    await logPayrollApproval(
        { month, _id: 'bulk-revoke' },
        getPerformedBy(req),
        {
            ...getAuditMetadata(req),
            action: 'BULK_REVOKE',
            count: result.modifiedCount
        }
    );

    res.status(200).json({
        success: true,
        message: `Revoked approval for ${result.modifiedCount} payroll records for ${month}`,
        data: {
            month,
            revoked: result.modifiedCount
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

    const current = month || (monthlyStats[0]?._id);
    const currentMonthStats = monthlyStats.find(m => m._id === current) || monthlyStats[0] || {};
    const statusMap = stats.reduce((acc, s) => {
        acc[s._id] = s.count;
        return acc;
    }, {});

    res.status(200).json({
        success: true,
        data: {
            byStatus: stats,
            byMonth: monthlyStats,
            currentMonth: current || null,
            currentMonthGross: currentMonthStats.totalGross || 0,
            currentMonthDeductions: currentMonthStats.totalDeductions || 0,
            currentMonthNet: currentMonthStats.totalNet || 0,
            pending: statusMap.Pending || 0,
            approved: statusMap.Approved || 0,
            paid: statusMap.Paid || 0,
            failed: statusMap.Failed || 0,
            employeesProcessed: currentMonthStats.totalEmployees || 0
        }
    });
});

export const bulkPayAndGeneratePayslips = asyncHandler(async (req, res) => {
    const { month } = req.params;

    const approvedPayrolls = await Payroll.find({
        month,
        status: 'Approved'
    }).populate('employeeId');

    if (approvedPayrolls.length === 0) {
        throw new AppError('No approved payrolls found for this month', 404);
    }

    const results = {
        totalProcessed: approvedPayrolls.length,
        successful: 0,
        failed: 0,
        details: []
    };

    for (const payroll of approvedPayrolls) {
        const employee = payroll.employeeId;
        const originalStatus = payroll.status; // Store original status

        try {
            // Step 1: Generate PDF FIRST (before marking as paid)
            const pdfBuffer = await generatePayslipPDF(payroll, employee);
            const filename = `${employee.employeeId}-${month}`;
            const payslipUrl = await uploadPDFToCloudinary(pdfBuffer, filename);

            // Step 2: Mark as paid ONLY after PDF is ready
            const transactionId = `TXN-${Date.now()}-${employee.employeeId}`;
            payroll.markAsPaid(transactionId);
            payroll.payslipUrl = payslipUrl;
            payroll.payslipGenerated = true;
            payroll.payslipGeneratedAt = new Date();
            await payroll.save();

            // Step 3: Send email (non-critical, can fail)
            const emailResult = await sendPayslipEmail(
                employee.personalInfo.email,
                `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
                payslipUrl,
                payroll
            );

            if (emailResult.success) {
                payroll.notificationSent = true;
                payroll.notificationSentAt = new Date();
                await payroll.save();
            }

            // Step 4: Create in-app notification (non-critical)
            try {
                await createPayslipNotification(
                    employee._id,
                    payslipUrl,
                    month,
                    payroll.netSalary
                );
            } catch (notifError) {
                console.error('Notification creation failed:', notifError.message);
                // Continue anyway, notification failure is not critical
            }

            await logPayrollApproval(payroll, getPerformedBy(req), getAuditMetadata(req));

            results.successful++;
            results.details.push({
                employeeId: employee.employeeId,
                name: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
                status: 'success',
                payslipUrl,
                emailSent: emailResult.success
            });

        } catch (error) {
            // Rollback: Restore original status if any step failed
            payroll.status = originalStatus;
            payroll.payslipUrl = null;
            payroll.payslipGenerated = false;
            await payroll.save();

            results.failed++;
            results.details.push({
                employeeId: employee.employeeId,
                name: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
                status: 'failed',
                error: error.message
            });
        }
    }

    res.status(200).json({
        success: true,
        message: `Bulk payment completed: ${results.successful} successful, ${results.failed} failed`,
        data: results
    });
});

export const getMonthlyPayrollSummary = asyncHandler(async (req, res) => {
    const summaries = await Payroll.aggregate([
        {
            $group: {
                _id: '$month',
                totalEmployees: { $sum: 1 },
                totalNet: { $sum: '$netSalary' },
                statusBreakdown: {
                    $push: '$status'
                },
                latestUpdate: { $max: '$updatedAt' }
            }
        },
        {
            $project: {
                month: '$_id',
                totalEmployees: 1,
                totalNet: 1,
                pending: {
                    $size: {
                        $filter: {
                            input: '$statusBreakdown',
                            cond: { $eq: ['$$this', 'Pending'] }
                        }
                    }
                },
                approved: {
                    $size: {
                        $filter: {
                            input: '$statusBreakdown',
                            cond: { $eq: ['$$this', 'Approved'] }
                        }
                    }
                },
                paid: {
                    $size: {
                        $filter: {
                            input: '$statusBreakdown',
                            cond: { $eq: ['$$this', 'Paid'] }
                        }
                    }
                },
                updatedAt: '$latestUpdate'
            }
        },
        { $sort: { month: -1 } }
    ]);

    res.status(200).json({
        success: true,
        data: summaries
    });
});

// Get average salary by department (Admin)
export const getSalaryByDepartment = asyncHandler(async (req, res) => {
    const { month, year = new Date().getFullYear() } = req.query;

    const matchStage = { status: 'Paid' };
    if (month) {
        const monthStr = `${year}-${String(month).padStart(2, '0')}`;
        matchStage.month = monthStr;
    }

    const stats = await Payroll.aggregate([
        { $match: matchStage },
        {
            $lookup: {
                from: 'employees',
                localField: 'employeeId',
                foreignField: '_id',
                as: 'employee'
            }
        },
        { $unwind: '$employee' },
        {
            $group: {
                _id: '$employee.employment.department',
                avgSalary: { $avg: '$netSalary' },
                totalEmployees: { $sum: 1 },
                totalPayout: { $sum: '$netSalary' },
                minSalary: { $min: '$netSalary' },
                maxSalary: { $max: '$netSalary' }
            }
        },
        { $sort: { avgSalary: -1 } }
    ]);

    res.status(200).json({
        success: true,
        data: stats
    });
});
