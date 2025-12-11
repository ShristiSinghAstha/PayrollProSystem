import Notification from '../models/Notification.js';
import { asyncHandler, AppError } from '../middlewares/errorHandler.js';

// Employee: Get all their notifications
export const getMyNotifications = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;
    const { limit = 20 } = req.query;

    const notifications = await Notification.find({ employeeId })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({ 
        employeeId, 
        read: false 
    });

    res.status(200).json({
        success: true,
        data: {
            notifications,
            unreadCount
        }
    });
});

// Employee: Mark notification as read
export const markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const employeeId = req.user._id;

    const notification = await Notification.findOne({
        _id: id,
        employeeId
    });

    if (!notification) {
        throw new AppError('Notification not found', 404);
    }

    notification.markAsRead();
    await notification.save();

    res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        data: notification
    });
});

// Employee: Mark all notifications as read
export const markAllAsRead = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;

    const result = await Notification.updateMany(
        { employeeId, read: false },
        { read: true, readAt: new Date() }
    );

    res.status(200).json({
        success: true,
        message: `${result.modifiedCount} notifications marked as read`
    });
});

// Employee: Get unread count
export const getUnreadCount = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;

    const count = await Notification.countDocuments({ 
        employeeId, 
        read: false 
    });

    res.status(200).json({
        success: true,
        data: { unreadCount: count }
    });
});