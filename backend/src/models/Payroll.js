import mongoose from 'mongoose';

const payrollSchema = new mongoose.Schema({
  employeeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee', 
    required: [true, 'Employee ID is required'],
    index: true
  },
  
  month: { 
    type: String, 
    required: [true, 'Payroll month is required'],
    match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be in YYYY-MM format'],
    index: true
  },
  
  year: { 
    type: Number, 
    required: [true, 'Payroll year is required'],
    min: [2020, 'Year must be 2020 or later'],
    max: [2100, 'Year cannot exceed 2100'],
    index: true
  },
  
  earnings: {
    basic: { 
      type: Number, 
      required: [true, 'Basic salary is required'],
      min: [0, 'Basic salary cannot be negative']
    },
    hra: { 
      type: Number, 
      default: 0,
      min: [0, 'HRA cannot be negative']
    },
    da: { 
      type: Number, 
      default: 0,
      min: [0, 'DA cannot be negative']
    },
    specialAllowance: { 
      type: Number, 
      default: 0,
      min: [0, 'Special allowance cannot be negative']
    },
    otherAllowances: { 
      type: Number, 
      default: 0,
      min: [0, 'Other allowances cannot be negative']
    },
    gross: { 
      type: Number, 
      required: [true, 'Gross salary is required'],
      min: [0, 'Gross salary cannot be negative']
    }
  },
  
  deductions: {
    pf: { 
      type: Number, 
      required: [true, 'PF deduction is required'],
      min: [0, 'PF cannot be negative']
    },
    professionalTax: { 
      type: Number, 
      default: 0,
      min: [0, 'Professional tax cannot be negative']
    },
    esi: { 
      type: Number, 
      default: 0,
      min: [0, 'ESI cannot be negative']
    },
    total: { 
      type: Number, 
      required: [true, 'Total deductions is required'],
      min: [0, 'Total deductions cannot be negative']
    }
  },
  
  adjustments: [{
    type: {
      type: String,
      enum: ['Bonus', 'Penalty', 'Allowance', 'Deduction', 'Reimbursement', 'Recovery'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Adjustment amount cannot be negative']
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters']
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  totalAdjustment: {
    type: Number,
    default: 0
  },
  
  netSalary: { 
    type: Number, 
    required: [true, 'Net salary is required'],
    validate: {
      validator: function(value) {
        return value >= 0;
      },
      message: 'Net salary cannot be negative'
    }
  },
  
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Paid', 'Failed', 'Cancelled'],
    default: 'Pending',
    index: true
  },
  
  transactionId: {
    type: String,
    uppercase: true,
    trim: true
  },
  
  paymentMethod: {
    type: String,
    enum: ['Bank Transfer', 'Cheque', 'Cash', 'UPI'],
    default: 'Bank Transfer'
  },
  
  processedAt: Date,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  
  approvedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  
  paidAt: Date,
  
  payslipGenerated: {
    type: Boolean,
    default: false
  },
  
  payslipUrl: {
    type: String,
    trim: true
  },
  
  payslipGeneratedAt: Date,
  
  notificationSent: {
    type: Boolean,
    default: false
  },
  
  notificationSentAt: Date,
  
  remarks: {
    type: String,
    trim: true,
    maxlength: [500, 'Remarks cannot exceed 500 characters']
  },
  
  failureReason: {
    type: String,
    trim: true
  }
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

payrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });
payrollSchema.index({ status: 1 });
payrollSchema.index({ processedAt: -1 });

payrollSchema.virtual('totalEarnings').get(function() {
  return this.earnings.gross + this.totalAdjustment;
});

payrollSchema.virtual('isComplete').get(function() {
  return this.status === 'Paid';
});

payrollSchema.virtual('daysSinceProcessing').get(function() {
  if (!this.processedAt) return null;
  return Math.floor((Date.now() - this.processedAt) / (24 * 60 * 60 * 1000));
});

payrollSchema.pre('save', function(next) {
  if (this.adjustments && this.adjustments.length > 0) {
    this.totalAdjustment = this.adjustments.reduce((sum, adj) => {
      const multiplier = ['Bonus', 'Allowance', 'Reimbursement'].includes(adj.type) ? 1 : -1;
      return sum + (adj.amount * multiplier);
    }, 0);
  } else {
    this.totalAdjustment = 0;
  }
});

payrollSchema.methods.addAdjustment = function(type, amount, description, addedBy) {
  this.adjustments.push({
    type,
    amount: Math.abs(amount),
    description,
    addedBy,
    addedAt: new Date()
  });
  
  const adjustmentTotal = this.adjustments.reduce((sum, adj) => {
    const multiplier = ['Bonus', 'Allowance', 'Reimbursement'].includes(adj.type) ? 1 : -1;
    return sum + (adj.amount * multiplier);
  }, 0);
  
  this.netSalary = this.earnings.gross - this.deductions.total + adjustmentTotal;
  this.totalAdjustment = adjustmentTotal;
  
  if (this.netSalary < 0) {
    throw new Error('Net salary cannot be negative after adjustments');
  }
};

payrollSchema.methods.approve = function(approvedBy) {
  if (this.status !== 'Pending') {
    throw new Error(`Cannot approve payroll with status: ${this.status}`);
  }
  
  this.status = 'Approved';
  this.approvedAt = new Date();
  this.approvedBy = approvedBy;
};

payrollSchema.methods.markAsPaid = function(transactionId) {
  if (this.status !== 'Approved') {
    throw new Error('Payroll must be approved before marking as paid');
  }
  
  this.status = 'Paid';
  this.paidAt = new Date();
  this.transactionId = transactionId || `TXN-${Date.now()}`;
};

payrollSchema.methods.markAsFailed = function(reason) {
  this.status = 'Failed';
  this.failureReason = reason;
};

payrollSchema.methods.getSummary = function() {
  return {
    employeeId: this.employeeId,
    month: this.month,
    gross: this.earnings.gross,
    deductions: this.deductions.total,
    adjustments: this.totalAdjustment,
    netSalary: this.netSalary,
    status: this.status
  };
};

payrollSchema.statics.findByMonth = function(month, year) {
  return this.find({ 
    month: `${year}-${month.toString().padStart(2, '0')}`, 
    year 
  });
};

payrollSchema.statics.findPending = function() {
  return this.find({ status: 'Pending' });
};

payrollSchema.statics.getMonthlySummary = async function(month, year) {
  const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
  const payrolls = await this.find({ month: monthStr, year });
  
  return {
    totalEmployees: payrolls.length,
    totalGross: payrolls.reduce((sum, p) => sum + p.earnings.gross, 0),
    totalDeductions: payrolls.reduce((sum, p) => sum + p.deductions.total, 0),
    totalAdjustments: payrolls.reduce((sum, p) => sum + p.totalAdjustment, 0),
    totalNetPay: payrolls.reduce((sum, p) => sum + p.netSalary, 0),
    byStatus: {
      pending: payrolls.filter(p => p.status === 'Pending').length,
      approved: payrolls.filter(p => p.status === 'Approved').length,
      paid: payrolls.filter(p => p.status === 'Paid').length,
      failed: payrolls.filter(p => p.status === 'Failed').length,
      cancelled: payrolls.filter(p => p.status === 'Cancelled').length
    }
  };
};

export default mongoose.model('Payroll', payrollSchema);