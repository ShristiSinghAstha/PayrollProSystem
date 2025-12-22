import Notification from '../models/Notification.js';

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
    const notification = await Notification.create({
      employeeId,
      type: 'PAYSLIP_READY',
      title: `Payslip Ready for ${month}`,
      message: `Your salary of ₹${netSalary.toLocaleString('en-IN')} has been credited. Download your payslip now.`,
      link: payslipUrl || null
    });

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
      type: 'PAYMENT_SUCCESS',
      title: 'Salary Credited',
      message: `Your salary of ₹${amount.toLocaleString('en-IN')} for ${month} has been successfully credited to your account.`,
      link: null
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