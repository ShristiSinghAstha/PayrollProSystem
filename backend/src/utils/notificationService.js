import Notification from '../models/Notification.js';
import { emitToUser, emitToAdmins } from '../config/socket.js';
import Employee from '../models/Employee.js';

// ============================================================================
// EMPLOYEE NOTIFICATIONS (Stored in DB + Real-time via Socket)
// ============================================================================

/**
 * Core function to create employee notification
 * @param {ObjectId} employeeId - Employee to notify
 * @param {String} type - Notification type
 * @param {String} title - Notification title
 * @param {String} message - Notification message
 * @param {String} link - Optional link
 */
const createNotification = async (employeeId, type, title, message, link = null) => {
  try {
    // Check if this is an admin user - skip DB notification
    const employee = await Employee.findById(employeeId);

    if (!employee) {
      console.warn(`⚠️ Employee ${employeeId} not found - cannot create notification`);
      return { success: false, error: 'Employee not found' };
    }

    if (employee.role === 'admin') {
      console.log(`⚠️ Skipping DB notification for admin user ${employeeId} (${employee.personalInfo.firstName})`);
      return { success: true, skipped: true, reason: 'Admin user - no DB notifications' };
    }

    const notification = await Notification.create({
      employeeId,
      type,
      title,
      message,
      link
    });

    // Emit real-time notification via Socket.io
    emitToUser(employeeId.toString(), 'notification:new', {
      _id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      createdAt: notification.createdAt,
      read: false
    });

    console.log(`✅ Notification sent to employee ${employeeId}`);
    return { success: true, notification };
  } catch (error) {
    console.error('Notification creation failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Payslip Ready Notification
export const createPayslipNotification = async (employeeId, payslipUrl, month, netSalary) => {
  if (!employeeId) {
    console.error('Employee ID is required for notification');
    return { success: false, error: 'Employee ID is required' };
  }

  if (!month || netSalary === undefined) {
    console.error('Month and netSalary are required for notification');
    return { success: false, error: 'Invalid notification data' };
  }

  // Admin check is handled in createNotification
  return await createNotification(
    employeeId,
    'PAYSLIP_READY',
    `Payslip Ready for ${month}`,
    `Your salary of ₹${netSalary.toLocaleString('en-IN')} has been credited. Download your payslip now.`,
    payslipUrl
  );
};

// Payment Success Notification
export const createPaymentNotification = async (employeeId, month, amount) => {
  if (!employeeId || !month || amount === undefined) {
    console.error('Invalid payment notification data');
    return { success: false, error: 'Invalid data' };
  }

  return await createNotification(
    employeeId,
    'PAYMENT_SUCCESS',
    'Salary Credited',
    `Your salary of ₹${amount.toLocaleString('en-IN')} for ${month} has been successfully credited to your account.`
  );
};

// Leave Approved Notification (NEW)
export const createLeaveApprovedNotification = async (employeeId, leaveData) => {
  if (!employeeId || !leaveData) {
    return { success: false, error: 'Invalid data' };
  }

  return await createNotification(
    employeeId,
    'LEAVE_APPROVED',
    '✅ Leave Approved',
    `Your ${leaveData.leaveType} leave from ${leaveData.startDate} to ${leaveData.endDate} (${leaveData.totalDays} days) has been approved.${leaveData.remarks ? ' Note: ' + leaveData.remarks : ''}`,
    '/employee/leaves'
  );
};

// Leave Rejected Notification (NEW)
export const createLeaveRejectedNotification = async (employeeId, leaveData) => {
  if (!employeeId || !leaveData) {
    return { success: false, error: 'Invalid data' };
  }

  return await createNotification(
    employeeId,
    'LEAVE_REJECTED',
    '❌ Leave Rejected',
    `Your ${leaveData.leaveType} leave request (${leaveData.totalDays} days) has been rejected. Reason: ${leaveData.rejectionReason}`,
    '/employee/leaves'
  );
};

// Welcome Notification
export const createWelcomeNotification = async (employeeId, employeeName) => {
  if (!employeeId) {
    return { success: false, error: 'Invalid data' };
  }

  return await createNotification(
    employeeId,
    'SYSTEM_ALERT',
    'Welcome to PayrollPro',
    `Welcome ${employeeName}! Your account has been created successfully. Please change your password on first login.`,
    '/employee/profile'
  );
};

// ============================================================================
// NOTIFICATION QUERIES
// ============================================================================

export const getEmployeeNotifications = async (employeeId, limit = 20) => {
  try {
    const notifications = await Notification.getEmployeeNotifications(employeeId, limit);
    const unreadCount = await Notification.getUnreadCount(employeeId);

    return {
      success: true,
      notifications,
      unreadCount
    };
  } catch (error) {
    console.error('Failed to fetch notifications:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return { success: false, error: 'Notification not found' };
    }

    notification.markAsRead();
    await notification.save();

    return { success: true, notification };
  } catch (error) {
    console.error('Failed to mark notification as read:', error.message);
    return { success: false, error: error.message };
  }
};

export const markAllAsRead = async (employeeId) => {
  try {
    const result = await Notification.updateMany(
      { employeeId, read: false },
      { read: true, readAt: new Date() }
    );

    return { success: true, modifiedCount: result.modifiedCount };
  } catch (error) {
    console.error('Failed to mark all as read:', error.message);
    return { success: false, error: error.message };
  }
};

// ============================================================================
// ADMIN TOAST NOTIFICATIONS (Socket only, no DB persistence)
// ============================================================================

/**
 * Generic admin toast notification
 * @param {String} type - Notification type
 * @param {String} title - Title
 * @param {String} message - Message
 * @param {Object} data - Additional data
 */
const notifyAdmins = (type, title, message, data = {}) => {
  const notification = {
    type,
    title,
    message,
    data,
    timestamp: new Date()
  };

  emitToAdmins('admin:toast', notification);
  console.log(`✅ Admin toast: ${message}`);
};

// Admin Notification - New Leave Request
export const notifyAdminsNewLeave = (leaveData) => {
  notifyAdmins(
    'leave',
    '📋 New Leave Request',
    `${leaveData.employeeName} applied for ${leaveData.leaveType} (${leaveData.totalDays} days)`,
    leaveData
  );
};

// Admin Notification - New Employee
export const notifyAdminsNewEmployee = (employeeData) => {
  notifyAdmins(
    'employee',
    '👤 New Employee Added',
    `${employeeData.name} (${employeeData.employeeId}) joined ${employeeData.department}`,
    employeeData
  );
};

// Admin Notification - Payroll Approved
export const notifyAdminsPayrollApproved = (approvalData) => {
  notifyAdmins(
    'payroll_approved',
    '✅ Payroll Approved',
    `${approvalData.approvedBy} approved payroll for ${approvalData.employeeName} (${approvalData.month})`,
    approvalData
  );
};

// Admin Notification - Payroll Paid
export const notifyAdminsPayrollPaid = (paymentData) => {
  notifyAdmins(
    'payroll_paid',
    '💰 Payment Processed',
    `${paymentData.employeeName} paid ₹${paymentData.amount.toLocaleString('en-IN')} for ${paymentData.month}`,
    paymentData
  );
};

// Admin Notification - Leave Approved/Rejected
export const notifyAdminsLeaveDecision = (decisionData) => {
  notifyAdmins(
    'leave_decision',
    decisionData.status === 'Approved' ? '✅ Leave Approved' : '❌ Leave Rejected',
    `${decisionData.adminName} ${decisionData.status.toLowerCase()} ${decisionData.employeeName}'s ${decisionData.leaveType} request`,
    decisionData
  );
};

// Admin Notification - Bulk Payroll Completed
export const notifyAdminsBulkPayroll = (bulkData) => {
  notifyAdmins(
    'bulk_payroll',
    '💵 Bulk Payment Complete',
    `${bulkData.successful} employees paid for ${bulkData.month}. Total: ₹${bulkData.totalAmount.toLocaleString('en-IN')}`,
    bulkData
  );
};
