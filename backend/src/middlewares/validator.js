import { body, param, query, validationResult } from 'express-validator';

const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Validation failed',
                details: errors.array().map(err => ({
                    field: err.path,
                    message: err.msg,
                    value: err.value
                }))
            }
        });
    }

    next();
};

export const employeeValidation = {
    create: [
        body('personalInfo.firstName')
            .trim()
            .notEmpty().withMessage('First name is required')
            .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),

        body('personalInfo.lastName')
            .trim()
            .notEmpty().withMessage('Last name is required')
            .isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),

        body('personalInfo.email')
            .trim()
            .notEmpty().withMessage('Email is required')
            .isEmail().withMessage('Invalid email format')
            .normalizeEmail(),

        body('personalInfo.phone')
            .trim()
            .notEmpty().withMessage('Phone number is required')
            .matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits'),

        body('personalInfo.dateOfBirth')
            .notEmpty().withMessage('Date of birth is required')
            .isISO8601().withMessage('Invalid date format')
            .custom((value) => {
                const age = Math.floor((new Date() - new Date(value)) / 31557600000);
                if (age < 18) throw new Error('Employee must be at least 18 years old');
                if (age > 65) throw new Error('Employee age cannot exceed 65 years');
                return true;
            }),

        body('employment.department')
            .notEmpty().withMessage('Department is required')
            .isIn(['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations'])
            .withMessage('Invalid department'),

        body('employment.designation')
            .trim()
            .notEmpty().withMessage('Designation is required')
            .isLength({ min: 2, max: 100 }).withMessage('Designation must be 2-100 characters'),

        body('employment.dateOfJoining')
            .notEmpty().withMessage('Date of joining is required')
            .isISO8601().withMessage('Invalid date format')
            .custom((value) => {
                if (new Date(value) > new Date()) {
                    throw new Error('Date of joining cannot be in the future');
                }
                return true;
            }),

        body('bankDetails.accountNumber')
            .trim()
            .notEmpty().withMessage('Account number is required')
            .isLength({ min: 9, max: 18 }).withMessage('Invalid account number'),

        body('bankDetails.accountHolderName')
            .trim()
            .notEmpty().withMessage('Account holder name is required'),

        body('bankDetails.ifscCode')
            .trim()
            .notEmpty().withMessage('IFSC code is required')
            .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/).withMessage('Invalid IFSC code format'),

        body('bankDetails.bankName')
            .trim()
            .notEmpty().withMessage('Bank name is required'),

        body('salaryStructure.basicSalary')
            .notEmpty().withMessage('Basic salary is required')
            .isFloat({ min: 0 }).withMessage('Basic salary must be a positive number'),

        body('salaryStructure.hra')
            .optional()
            .isFloat({ min: 0 }).withMessage('HRA must be a positive number'),

        body('salaryStructure.da')
            .optional()
            .isFloat({ min: 0 }).withMessage('DA must be a positive number'),

        body('salaryStructure.specialAllowance')
            .optional()
            .isFloat({ min: 0 }).withMessage('Special allowance must be a positive number'),

        validate
    ],

    update: [
        param('id')
            .isMongoId().withMessage('Invalid employee ID'),

        body('personalInfo.firstName')
            .optional()
            .trim()
            .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),

        body('personalInfo.email')
            .optional()
            .trim()
            .isEmail().withMessage('Invalid email format')
            .normalizeEmail(),

        body('salaryStructure.basicSalary')
            .optional()
            .isFloat({ min: 0 }).withMessage('Basic salary must be a positive number'),

        validate
    ],

    getById: [
        param('id')
            .isMongoId().withMessage('Invalid employee ID'),
        validate
    ]
};

export const payrollValidation = {
    process: [
        body('month')
            .notEmpty().withMessage('Month is required')
            .isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),

        body('year')
            .notEmpty().withMessage('Year is required')
            .isInt({ min: 2020, max: 2100 }).withMessage('Invalid year'),

        validate
    ],

    adjustment: [
        param('id')
            .isMongoId().withMessage('Invalid payroll ID'),

        body('type')
            .optional()
            .isIn(['Bonus', 'Penalty', 'Allowance', 'Deduction', 'Reimbursement', 'Recovery'])
            .withMessage('Invalid adjustment type'),

        body('amount')
            .notEmpty().withMessage('Amount is required')
            .isFloat({ min: 0.01 }).withMessage('Amount must be positive'),

        body('description')
            .notEmpty().withMessage('Description is required')
            .trim()
            .isLength({ min: 5, max: 200 }).withMessage('Description must be 5-200 characters'),

        validate
    ],

    getById: [
        param('id')
            .isMongoId().withMessage('Invalid payroll ID'),
        validate
    ],

    getByMonth: [
        query('month')
            .notEmpty().withMessage('Month is required')
            .matches(/^\d{4}-(0[1-9]|1[0-2])$/).withMessage('Month must be in YYYY-MM format'),

        query('year')
            .notEmpty().withMessage('Year is required')
            .isInt({ min: 2020, max: 2100 }).withMessage('Invalid year'),

        validate
    ]
};

export { validate };