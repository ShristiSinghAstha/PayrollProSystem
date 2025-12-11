import Notification from '../models/Notification.js';

export const createPayslipNotification = async (employeeId, payslipUrl, month, netSalary) => {
  try {
    const notification = await Notification.create({
      employeeId,
      type: 'PAYSLIP_READY',
      title: `Payslip Ready for ${month}`,
      message: `Your salary of ₹${netSalary.toLocaleString('en-IN')} has been credited. Download your payslip now.`,
      link: payslipUrl
    });

    return notification;

  } catch (error) {
    console.error('Notification creation failed:', error.message);
    throw error;
  }
};

export const createPaymentNotification = async (employeeId, month, amount) => {
  try {
    const notification = await Notification.create({
      employeeId,
      type: 'PAYMENT_SUCCESS',
      title: 'Salary Credited',
      message: `Your salary of ₹${amount.toLocaleString('en-IN')} for ${month} has been successfully credited to your account.`,
      link: null
    });

    return notification;

  } catch (error) {
    console.error('Payment notification failed:', error.message);
    throw error;
  }
};

export const getEmployeeNotifications = async (employeeId, limit = 20) => {
  try {
    const notifications = await Notification.getEmployeeNotifications(employeeId, limit);
    const unreadCount = await Notification.getUnreadCount(employeeId);

    return {
      notifications,
      unreadCount
    };

  } catch (error) {
    console.error('Failed to fetch notifications:', error.message);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.markAsRead();
    await notification.save();

    return notification;

  } catch (error) {
    console.error('Failed to mark notification as read:', error.message);
    throw error;
  }
};

export const markAllAsRead = async (employeeId) => {
  try {
    const result = await Notification.updateMany(
      { employeeId, read: false },
      { read: true, readAt: new Date() }
    );

    return result;

  } catch (error) {
    console.error('Failed to mark all as read:', error.message);
    throw error;
  }
};