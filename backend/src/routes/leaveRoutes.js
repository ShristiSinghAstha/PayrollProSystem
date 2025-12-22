import express from 'express';
import {
    applyLeave,
    getAllLeaves,
    getMyLeaves,
    getLeaveBalance,
    approveLeave,
    rejectLeave,
    deleteLeave,
    getLeaveStats
} from '../controllers/leaveController.js';
import { protect, restrictTo } from '../middlewares/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Employee routes
router.post('/apply', applyLeave);
router.get('/my-leaves', getMyLeaves);
router.get('/my-balance', getLeaveBalance);
router.delete('/:id', deleteLeave);

// Admin routes
router.get('/', restrictTo('admin'), getAllLeaves);
router.get('/stats', restrictTo('admin'), getLeaveStats);
router.get('/balance/:employeeId', restrictTo('admin'), getLeaveBalance);
router.patch('/:id/approve', restrictTo('admin'), approveLeave);
router.patch('/:id/reject', restrictTo('admin'), rejectLeave);

export default router;
