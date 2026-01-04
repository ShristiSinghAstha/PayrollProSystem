import express from 'express';
import {
    createEmployee,
    getAllEmployees,
    getEmployeeById,
    updateEmployee,
    deactivateEmployee,
    getEmployeeStats,
    getEmployeeDashboard,
    getEmployeeGrowth
} from '../controllers/employeeController.js';
import { employeeValidation } from '../middlewares/validator.js';
import { protect, restrictTo } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);

// Employee self-dashboard (no admin restriction)
router.get('/dashboard', getEmployeeDashboard);

// Admin-only routes
router.use(restrictTo('admin'));

router.get('/stats', getEmployeeStats);
router.get('/growth', getEmployeeGrowth);
router.post('/', employeeValidation.create, createEmployee);
router.get('/', getAllEmployees);
router.get('/:id', employeeValidation.getById, getEmployeeById);
router.put('/:id', employeeValidation.update, updateEmployee);
router.delete('/:id', employeeValidation.getById, deactivateEmployee);

export default router;