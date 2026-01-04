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

/**
 * Calculate LOP (Loss of Pay) days from attendance records
 * @param {string} employeeId - Employee ID
 * @param {number} month - Month (1-12)
 * @param {number} year - Year
 * @returns {Promise<number>} - Number of LOP days
 */
export const calculateLOPFromAttendance = async (employeeId, month, year) => {
  // Dynamic import to avoid circular dependency
  const Attendance = (await import('../models/Attendance.js')).default;
  const Leave = (await import('../models/Leave.js')).default;

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // Get all attendance records for the month
  const attendanceRecords = await Attendance.find({
    employeeId,
    date: { $gte: startDate, $lte: endDate }
  });

  // If no attendance records exist, assume 0 LOP (pay full month)
  // This handles cases where:
  // 1. Month is in the future
  // 2. Attendance tracking hasn't started
  // 3. No records have been entered yet
  if (attendanceRecords.length === 0) {
    console.log(`No attendance records for employee ${employeeId} in ${year}-${month}, returning 0 LOP days`);
    return 0;
  }

  // Count working days: Present + Half-Day (0.5) + Leave
  let workingDays = 0;
  attendanceRecords.forEach(record => {
    if (record.status === 'Present') {
      workingDays += 1;
    } else if (record.status === 'Half-Day') {
      workingDays += 0.5;
    } else if (record.status === 'Leave') {
      workingDays += 1; // Approved leaves are paid
    }
    // Absent, Weekend, Holiday don't count
  });

  // Calculate expected working days (excluding weekends and holidays)
  const totalDays = new Date(year, month, 0).getDate();
  const weekends = attendanceRecords.filter(r => r.status === 'Weekend').length;
  const holidays = attendanceRecords.filter(r => r.status === 'Holiday').length;
  const expectedWorkingDays = totalDays - weekends - holidays;

  // LOP days = Expected working days - Actual working days
  const lopDays = Math.max(0, expectedWorkingDays - workingDays);

  console.log(`LOP Calculation for employee ${employeeId}:`, {
    month: `${year}-${month}`,
    totalDays,
    weekends,
    holidays,
    expectedWorkingDays,
    workingDays,
    lopDays
  });

  return roundToTwo(lopDays);
};
