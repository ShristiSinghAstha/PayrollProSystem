/**
 * Tax Calculator - Indian Income Tax (FY 2024-25 New Regime)
 * Handles TDS calculation, deductions, and tax estimation
 */

const roundToTwo = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

// FY 2024-25 Tax Slabs (New Regime - Default)
const TAX_SLABS = [
    { min: 0, max: 300000, rate: 0 },
    { min: 300001, max: 700000, rate: 5 },
    { min: 700001, max: 1000000, rate: 10 },
    { min: 1000001, max: 1200000, rate: 15 },
    { min: 1200001, max: 1500000, rate: 20 },
    { min: 1500001, max: Infinity, rate: 30 }
];

const STANDARD_DEDUCTION = 50000; // Automatic
const HEALTH_EDUCATION_CESS = 0.04; // 4% on tax

/**
 * Calculate tax based on income using tax slabs
 * @param {number} taxableIncome - Income after deductions
 * @returns {number} Tax amount
 */
const calculateTaxFromSlabs = (taxableIncome) => {
    let tax = 0;

    for (const slab of TAX_SLABS) {
        if (taxableIncome > slab.min) {
            const taxableInSlab = Math.min(taxableIncome, slab.max) - slab.min;
            tax += (taxableInSlab * slab.rate) / 100;
        }

        if (taxableIncome <= slab.max) break;
    }

    return roundToTwo(tax);
};

/**
 * Calculate HRA (House Rent Allowance) exemption
 * @param {number} basicSalary - Annual basic salary
 * @param {number} hraReceived - Annual HRA received
 * @param {number} rentPaid - Annual rent paid
 * @param {boolean} isMetro - Is employee in metro city (Mumbai, Delhi, Kolkata, Chennai)
 * @returns {number} HRA exemption amount
 */
export const calculateHRAExemption = (basicSalary, hraReceived, rentPaid, isMetro = false) => {
    if (!rentPaid || rentPaid === 0) return 0;

    // HRA exemption is minimum of:
    // 1. Actual HRA received
    // 2. 50% of basic (metro) or 40% of basic (non-metro)
    // 3. Rent paid - 10% of basic

    const option1 = hraReceived;
    const option2 = isMetro ? (basicSalary * 0.5) : (basicSalary * 0.4);
    const option3 = rentPaid - (basicSalary * 0.1);

    const exemption = Math.min(option1, option2, Math.max(0, option3));
    return roundToTwo(exemption);
};

/**
 * Apply tax saving declarations
 * @param {number} grossIncome - Gross annual income
 * @param {object} declarations - Tax saving investments
 * @returns {object} Taxable income and deductions breakdown
 */
export const applyDeductions = (grossIncome, declarations = {}) => {
    const deductions = {
        standardDeduction: STANDARD_DEDUCTION,
        section80C: 0,
        section80D: 0,
        hraExemption: 0,
        homeLoanInterest: 0,
        nps: 0,
        total: 0
    };

    // Section 80C - max 150,000
    if (declarations.section80C) {
        const total80C = Object.values(declarations.section80C).reduce((sum, val) => sum + (val || 0), 0);
        deductions.section80C = Math.min(total80C, 150000);
    }

    // Section 80D - max 50,000 (25K self + 25K parents)
    if (declarations.section80D) {
        const selfFamily = Math.min(declarations.section80D.selfAndFamily || 0, 25000);
        const parents = Math.min(declarations.section80D.parents || 0, 25000);
        deductions.section80D = selfFamily + parents;
    }

    // HRA Exemption
    if (declarations.hraDetails) {
        const { basicSalary = 0, hraReceived = 0, rentPaid = 0, isMetro = false } = declarations.hraDetails;
        deductions.hraExemption = calculateHRAExemption(basicSalary, hraReceived, rentPaid, isMetro);
    }

    // Home Loan Interest - max 200,000 (Section 24)
    if (declarations.homeLoan?.interestPaid) {
        deductions.homeLoanInterest = Math.min(declarations.homeLoan.interestPaid, 200000);
    }

    // NPS (80CCD(1B)) - max 50,000 (additional to 80C)
    if (declarations.nps) {
        deductions.nps = Math.min(declarations.nps, 50000);
    }

    deductions.total = Object.values(deductions).reduce((sum, val) => sum + val, 0);

    const taxableIncome = Math.max(0, grossIncome - deductions.total);

    return {
        grossIncome: roundToTwo(grossIncome),
        deductions,
        taxableIncome: roundToTwo(taxableIncome)
    };
};

/**
 * Calculate annual TDS (Tax Deducted at Source)
 * @param {number} annualIncome - Gross annual income
 * @param {object} declarations - Tax saving declarations
 * @returns {object} Complete tax breakdown
 */
export const calculateTDS = (annualIncome, declarations = {}) => {
    // Apply deductions
    const { grossIncome, deductions, taxableIncome } = applyDeductions(annualIncome, declarations);

    // Calculate tax
    const taxBeforeCess = calculateTaxFromSlabs(taxableIncome);
    const cess = roundToTwo(taxBeforeCess * HEALTH_EDUCATION_CESS);
    const totalTax = roundToTwo(taxBeforeCess + cess);

    // Rebate under Section 87A (if income < 7L, rebate up to 25K)
    let rebate = 0;
    if (taxableIncome <= 700000) {
        rebate = Math.min(totalTax, 25000);
    }

    const finalTax = Math.max(0, totalTax - rebate);
    const monthlyTDS = roundToTwo(finalTax / 12);

    return {
        grossIncome,
        deductions,
        taxableIncome,
        taxCalculation: {
            taxBeforeCess: roundToTwo(taxBeforeCess),
            cess: roundToTwo(cess),
            totalTax: roundToTwo(totalTax),
            rebate: roundToTwo(rebate),
            finalTax: roundToTwo(finalTax)
        },
        monthlyTDS,
        annualTDS: finalTax,
        effectiveTaxRate: taxableIncome > 0 ? roundToTwo((finalTax / grossIncome) * 100) : 0
    };
};

/**
 * Calculate tax estimate for quick preview
 * @param {number} monthlySalary - Monthly gross salary
 * @param {object} declarations - Optional tax declarations
 * @returns {object} Tax estimate
 */
export const calculateTaxEstimate = (monthlySalary, declarations = {}) => {
    const annualIncome = monthlySalary * 12;
    return calculateTDS(annualIncome, declarations);
};

/**
 * Validate tax declaration limits
 * @param {object} declarations - Tax declarations
 * @returns {object} Validation result with errors
 */
export const validateDeclarations = (declarations) => {
    const errors = [];

    // Validate 80C limit
    if (declarations.section80C) {
        const total80C = Object.values(declarations.section80C).reduce((sum, val) => sum + (val || 0), 0);
        if (total80C > 150000) {
            errors.push('Section 80C total cannot exceed ₹1,50,000');
        }
    }

    // Validate 80D limit
    if (declarations.section80D) {
        if (declarations.section80D.selfAndFamily > 25000) {
            errors.push('Section 80D (Self & Family) cannot exceed ₹25,000');
        }
        if (declarations.section80D.parents > 25000) {
            errors.push('Section 80D (Parents) cannot exceed ₹25,000');
        }
    }

    // Validate NPS
    if (declarations.nps > 50000) {
        errors.push('NPS (80CCD(1B)) cannot exceed ₹50,000');
    }

    // Validate HRA
    if (declarations.hraDetails?.rentPaid > 0) {
        if (!declarations.hraDetails.landlordName) {
            errors.push('Landlord name is required for HRA exemption');
        }
        if (declarations.hraDetails.rentPaid > 100000 && !declarations.hraDetails.landlordPAN) {
            errors.push('Landlord PAN is required if annual rent exceeds ₹1,00,000');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};
