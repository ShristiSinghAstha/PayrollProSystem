import express from 'express';
import {
    createReview,
    getAllReviews,
    getReview,
    updateReview,
    completeReview,
    getMyReviews,
    submitSelfAssessment,
    acknowledgeReview,
    getPendingReviews,
    getReviewStats,
    applySalaryAdjustments
} from '../controllers/reviewController.js';
import { protect, restrictTo } from '../middlewares/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Employee routes
router.get('/my', getMyReviews);
router.post('/:id/self-assessment', submitSelfAssessment);
router.post('/:id/acknowledge', acknowledgeReview);

// Admin/Manager routes
router.use(restrictTo('admin'));

// Specific routes BEFORE parameterized routes
router.post('/', createReview);
router.get('/', getAllReviews);
router.get('/pending', getPendingReviews);
router.get('/stats', getReviewStats);
router.post('/apply-salary-adjustments', applySalaryAdjustments);

// Parameterized routes at the END
router.get('/:id', getReview);
router.put('/:id', updateReview);
router.post('/:id/complete', completeReview);

export default router;
