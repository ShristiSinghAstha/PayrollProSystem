import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const employeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },

  personalInfo: {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [2, 'First name must be at least 2 characters'],
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [2, 'Last name must be at least 2 characters'],
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address'
      ]
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit Indian phone number']
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
      validate: {
        validator: function (value) {
          const age = Math.floor((Date.now() - value) / (365.25 * 24 * 60 * 60 * 1000));
          return age >= 18 && age <= 65;
        },
        message: 'Employee must be between 18 and 65 years old'
      }
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipCode: {
        type: String,
        match: [/^\d{6}$/, 'Please provide a valid 6-digit PIN code']
      },
      country: { type: String, default: 'India' }
    }
  },

  employment: {
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: {
        values: ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations'],
        message: '{VALUE} is not a valid department'
      },
      index: true
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      trim: true
    },
    dateOfJoining: {
      type: Date,
      required: [true, 'Date of joining is required'],
      validate: {
        validator: function (value) {
          return value <= new Date();
        },
        message: 'Date of joining cannot be in the future'
      }
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Terminated', 'Resigned'],
      default: 'Active',
      index: true
    }
  },

  bankDetails: {
    accountNumber: {
      type: String,
      required: [true, 'Bank account number is required'],
      trim: true,
      minlength: [9, 'Account number must be at least 9 digits'],
      maxlength: [18, 'Account number cannot exceed 18 digits']
    },
    accountHolderName: {
      type: String,
      required: [true, 'Account holder name is required'],
      trim: true,
      uppercase: true
    },
    ifscCode: {
      type: String,
      required: [true, 'IFSC code is required'],
      uppercase: true,
      trim: true,
      match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Please provide a valid IFSC code']
    },
    bankName: {
      type: String,
      required: [true, 'Bank name is required'],
      trim: true
    },
    branch: { type: String, trim: true }
  },

  salaryStructure: {
    basicSalary: {
      type: Number,
      required: [true, 'Basic salary is required'],
      min: [5000, 'Basic salary must be at least ₹5000']
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
    pfPercentage: {
      type: Number,
      default: 12,
      min: [0, 'PF percentage cannot be negative'],
      max: [100, 'PF percentage cannot exceed 100%']
    },
    professionalTax: {
      type: Number,
      default: 200,
      min: [0, 'Professional tax cannot be negative']
    },
    esiPercentage: {
      type: Number,
      default: 0.75,
      min: [0, 'ESI percentage cannot be negative'],
      max: [100, 'ESI percentage cannot exceed 100%']
    }
  },

  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },

  passwordResetToken: {
    type: String,
    select: false
  },

  passwordResetExpires: {
    type: Date,
    select: false
  },

  role: {
    type: String,
    enum: ['admin', 'employee'],
    default: 'employee'
  },

  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },

  lastLogin: Date,

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

employeeSchema.index({ employeeId: 1 }, { unique: true });

employeeSchema.virtual('personalInfo.fullName').get(function () {
  return `${this.personalInfo.firstName} ${this.personalInfo.lastName}`;
});

employeeSchema.virtual('bankDetails.maskedAccountNumber').get(function () {
  const accNum = this.bankDetails.accountNumber;
  if (!accNum || accNum.length < 4) return '****';
  return `****${accNum.slice(-4)}`;
});

employeeSchema.virtual('personalInfo.age').get(function () {
  if (!this.personalInfo.dateOfBirth) return null;
  return Math.floor((Date.now() - this.personalInfo.dateOfBirth) / (365.25 * 24 * 60 * 60 * 1000));
});

employeeSchema.pre('save', async function () {
  if (this.isNew && !this.employeeId) {
    const year = new Date().getFullYear();
    const deptCode = this.employment.department.substring(0, 3).toUpperCase();

    const lastEmployee = await this.constructor.findOne({
      employeeId: new RegExp(`^${deptCode}-${year}`)
    }).sort({ employeeId: -1 });

    let sequence = 1001;
    if (lastEmployee) {
      const lastSeq = parseInt(lastEmployee.employeeId.split('-')[2]);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }

    this.employeeId = `${deptCode}-${year}-${sequence}`;
  }
});

employeeSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

employeeSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

employeeSchema.methods.getPublicProfile = function () {
  const obj = this.toObject();
  delete obj.password;
  if (obj.bankDetails && obj.bankDetails.accountNumber) {
    obj.bankDetails.accountNumber = this.bankDetails.maskedAccountNumber;
  }
  return obj;
};

employeeSchema.statics.findActive = function () {
  return this.find({
    'employment.status': 'Active',
    isDeleted: false
  });
};

employeeSchema.statics.findByDepartment = function (department) {
  return this.find({
    'employment.department': department,
    isDeleted: false
  });
};

export default mongoose.model('Employee', employeeSchema);