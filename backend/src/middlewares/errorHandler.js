
const sendErrorResponse = (res, statusCode, message, details = null) => {
    const response = {
        success: false,
        error: {
            message,
            statusCode
        }
    };

    if (details && process.env.NODE_ENV === 'development') {
        response.error.details = details;
    }

    res.status(statusCode).json(response);
};

/**
 * Main error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
    console.error('❌ Error occurred:', err);

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return sendErrorResponse(res, 400, 'Validation failed', errors);
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return sendErrorResponse(res, 409, `${field} already exists`);
    }

    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        return sendErrorResponse(res, 400, 'Invalid ID format');
    }

    // JWT errors (for future auth integration)
    if (err.name === 'JsonWebTokenError') {
        return sendErrorResponse(res, 401, 'Invalid token');
    }

    if (err.name === 'TokenExpiredError') {
        return sendErrorResponse(res, 401, 'Token expired');
    }

    // Custom application errors
    if (err.statusCode) {
        return sendErrorResponse(res, err.statusCode, err.message);
    }

    // Default server error
    sendErrorResponse(
        res,
        500,
        'Internal server error',
        process.env.NODE_ENV === 'development' ? err.message : null
    );
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req, res) => {
    sendErrorResponse(res, 404, `Route ${req.originalUrl} not found`);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Custom error class for application-specific errors
 */
export class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}