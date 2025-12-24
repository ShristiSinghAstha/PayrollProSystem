import Notification from '../models/Notification.js';
import { emitToUser, emitToAdmins } from '../config/socket.js';
import Employee from '../models/Employee.js';

export const createPayslipNotification = async (employeeId, payslipUrl, month, netSalary) => {
  // Validation
  if (!employeeId) {
    console.error('Employee ID is required for notification');
    return { success: false, error: 'Employee ID is required' };
  }

  if (!month || netSalary === undefined) {
    console.error('Month and netSalary are required for notification');
    return { success: false, error: 'Invalid notification data' };
  }

  try {
    // Check if this employee is an admin-only user (no employee profile)
    // Admins shouldn't get salary notifications
    const employee = await Employee.findById(employeeId);
    if (!employee || employee.role === 'admin') {
      console.log(`⚠️  Skipping payslip notification for admin-only user ${employeeId}`);
      return { success: true, skipped: true, reason: 'Admin-only user' };
    }

    const notification = await Notification.create({
      employeeId,
      type: 'payslip',
      title: `Payslip Ready for ${month}`,
      message: `Your salary of ₹${netSalary.toLocaleString('en-IN')} has been credited. Download your payslip now.`,
      link: payslipUrl || null
    });

    // Emit real-time notification to the specific employee
    emitToUser(employeeId.toString(), 'notification:new', {
      _id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      createdAt: notification.createdAt,
      isRead: false
    });

    console.log(`✅ Real-time notification sent to employee ${employeeId}`);

    return { success: true, notification };

  } catch (error) {
    console.error('Notification creation failed:', error.message);
    return { success: false, error: error.message };
  }
};

export const createPaymentNotification = async (employeeId, month, amount) => {
  if (!employeeId || !month || amount === undefined) {
    console.error('Invalid payment notification data');
    return { success: false, error: 'Invalid data' };
  }

  try {
    const notification = await Notification.create({
      employeeId,
      type: 'payment',
      title: 'Salary Credited',
      message: `Your salary of ₹${amount.toLocaleString('en-IN')} for ${month} has been successfully credited to your account.`,
      link: null
    });

    // Emit real-time notification
    emitToUser(employeeId.toString(), 'notification:new', {
      _id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      createdAt: notification.createdAt,
      isRead: false
    });

    return { success: true, notification };

  } catch (error) {
    console.error('Payment notification failed:', error.message);
    return { success: false, error: error.message };
  }
};

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

// Admin Notification - New Leave Request
export const notifyAdminsNewLeave = (leaveData) => {
  const notification = {
    type: 'leave',
    title: '📋 New Leave Request',
    message: `${leaveData.employeeName} applied for ${leaveData.leaveType} (${leaveData.totalDays} days)`,
    data: leaveData
  };

  emitToAdmins('admin:notification', notification);
  console.log('✅ Admin notified of new leave request');
};

// Admin Notification - New Employee
export const notifyAdminsNewEmployee = (employeeData) => {
  const notification = {
    type: 'employee',
    title: '👤 New Employee Added',
    message: `${employeeData.name} (${employeeData.employeeId}) joined ${employeeData.department}`,
    data: employeeData
  };

  emitToAdmins('admin:notification', notification);
  console.log('✅ Admin notified of new employee');
};

// Admin Notification - Payroll Approved
export const notifyAdminsPayrollApproved = (approvalData) => {
  const notification = {
    type: 'payroll_approved',
    title: '✅ Payroll Approved',
    message: `${approvalData.approvedBy} approved payroll for ${approvalData.employeeName} (${approvalData.month})`,
    data: approvalData
  };

  emitToAdmins('admin:notification', notification);
  console.log('✅ Admin notified of payroll approval');
};

// Admin Notification - Payroll Paid
export const notifyAdminsPayrollPaid = (paymentData) => {
  const notification = {
    type: 'payroll_paid',
    title: '💰 Payment Processed',
    message: `${paymentData.employeeName} paid ₹${paymentData.amount.toLocaleString('en-IN')} for ${paymentData.month}`,
    data: paymentData
  };

  emitToAdmins('admin:notification', notification);
  console.log('✅ Admin notified of payment processing');
};

// Admin Notification - Leave Approved/Rejected
export const notifyAdminsLeaveDecision = (decisionData) => {
  const notification = {
    type: 'leave_decision',
    title: decisionData.status === 'Approved' ? '✅ Leave Approved' : '❌ Leave Rejected',
    message: `${decisionData.adminName} ${decisionData.status.toLowerCase()} ${decisionData.employeeName}'s ${decisionData.leaveType} request`,
    data: decisionData
  };

  emitToAdmins('admin:notification', notification);
  console.log(`✅ Admin notified of leave ${decisionData.status}`);
};

// Admin Notification - Bulk Payroll Completed
export const notifyAdminsBulkPayroll = (bulkData) => {
  const notification = {
    type: 'bulk_payroll',
    title: '💵 Bulk Payment Complete',
    message: `${bulkData.successful} employees paid for ${bulkData.month}. Total: ₹${bulkData.totalAmount.toLocaleString('en-IN')}`,
    data: bulkData
  };

  emitToAdmins('admin:notification', notification);
  console.log('✅ Admin notified of bulk payroll completion');
};