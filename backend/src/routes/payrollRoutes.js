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
    getPayrollStats
} from '../controllers/payrollController.js';
import { payrollValidation } from '../middlewares/validator.js';

const router = express.Router();

router.get('/stats', getPayrollStats);
router.post('/process', payrollValidation.process, processMonthlyPayroll);
router.post('/bulk-approve/:month', approveAllForMonth);

router.get('/', getPayrollRecords);
router.get('/month/:month', getPayrollByMonth);
router.get('/:id', payrollValidation.getById, getPayrollById);

router.put('/:id/adjustment', payrollValidation.adjustment, addAdjustment);
router.put('/:id/approve', payrollValidation.getById, approvePayroll);
router.put('/:id/pay', payrollValidation.getById, markAsPaid);

export default router;