import express from 'express';
import {
    getMyPayslips,
    getPayslipById,
    downloadPayslip,
    resendPayslipEmail,
    getPayslipStatus
} from '../controllers/payslipController.js';
import { protect, restrictTo } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);

// Employee routes
router.get('/me', getMyPayslips);
router.get('/status/:month', restrictTo('admin'), getPayslipStatus);
router.get('/:id', getPayslipById);
router.get('/:id/download', downloadPayslip);

// Admin routes
router.post('/:id/resend', restrictTo('admin'), resendPayslipEmail);

export default router;