import express from 'express';
import {
    submitDeclaration,
    getMyDeclarations,
    updateDeclaration,
    getTaxEstimate,
    getAllDeclarations,
    verifyDeclaration,
    getDeclarationStats
} from '../controllers/taxController.js';
import { protect, restrictTo } from '../middlewares/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Employee routes
router.post('/declarations', submitDeclaration);
router.get('/declarations/my', getMyDeclarations);
router.put('/declarations/:id', updateDeclaration);
router.post('/calculate-estimate', getTaxEstimate);

// Admin routes
router.use(restrictTo('admin'));

router.get('/declarations', getAllDeclarations);
router.put('/declarations/:id/verify', verifyDeclaration);
router.get('/stats', getDeclarationStats);

export default router;
