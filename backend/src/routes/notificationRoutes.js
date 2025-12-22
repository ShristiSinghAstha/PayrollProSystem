import express from 'express';
import {
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount
} from '../controllers/notificationController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);

router.get('/me', getMyNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);

export default router;