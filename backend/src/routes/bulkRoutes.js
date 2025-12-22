import express from 'express';
import {
    bulkImportEmployees,
    exportEmployees,
    exportPayroll,
    downloadTemplate
} from '../controllers/bulkController.js';
import { protect, restrictTo } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';

const router = express.Router();

// All routes require admin authentication
router.use(protect);
router.use(restrictTo('admin'));

// Employee bulk operations
router.post('/employees/import', upload.single('file'), bulkImportEmployees);
router.get('/employees/export', exportEmployees);
router.get('/employees/template', downloadTemplate);

// Payroll export
router.get('/payroll/export', exportPayroll);

export default router;
