import Leave from '../models/Leave.js';
import Employee from '../models/Employee.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

// Apply for leave (Employee)
export const applyLeave = asyncHandler(async (req, res) => {
    const { leaveType, startDate, endDate, reason } = req.body;
    const employeeId = req.user._id;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
        return res.status(400).json({
            success: false,
            message: 'End date must be after or equal to start date'
        });
    }

    // Calculate total days
    const diffTime = Math.abs(end - start);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Check leave balance (except for LOP)
    if (leaveType !== 'LOP') {
        const balance = await Leave.getLeaveBalance(employeeId);

        if (balance[leaveType] && balance[leaveType].remaining < totalDays) {
            return res.status(400).json({
                success: false,
                message: `Insufficient ${leaveType} leave balance. Available: ${balance[leaveType].remaining} days`
            });
        }
    }

    const leave = await Leave.create({
        employeeId,
        leaveType,
        startDate: start,
        endDate: end,
        totalDays,
        reason
    });

    await leave.populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId');

    await logAction({
        action: 'LEAVE_APPLIED',
        entityType: 'Leave',
        entityId: leave._id,
        userId: req.user._id,
        changes: { applied: leave },
        req
    });

    res.status(201).json({
        success: true,
        message: 'Leave application submitted successfully',
        data: leave
    });
});

// Get all leaves (Admin - with filters)
export const getAllLeaves = asyncHandler(async (req, res) => {
    const { status, leaveType, employeeId, startDate, endDate, page = 1, limit = 50 } = req.query;

    const query = {};

    if (status) query.status = status;
    if (leaveType) query.leaveType = leaveType;
    if (employeeId) query.employeeId = employeeId;

    if (startDate || endDate) {
        query.$or = [];
        if (startDate) {
            query.$or.push({ startDate: { $gte: new Date(startDate) } });
        }
        if (endDate) {
            query.$or.push({ endDate: { $lte: new Date(endDate) } });
        }
    }

    const skip = (page - 1) * limit;

    const [leaves, total] = await Promise.all([
        Leave.find(query)
            .populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId employment.department employment.designation')
            .populate('approvedBy', 'personalInfo.firstName personalInfo.lastName')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip),
        Leave.countDocuments(query)
    ]);

    res.json({
        success: true,
        data: leaves,
        pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        }
    });
});

// Get employee's own leaves
export const getMyLeaves = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;
    const { year = new Date().getFullYear() } = req.query;

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    const leaves = await Leave.find({
        employeeId,
        startDate: { $gte: startOfYear, $lte: endOfYear }
    })
        .populate('approvedBy', 'personalInfo.firstName personalInfo.lastName')
        .sort({ createdAt: -1 });

    const balance = await Leave.getLeaveBalance(employeeId, year);

    res.json({
        success: true,
        data: {
            leaves,
            balance
        }
    });
});

// Get leave balance
export const getLeaveBalance = asyncHandler(async (req, res) => {
    const employeeId = req.user.role === 'admin' ? req.params.employeeId : req.user._id;
    const { year = new Date().getFullYear() } = req.query;

    const balance = await Leave.getLeaveBalance(employeeId, year);

    res.json({
        success: true,
        data: balance
    });
});

// Approve leave (Admin)
export const approveLeave = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { remarks } = req.body;

    const leave = await Leave.findById(id).populate('employeeId', 'personalInfo.firstName personalInfo.lastName personalInfo.email');

    if (!leave) {
        return res.status(404).json({
            success: false,
            message: 'Leave application not found'
        });
    }

    leave.approve(req.user._id, remarks);
    await leave.save();

    await logAction({
        action: 'LEAVE_APPROVED',
        entityType: 'Leave',
        entityId: leave._id,
        userId: req.user._id,
        changes: { status: 'Approved', remarks },
        req
    });

    // TODO: Send notification/email to employee

    res.json({
        success: true,
        message: 'Leave approved successfully',
        data: leave
    });
});

// Reject leave (Admin)
export const rejectLeave = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
        return res.status(400).json({
            success: false,
            message: 'Rejection reason is required'
        });
    }

    const leave = await Leave.findById(id).populate('employeeId', 'personalInfo.firstName personalInfo.lastName personalInfo.email');

    if (!leave) {
        return res.status(404).json({
            success: false,
            message: 'Leave application not found'
        });
    }

    leave.reject(req.user._id, reason);
    await leave.save();

    await logAction({
        action: 'LEAVE_REJECTED',
        entityType: 'Leave',
        entityId: leave._id,
        userId: req.user._id,
        changes: { status: 'Rejected', reason },
        req
    });

    // TODO: Send notification/email to employee

    res.json({
        success: true,
        message: 'Leave rejected successfully',
        data: leave
    });
});

// Delete leave (Employee - only if pending)
export const deleteLeave = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const employeeId = req.user._id;

    const leave = await Leave.findOne({ _id: id, employeeId });

    if (!leave) {
        return res.status(404).json({
            success: false,
            message: 'Leave application not found'
        });
    }

    if (leave.status !== 'Pending') {
        return res.status(400).json({
            success: false,
            message: 'Only pending leaves can be deleted'
        });
    }

    await leave.deleteOne();

    await logAction({
        action: 'LEAVE_DELETED',
        entityType: 'Leave',
        entityId: leave._id,
        userId: req.user._id,
        changes: { deleted: leave },
        req
    });

    res.json({
        success: true,
        message: 'Leave application deleted successfully'
    });
});

// Get leave statistics (Admin)
export const getLeaveStats = asyncHandler(async (req, res) => {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    const stats = await Leave.aggregate([
        {
            $match: {
                startDate: { $gte: startOfYear, $lte: endOfYear }
            }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalDays: { $sum: '$totalDays' }
            }
        }
    ]);

    const byType = await Leave.aggregate([
        {
            $match: {
                startDate: { $gte: startOfYear, $lte: endOfYear },
                status: 'Approved'
            }
        },
        {
            $group: {
                _id: '$leaveType',
                count: { $sum: 1 },
                totalDays: { $sum: '$totalDays' }
            }
        }
    ]);

    const result = {
        byStatus: stats.reduce((acc, item) => {
            acc[item._id.toLowerCase()] = {
                count: item.count,
                totalDays: item.totalDays
            };
            return acc;
        }, {}),
        byType: byType.reduce((acc, item) => {
            acc[item._id] = {
                count: item.count,
                totalDays: item.totalDays
            };
            return acc;
        }, {})
    };

    res.json({
        success: true,
        data: result
    });
});
