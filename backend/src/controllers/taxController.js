import TaxDeclaration from '../models/TaxDeclaration.js';
import Employee from '../models/Employee.js';
import { asyncHandler, AppError } from '../middlewares/errorHandler.js';
import { calculateTDS, calculateTaxEstimate, validateDeclarations, applyDeductions } from '../utils/taxCalculator.js';

// Get current financial year (Apr-Mar)
const getCurrentFinancialYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // If month is Apr-Dec, FY is current year to next year
    // If month is Jan-Mar, FY is previous year to current year
    if (month >= 4) {
        return `${year}-${(year + 1) % 100}`;
    } else {
        return `${year - 1}-${year % 100}`;
    }
};

// Employee: Submit or update tax declaration
export const submitDeclaration = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;
    const { financialYear = getCurrentFinancialYear() } = req.body;

    // Find existing declaration or create new
    let declaration = await TaxDeclaration.findOne({ employeeId, financialYear });

    if (declaration && declaration.status !== 'Draft' && declaration.status !== 'Rejected') {
        throw new AppError('Cannot modify submitted or verified declaration', 400);
    }

    // Validate declarations
    const validation = validateDeclarations(req.body);
    if (!validation.isValid) {
        throw new AppError(validation.errors.join(', '), 400);
    }

    if (declaration) {
        // Update existing
        Object.assign(declaration, req.body);
        declaration.status = 'Submitted';
        declaration.submittedAt = new Date();
    } else {
        // Create new
        declaration = new TaxDeclaration({
            ...req.body,
            employeeId,
            financialYear,
            status: 'Submitted',
            submittedAt: new Date()
        });
    }

    await declaration.save();

    res.status(200).json({
        success: true,
        message: 'Tax declaration submitted successfully',
        data: declaration
    });
});

// Employee: Get my declarations
export const getMyDeclarations = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;
    const { financialYear } = req.query;

    const query = { employeeId };
    if (financialYear) query.financialYear = financialYear;

    const declarations = await TaxDeclaration.find(query)
        .populate('verifiedBy', 'personalInfo.firstName personalInfo.lastName')
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        data: declarations
    });
});

// Employee: Update draft declaration
export const updateDeclaration = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const employeeId = req.user._id;

    const declaration = await TaxDeclaration.findOne({ _id: id, employeeId });

    if (!declaration) {
        throw new AppError('Declaration not found', 404);
    }

    if (declaration.status !== 'Draft' && declaration.status !== 'Rejected') {
        throw new AppError('Can only update draft or rejected declarations', 400);
    }

    // Validate
    const validation = validateDeclarations(req.body);
    if (!validation.isValid) {
        throw new AppError(validation.errors.join(', '), 400);
    }

    Object.assign(declaration, req.body);
    await declaration.save();

    res.status(200).json({
        success: true,
        message: 'Declaration updated successfully',
        data: declaration
    });
});

// Employee: Calculate tax estimate
export const getTaxEstimate = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;

    // Get employee's current salary
    const employee = await Employee.findById(employeeId);
    if (!employee) {
        throw new AppError('Employee not found', 404);
    }

    const monthlySalary = employee.salaryStructure.basicSalary +
        (employee.salaryStructure.hra || 0) +
        (employee.salaryStructure.da || 0) +
        (employee.salaryStructure.specialAllowance || 0) +
        (employee.salaryStructure.otherAllowances || 0);

    // Get declarations from request body (for preview) or from DB
    let declarations = req.body;

    if (!declarations || Object.keys(declarations).length === 0) {
        const currentFY = getCurrentFinancialYear();
        const savedDeclaration = await TaxDeclaration.findOne({ employeeId, financialYear: currentFY });
        declarations = savedDeclaration || {};
    }

    // Add salary info for HRA calculation
    if (!declarations.hraDetails) {
        declarations.hraDetails = {};
    }
    declarations.hraDetails.basicSalary = employee.salaryStructure.basicSalary * 12;
    declarations.hraDetails.hraReceived = (employee.salaryStructure.hra || 0) * 12;

    const estimate = calculateTaxEstimate(monthlySalary, declarations);

    res.status(200).json({
        success: true,
        data: {
            ...estimate,
            monthlySalary,
            financialYear: getCurrentFinancialYear()
        }
    });
});

// Admin: Get all declarations
export const getAllDeclarations = asyncHandler(async (req, res) => {
    const { financialYear, status, department, page = 1, limit = 50 } = req.query;

    const query = {};
    if (financialYear) query.financialYear = financialYear;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let declarationsQuery = TaxDeclaration.find(query)
        .populate('employeeId', 'personalInfo employment employeeId')
        .populate('verifiedBy', 'personalInfo.firstName personalInfo.lastName')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const declarations = await declarationsQuery;
    const total = await TaxDeclaration.countDocuments(query);

    // Filter by department if specified
    let filteredDeclarations = declarations;
    if (department) {
        filteredDeclarations = declarations.filter(
            d => d.employeeId?.employment?.department === department
        );
    }

    res.status(200).json({
        success: true,
        data: filteredDeclarations,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit))
        }
    });
});

// Admin: Verify declaration
export const verifyDeclaration = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { approved, remarks } = req.body;
    const adminId = req.user._id;

    const declaration = await TaxDeclaration.findById(id);

    if (!declaration) {
        throw new AppError('Declaration not found', 404);
    }

    if (approved) {
        declaration.verify(adminId);
    } else {
        declaration.reject(adminId, remarks);
    }

    await declaration.save();

    res.status(200).json({
        success: true,
        message: approved ? 'Declaration verified successfully' : 'Declaration rejected',
        data: declaration
    });
});

// Admin: Get declaration stats
export const getDeclarationStats = asyncHandler(async (req, res) => {
    const { financialYear = getCurrentFinancialYear() } = req.query;

    const stats = await TaxDeclaration.aggregate([
        { $match: { financialYear } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalDeductions: { $sum: '$totalDeductions' }
            }
        }
    ]);

    const totalEmployees = await Employee.countDocuments({ 'employment.status': 'Active' });
    const declared = await TaxDeclaration.countDocuments({ financialYear });

    res.status(200).json({
        success: true,
        data: {
            financialYear,
            totalEmployees,
            declared,
            pending: totalEmployees - declared,
            byStatus: stats
        }
    });
});

// Admin: Generate Form 16
export const generateForm16 = asyncHandler(async (req, res) => {
    const { employeeId, financialYear } = req.params;

    const { generateForm16: generateForm16PDF } = await import('../utils/form16Generator.js');

    const form16Url = await generateForm16PDF(employeeId, financialYear);

    res.status(200).json({
        success: true,
        message: 'Form 16 generated successfully',
        data: {
            form16Url,
            financialYear
        }
    });
});

export default {
    submitDeclaration,
    getMyDeclarations,
    updateDeclaration,
    getTaxEstimate,
    getAllDeclarations,
    verifyDeclaration,
    getDeclarationStats,
    generateForm16
};
