import express from 'express';
import {
    checkIn,
    checkOut,
    getMyAttendance,
    getAllAttendance,
    getAttendanceById,
    getMonthlyReport,
    updateAttendance,
    markAbsent,
    getAttendanceStats
} from '../controllers/attendanceController.js';
import { protect, restrictTo } from '../middlewares/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Employee routes
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/my', getMyAttendance);

// Admin-only routes
router.use(restrictTo('admin'));

router.get('/stats', getAttendanceStats);
router.get('/report', getMonthlyReport);
router.post('/mark-absent', markAbsent);
router.get('/', getAllAttendance);
router.get('/:id', getAttendanceById);
router.put('/:id', updateAttendance);

export default router;
