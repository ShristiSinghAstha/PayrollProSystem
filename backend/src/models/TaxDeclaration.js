import mongoose from 'mongoose';

const taxDeclarationSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
        index: true
    },

    financialYear: {
        type: String,
        required: true,
        // Format: "2024-25"
    },

    // Section 80C - Investments (max ₹1,50,000)
    section80C: {
        lic: { type: Number, default: 0 },
        ppf: { type: Number, default: 0 },
        elss: { type: Number, default: 0 },
        homeLoanPrincipal: { type: Number, default: 0 },
        nsc: { type: Number, default: 0 },
        fixedDeposit: { type: Number, default: 0 },
        tuitionFees: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
    },

    // Section 80D - Medical Insurance
    section80D: {
        selfAndFamily: { type: Number, default: 0, max: 25000 },
        parents: { type: Number, default: 0, max: 25000 },
        total: { type: Number, default: 0 }
    },

    // HRA Details
    hraDetails: {
        rentPaid: { type: Number, default: 0 },
        landlordName: String,
        landlordPAN: String,
        landlordAddress: String,
        isMetro: { type: Boolean, default: false }
    },

    // Home Loan
    homeLoan: {
        interestPaid: { type: Number, default: 0 }, // Section 24
        principal: { type: Number, default: 0 }     // Part of 80C
    },

    // NPS - Additional deduction beyond 80C
    nps: {
        type: Number,
        default: 0,
        max: 50000 // Section 80CCD(1B)
    },

    // Education Loan Interest
    educationLoanInterest: {
        type: Number,
        default: 0 // Section 80E - no limit
    },

    // Status tracking
    status: {
        type: String,
        enum: ['Draft', 'Submitted', 'Verified', 'Rejected'],
        default: 'Draft',
        index: true
    },

    submittedAt: Date,

    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
    },

    verifiedAt: Date,

    remarks: String,

    // Calculated fields
    totalDeductions: {
        type: Number,
        default: 0
    },

    estimatedTaxSavings: {
        type: Number,
        default: 0
    },

    // Supporting documents
    documents: [{
        type: {
            type: String,
            enum: ['LIC_Policy', 'PPF_Statement', 'Home_Loan_Certificate', 'Rent_Receipt', 'Medical_Insurance', 'Other']
        },
        fileName: String,
        fileUrl: String,
        uploadedAt: { type: Date, default: Date.now }
    }]

}, {
    timestamps: true
});

// Compound index - one declaration per employee per FY
taxDeclarationSchema.index({ employeeId: 1, financialYear: 1 }, { unique: true });

// Pre-save hook: Calculate totals
taxDeclarationSchema.pre('save', function () {
    // Calculate Section 80C total
    if (this.section80C) {
        this.section80C.total = Math.min(
            (this.section80C.lic || 0) +
            (this.section80C.ppf || 0) +
            (this.section80C.elss || 0) +
            (this.section80C.homeLoanPrincipal || 0) +
            (this.section80C.nsc || 0) +
            (this.section80C.fixedDeposit || 0) +
            (this.section80C.tuitionFees || 0),
            150000
        );
    }

    // Calculate Section 80D total
    if (this.section80D) {
        this.section80D.total = Math.min(
            Math.min(this.section80D.selfAndFamily || 0, 25000) +
            Math.min(this.section80D.parents || 0, 25000),
            50000
        );
    }

    // Calculate total deductions
    this.totalDeductions =
        (this.section80C?.total || 0) +
        (this.section80D?.total || 0) +
        (this.nps || 0) +
        (this.educationLoanInterest || 0) +
        (this.homeLoan?.interestPaid || 0);
});

// Instance method: Submit declaration
taxDeclarationSchema.methods.submit = function () {
    this.status = 'Submitted';
    this.submittedAt = new Date();
};

// Instance method: Verify declaration
taxDeclarationSchema.methods.verify = function (adminId) {
    this.status = 'Verified';
    this.verifiedBy = adminId;
    this.verifiedAt = new Date();
};

// Instance method: Reject declaration
taxDeclarationSchema.methods.reject = function (adminId, remarks) {
    this.status = 'Rejected';
    this.verifiedBy = adminId;
    this.verifiedAt = new Date();
    this.remarks = remarks;
};

// Static method: Get declarations by FY
taxDeclarationSchema.statics.getByFinancialYear = function (fy, filters = {}) {
    const query = { financialYear: fy, ...filters };
    return this.find(query)
        .populate('employeeId', 'personalInfo employment employeeId')
        .populate('verifiedBy', 'personalInfo.firstName personalInfo.lastName')
        .sort({ submittedAt: -1 });
};

// Static method: Get employee's declaration for FY
taxDeclarationSchema.statics.getEmployeeDeclaration = function (employeeId, fy) {
    return this.findOne({ employeeId, financialYear: fy })
        .populate('verifiedBy', 'personalInfo.firstName personalInfo.lastName');
};

export default mongoose.model('TaxDeclaration', taxDeclarationSchema);
