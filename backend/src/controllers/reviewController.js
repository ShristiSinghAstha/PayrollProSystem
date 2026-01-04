import PerformanceReview from '../models/PerformanceReview.js';
import Employee from '../models/Employee.js';
import { asyncHandler, AppError } from '../middlewares/errorHandler.js';

// Create new performance review
export const createReview = asyncHandler(async (req, res) => {
    const { employeeId, reviewPeriod, ratings } = req.body;

    // Validation
    if (!employeeId) {
        throw new AppError('Employee ID is required', 400);
    }

    if (!reviewPeriod?.startDate || !reviewPeriod?.endDate) {
        throw new AppError('Review period start and end dates are required', 400);
    }

    // Validate dates
    const startDate = new Date(reviewPeriod.startDate);
    const endDate = new Date(reviewPeriod.endDate);

    if (endDate <= startDate) {
        throw new AppError('End date must be after start date', 400);
    }

    // Validate employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
        throw new AppError('Employee not found', 404);
    }

    // Validate rating scores if provided
    if (ratings) {
        const ratingKeys = ['technicalSkills', 'communication', 'teamwork', 'productivity', 'initiative'];
        for (const key of ratingKeys) {
            if (ratings[key]?.score) {
                const score = ratings[key].score;
                if (score < 1 || score > 5) {
                    throw new AppError(`${key} score must be between 1 and 5`, 400);
                }
            }
        }
    }

    const review = await PerformanceReview.create({
        ...req.body,
        reviewedBy: req.user._id
    });

    res.status(201).json({
        success: true,
        message: 'Performance review created successfully',
        data: review
    });
});

// Get all reviews (Admin)
export const getAllReviews = asyncHandler(async (req, res) => {
    const { status, reviewType, employeeId, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (reviewType) query.reviewType = reviewType;
    if (employeeId) query.employeeId = employeeId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await PerformanceReview.find(query)
        .populate('employeeId', 'personalInfo employment employeeId')
        .populate('reviewedBy', 'personalInfo.firstName personalInfo.lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await PerformanceReview.countDocuments(query);

    res.status(200).json({
        success: true,
        data: reviews,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit))
        }
    });
});

// Get single review
export const getReview = asyncHandler(async (req, res) => {
    const review = await PerformanceReview.findById(req.params.id)
        .populate('employeeId', 'personalInfo employment salaryStructure employeeId')
        .populate('reviewedBy', 'personalInfo.firstName personalInfo.lastName');

    if (!review) {
        throw new AppError('Review not found', 404);
    }

    res.status(200).json({
        success: true,
        data: review
    });
});

// Update review
export const updateReview = asyncHandler(async (req, res) => {
    let review = await PerformanceReview.findById(req.params.id);

    if (!review) {
        throw new AppError('Review not found', 404);
    }

    // Permission check: Only the reviewer who created it can update
    if (review.reviewedBy.toString() !== req.user._id.toString()) {
        throw new AppError('You are not authorized to update this review', 403);
    }

    // Only allow updates if not completed or acknowledged
    if (review.status === 'Acknowledged') {
        throw new AppError('Cannot update acknowledged review', 400);
    }

    review = await PerformanceReview.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        message: 'Review updated successfully',
        data: review
    });
});

// Complete review (Manager)
export const completeReview = asyncHandler(async (req, res) => {
    const review = await PerformanceReview.findById(req.params.id);

    if (!review) {
        throw new AppError('Review not found', 404);
    }

    review.complete(req.user._id);
    await review.save();

    res.status(200).json({
        success: true,
        message: 'Review completed successfully',
        data: review
    });
});

// Employee: Get my reviews
export const getMyReviews = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;

    const reviews = await PerformanceReview.getEmployeeReviews(employeeId);

    res.status(200).json({
        success: true,
        data: reviews
    });
});

// Employee: Submit self-assessment
export const submitSelfAssessment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const employeeId = req.user._id;

    const review = await PerformanceReview.findOne({ _id: id, employeeId });

    if (!review) {
        throw new AppError('Review not found', 404);
    }

    if (review.status !== 'Self-Assessment-Pending') {
        throw new AppError('Self-assessment not required for this review', 400);
    }

    review.selfAssessment = {
        ...req.body,
        submitted: true
    };
    review.status = 'Under-Review';
    await review.save();

    res.status(200).json({
        success: true,
        message: 'Self-assessment submitted successfully',
        data: review
    });
});

// Employee: Acknowledge review
export const acknowledgeReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const employeeId = req.user._id;

    const review = await PerformanceReview.findOne({ _id: id, employeeId });

    if (!review) {
        throw new AppError('Review not found', 404);
    }

    if (review.status !== 'Completed') {
        throw new AppError('Review must be completed before acknowledgement', 400);
    }

    review.acknowledge();
    await review.save();

    res.status(200).json({
        success: true,
        message: 'Review acknowledged successfully',
        data: review
    });
});

// Get pending reviews
export const getPendingReviews = asyncHandler(async (req, res) => {
    const reviews = await PerformanceReview.getPendingReviews();

    res.status(200).json({
        success: true,
        data: reviews
    });
});

// Get review statistics
export const getReviewStats = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const stats = await PerformanceReview.getReviewStats({ startDate, endDate });

    const totalReviews = await PerformanceReview.countDocuments();
    const completedReviews = await PerformanceReview.countDocuments({ status: 'Completed' });
    const pendingReviews = await PerformanceReview.countDocuments({
        status: { $in: ['Draft', 'Self-Assessment-Pending', 'Under-Review'] }
    });

    res.status(200).json({
        success: true,
        data: {
            total: totalReviews,
            completed: completedReviews,
            pending: pendingReviews,
            byStatus: stats
        }
    });
});

// Apply salary adjustments from reviews
export const applySalaryAdjustments = asyncHandler(async (req, res) => {
    const reviews = await PerformanceReview.getReviewsForSalaryAdjustment();

    const adjustments = [];
    const errors = [];

    for (const review of reviews) {
        try {
            const employee = await Employee.findById(review.employeeId);

            if (!employee) {
                errors.push({ reviewId: review._id, error: 'Employee not found' });
                continue;
            }

            const adjustment = review.salaryAdjustment;

            if (adjustment.type === 'Increment' && adjustment.percentage) {
                const currentBasic = employee.salaryStructure.basicSalary;
                const increment = (currentBasic * adjustment.percentage) / 100;
                employee.salaryStructure.basicSalary += increment;

                // Proportional increase in HRA and other allowances
                if (employee.salaryStructure.hra) {
                    employee.salaryStructure.hra += (employee.salaryStructure.hra * adjustment.percentage) / 100;
                }

                await employee.save();

                adjustments.push({
                    employeeId: employee._id,
                    employeeName: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
                    oldSalary: currentBasic,
                    newSalary: employee.salaryStructure.basicSalary,
                    increment: increment
                });
            }

            // Mark adjustment as applied
            review.salaryAdjustment.recommended = false;
            await review.save();

        } catch (error) {
            errors.push({ reviewId: review._id, error: error.message });
        }
    }

    res.status(200).json({
        success: true,
        message: `Salary adjustments applied for ${adjustments.length} employees`,
        data: {
            adjustments,
            errors
        }
    });
});

export default {
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
};
