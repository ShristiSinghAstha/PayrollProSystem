import Notification from '../models/Notification.js';
import { emitToUser, emitToAdmins } from '../config/socket.js';

// Create and emit notification to user
export const notifyUser = async (userId, notificationData) => {
    try {
        const notification = await Notification.create({
            userId,
            ...notificationData
        });

        // Emit via Socket.io
        emitToUser(userId, 'notification', notification);

        return notification;
    } catch (error) {
        console.error('Failed to create notification:', error);
        return null;
    }
};

// Notify all admins
export const notifyAdmins = async (notificationData) => {
    try {
        // Get all admin users
        const Employee = (await import('../models/Employee.js')).default;
        const admins = await Employee.find({ role: 'admin' }).select('_id');

        const notifications = await Promise.all(
            admins.map(admin =>
                Notification.create({
                    userId: admin._id,
                    ...notificationData
                })
            )
        );

        // Emit to admin room
        emitToAdmins('notification', notificationData);

        return notifications;
    } catch (error) {
        console.error('Failed to notify admins:', error);
        return [];
    }
};

// Notification templates
export const NOTIFICATION_TYPES = {
    PAYSLIP_GENERATED: {
        type: 'payslip',
        title: 'Payslip Generated',
        getMessage: (month) => `Your payslip for ${month} is ready to view`
    },
    LEAVE_APPROVED: {
        type: 'leave',
        title: 'Leave Approved',
        getMessage: (leaveType, days) => `Your ${leaveType} leave for ${days} days has been approved`
    },
    LEAVE_REJECTED: {
        type: 'leave',
        title: 'Leave Rejected',
        getMessage: (leaveType) => `Your ${leaveType} leave application has been rejected`
    },
    LEAVE_APPLIED: {
        type: 'leave',
        title: 'New Leave Application',
        getMessage: (employeeName, leaveType, days) =>
            `${employeeName} applied for ${days} days of ${leaveType} leave`
    },
    PAYROLL_PROCESSED: {
        type: 'payroll',
        title: 'Payroll Processed',
        getMessage: (month) => `Payroll for ${month} has been processed`
    },
    PAYROLL_APPROVED: {
        type: 'payroll',
        title: 'Payroll Approved',
        getMessage: (month) => `Your salary for ${month} has been approved`
    },
    WELCOME: {
        type: 'info',
        title: 'Welcome to PayrollPro',
        getMessage: (name) => `Welcome ${name}! Your account has been created successfully`
    }
};
