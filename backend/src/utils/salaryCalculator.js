const roundToTwo = (num) => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export const calculateSalary = (salaryStructure, adjustments = {}) => {
  if (!salaryStructure || typeof salaryStructure.basicSalary !== 'number') {
    throw new Error('Invalid salary structure provided');
  }

  const {
    basicSalary,
    hra = 0,
    da = 0,
    specialAllowance = 0,
    otherAllowances = 0,
    pfPercentage = 12,
    professionalTax = 200,
    esiPercentage = 0.75
  } = salaryStructure;

  const { bonus = 0, penalty = 0, lopDays = 0 } = adjustments;

  const earnings = {
    basic: roundToTwo(basicSalary),
    hra: roundToTwo(hra),
    da: roundToTwo(da),
    specialAllowance: roundToTwo(specialAllowance),
    otherAllowances: roundToTwo(otherAllowances),
    gross: 0
  };

  earnings.gross = roundToTwo(
    earnings.basic +
    earnings.hra +
    earnings.da +
    earnings.specialAllowance +
    earnings.otherAllowances
  );

  // Calculate LOP deduction (Loss of Pay)
  // LOP = (Gross Salary / 30) * LOP days
  const lopDeduction = lopDays > 0 ? roundToTwo((earnings.gross / 30) * lopDays) : 0;

  const deductions = {
    pf: roundToTwo((earnings.basic * pfPercentage) / 100),
    professionalTax: roundToTwo(professionalTax),
    esi: roundToTwo((earnings.basic * esiPercentage) / 100),
    lop: lopDeduction,
    total: 0
  };

  deductions.total = roundToTwo(
    deductions.pf +
    deductions.professionalTax +
    deductions.esi +
    deductions.lop
  );

  const adjustmentValues = {
    bonus: roundToTwo(bonus),
    penalty: roundToTwo(penalty),
    lopDays: roundToTwo(lopDays)
  };

  const netSalary = roundToTwo(
    earnings.gross -
    deductions.total +
    adjustmentValues.bonus -
    adjustmentValues.penalty
  );

  if (netSalary < 0) {
    throw new Error('Net salary cannot be negative. Please review adjustments.');
  }

  return {
    earnings,
    deductions,
    adjustments: adjustmentValues,
    netSalary
  };
};

export const validateSalaryStructure = (salaryStructure) => {
  const requiredFields = ['basicSalary'];

  for (const field of requiredFields) {
    if (salaryStructure[field] === undefined || salaryStructure[field] === null) {
      throw new Error(`Missing required field: ${field}`);
    }

    if (typeof salaryStructure[field] !== 'number' || salaryStructure[field] < 0) {
      throw new Error(`${field} must be a non-negative number`);
    }
  }

  return true;
};

export const calculateYearlyCTC = (salaryStructure) => {
  const monthlySalary = calculateSalary(salaryStructure);
  return roundToTwo(monthlySalary.earnings.gross * 12);
};