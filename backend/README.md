# PayrollPro Backend - Admin Module

> **Production-ready payroll management system for employee onboarding and monthly payroll processing**

## 🎯 Project Overview

PayrollPro is a comprehensive payroll management system designed for academic demonstration. This backend handles:

- **Module 2**: Employee Management (CRUD operations, salary structure definition)
- **Module 3**: Monthly Payroll Processing (calculation, adjustments, approvals, payments)

## 🏗️ Architecture

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── models/
│   │   ├── Employee.js          # Employee schema
│   │   ├── Payroll.js           # Payroll schema
│   │   └── AuditLog.js          # Audit trail schema
│   ├── controllers/
│   │   ├── employeeController.js # Employee CRUD logic
│   │   └── payrollController.js  # Payroll processing logic
│   ├── routes/
│   │   ├── employeeRoutes.js    # Employee API routes
│   │   └── payrollRoutes.js     # Payroll API routes
│   ├── middlewares/
│   │   ├── errorHandler.js      # Global error handling
│   │   └── validator.js         # Request validation
│   ├── utils/
│   │   ├── salaryCalculator.js  # Salary calculation logic
│   │   └── auditLogger.js       # Audit trail logging
│   └── index.js                 # Server entry point
├── .env                         # Environment variables (gitignored)
├── .env.example                 # Environment template
└── package.json
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account or local MongoDB
- npm or yarn

### Installation

1. **Clone and navigate to backend**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your MongoDB URI
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/payroll_management
```

4. **Start the server**
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will start at: `http://localhost:5000`

## 🔧 Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 5000 | No |
| `HOST` | Server host | localhost | No |
| `NODE_ENV` | Environment | development | No |
| `MONGODB_URI` | MongoDB connection string | - | **Yes** |
| `JWT_SECRET` | JWT secret key (future use) | - | No |
| `BCRYPT_SALT_ROUNDS` | Password hashing rounds | 12 | No |

## 📊 Database Models

### Employee Model
```javascript
{
  employeeId: "ENG-2025-4523",  // Auto-generated
  personalInfo: {
    firstName, lastName, email, phone, dateOfBirth, address
  },
  employment: {
    department, designation, dateOfJoining, status
  },
  bankDetails: {
    accountNumber, accountHolderName, ifscCode, bankName
  },
  salaryStructure: {
    basicSalary, hra, da, specialAllowance,
    pfPercentage, professionalTax, esiPercentage
  }
}
```

### Payroll Model
```javascript
{
  employeeId: ObjectId,
  month: "2025-12",
  year: 2025,
  earnings: { basic, hra, da, specialAllowance, gross },
  deductions: { pf, professionalTax, esi, total },
  adjustments: { bonus, penalty, description },
  netSalary: Number,
  status: "Pending" | "Approved" | "Paid",
  transactionId: String
}
```

## 🧮 Salary Calculation Formula

```
Gross Salary = Basic + HRA + DA + Special Allowance + Other Allowances
PF = 12% of Basic Salary
ESI = 0.75% of Basic Salary
Professional Tax = ₹200 (fixed)
Total Deductions = PF + Professional Tax + ESI
Net Salary = Gross - Total Deductions + Bonus - Penalty
```

## 🔐 Security Features

- ✅ Bank account number masking in all responses
- ✅ Input validation using express-validator
- ✅ Comprehensive error handling
- ✅ Audit logging for all critical operations
- ✅ Duplicate email prevention
- ✅ Age validation (18-65 years)
- ✅ CORS enabled for frontend integration

## 📝 API Endpoints

### Employee Management
- `POST /api/employees` - Create employee
- `GET /api/employees` - List employees (with filters)
- `GET /api/employees/:id` - Get employee details
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Deactivate employee
- `GET /api/employees/stats/summary` - Get statistics

### Payroll Processing
- `POST /api/payroll/process` - Process monthly payroll
- `GET /api/payroll` - List payroll records
- `GET /api/payroll/month/:month` - Get month's payroll
- `PUT /api/payroll/:id/adjustment` - Add adjustment
- `PUT /api/payroll/:id/approve` - Approve payroll
- `PUT /api/payroll/:id/pay` - Mark as paid
- `POST /api/payroll/approve-all/:month` - Bulk approve
- `GET /api/payroll/stats/summary` - Get statistics

📖 **Full API Documentation**: See `api_documentation.md`

## 🧪 Testing Workflow

### 1. Create Test Employees
```bash
POST http://localhost:5000/api/employees
Content-Type: application/json

{
  "personalInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "9876543210",
    "dateOfBirth": "1990-05-15"
  },
  "employment": {
    "department": "Engineering",
    "designation": "Senior Developer",
    "dateOfJoining": "2024-01-15"
  },
  "bankDetails": {
    "accountNumber": "1234567890123456",
    "accountHolderName": "John Doe",
    "ifscCode": "SBIN0001234",
    "bankName": "State Bank of India"
  },
  "salaryStructure": {
    "basicSalary": 50000,
    "hra": 15000,
    "da": 5000,
    "specialAllowance": 10000
  }
}
```

### 2. Process Payroll
```bash
POST http://localhost:5000/api/payroll/process
Content-Type: application/json

{
  "month": "12",
  "year": 2025
}
```

### 3. Review and Approve
```bash
GET http://localhost:5000/api/payroll/month/2025-12
POST http://localhost:5000/api/payroll/approve-all/2025-12
```

### 4. Process Payments
```bash
PUT http://localhost:5000/api/payroll/:id/pay
```

## 🐛 Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400,
    "details": [ ... ]  // Only in development mode
  }
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error

## 📦 Dependencies

### Production
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `dotenv` - Environment variables
- `cors` - Cross-origin resource sharing
- `bcryptjs` - Password hashing (future use)
- `express-validator` - Request validation

### Development
- `nodemon` - Auto-reload during development

## 🔄 Future Enhancements

- [ ] JWT authentication integration
- [ ] Role-based access control
- [ ] PDF payslip generation
- [ ] Email notifications
- [ ] Employee self-service portal
- [ ] Advanced reporting and analytics
- [ ] Tax calculation engine
- [ ] Leave management integration

## 👥 Team Integration

This backend is designed to integrate with:
- **Frontend Team**: React-based admin dashboard
- **Auth Team**: JWT authentication system
- **Employee Portal Team**: Employee self-service interface

## 📄 License

Academic Project - For Educational Purposes

## 🤝 Contributing

This is an academic project. For questions or improvements, contact the development team.

---

**Built with attention to detail, production-ready standards, and comprehensive error handling** ✨
