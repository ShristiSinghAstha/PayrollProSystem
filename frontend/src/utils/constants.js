export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const DEPARTMENTS = [
  'Engineering',
  'Sales',
  'Marketing',
  'HR',
  'Finance',
  'Operations'
];

export const EMPLOYEE_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  TERMINATED: 'Terminated',
  RESIGNED: 'Resigned'
};

export const PAYROLL_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  PAID: 'Paid',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled'
};

export const ADJUSTMENT_TYPES = [
  'Bonus',
  'Penalty',
  'Allowance',
  'Deduction',
  'Reimbursement',
  'Recovery'
];

export const NOTIFICATION_TYPES = {
  PAYSLIP_READY: 'PAYSLIP_READY',
  PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
  SYSTEM_ALERT: 'SYSTEM_ALERT'
};