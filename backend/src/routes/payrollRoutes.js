import express from 'express';
import {
    processMonthlyPayroll,
    getPayrollRecords,
    getPayrollById,
    getPayrollByMonth,
    addAdjustment,
    approvePayroll,
    markAsPaid,
    approveAllForMonth,
    getPayrollStats,
    bulkPayAndGeneratePayslips,
    getMonthlyPayrollSummary
} from '../controllers/payrollController.js';
import { payrollValidation } from '../middlewares/validator.js';
import { protect, restrictTo } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);
router.use(restrictTo('admin'));

router.get('/stats', getPayrollStats);
router.post('/process', payrollValidation.process, processMonthlyPayroll);
router.post('/bulk-approve/:month', approveAllForMonth);

router.get('/summary', getMonthlyPayrollSummary);
router.get('/', getPayrollRecords);
router.get('/month/:month', getPayrollByMonth);
router.get('/:id', payrollValidation.getById, getPayrollById);

router.put('/:id/adjustment', payrollValidation.adjustment, addAdjustment);
router.put('/:id/approve', payrollValidation.getById, approvePayroll);
router.put('/:id/pay', payrollValidation.getById, markAsPaid);
router.post('/bulk-pay/:month', bulkPayAndGeneratePayslips);

export default router;