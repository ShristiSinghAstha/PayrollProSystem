import jwt from 'jsonwebtoken';
import Employee from '../models/Employee.js';
import { AppError } from './errorHandler.js';

export const protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next(new AppError('Not authorized. Please login to access this route', 401));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await Employee.findById(decoded.id).select('-password');

        if (!user) {
            return next(new AppError('User no longer exists', 401));
        }

        if (user.employment.status !== 'Active') {
            return next(new AppError('Your account is inactive. Contact admin', 403));
        }

        req.user = user;
        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(new AppError('Invalid token. Please login again', 401));
        }
        if (error.name === 'TokenExpiredError') {
            return next(new AppError('Token expired. Please login again', 401));
        }
        return next(new AppError('Authentication failed', 401));
    }
};

export const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AppError('User not authenticated', 401));
        }

        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }

        next();
    };
};