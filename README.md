# PayrollPro System

> **Academic Project**: Software Platform for Managing Employee Payment Transactions

## 📋 Overview

PayrollPro is a full-stack web application designed to automate and streamline payroll management processes in organizational settings. The system addresses the challenges of manual salary computation, leave tracking, and employee data management through a comprehensive digital solution built using the MERN stack.

This academic project demonstrates the implementation of enterprise-level features including automated payroll processing, role-based access control, real-time notifications, and dual-portal architecture for administrators and employees.

## 🎯 Key Features

- **Employee Management** - Complete CRUD operations with auto-generated employee IDs and bulk import/export capabilities
- **Payroll Processing** - Automated monthly salary calculations with support for earnings, deductions, and adjustments
- **Leave Management** - Multi-type leave system (Casual, Sick, Earned, LOP) with approval workflows
- **Authentication & Authorization** - JWT-based secure login with role-based access control
- **Real-time Notifications** - Socket.io integration for instant updates on payroll and leave actions
- **Document Generation** - PDF payslip creation with cloud storage and email delivery
- **Audit Trail** - Comprehensive logging of all system operations for compliance and transparency
- **Analytics Dashboard** - Visual insights with charts for payroll trends and employee statistics

## 🏗️ Technology Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT, bcrypt.js
- **Real-time**: Socket.io
- **File Processing**: Multer, PDFKit, Cloudinary
- **Email**: Nodemailer

### Frontend
- **Framework**: React 19 with Vite
- **Routing**: React Router DOM
- **UI Library**: Ant Design, TailwindCSS
- **State Management**: React Hooks, Context API
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts, Ant Design Charts
- **Real-time**: Socket.io Client

## 📂 Project Structure

```
payroll/
├── backend/               # Node.js/Express.js server
│   ├── src/
│   │   ├── config/       # Database and Socket.io configuration
│   │   ├── controllers/  # Business logic (7 controllers)
│   │   ├── models/       # MongoDB schemas (5 models)
│   │   ├── routes/       # API endpoints (7 route files)
│   │   ├── middlewares/  # Authentication and validation
│   │   └── utils/        # Helper functions and services
│   └── package.json
│
└── frontend/             # React application
    ├── src/
    │   ├── pages/        # Admin and Employee portal pages
    │   ├── components/   # Reusable UI components
    │   ├── contexts/     # Auth and Socket contexts
    │   ├── hooks/        # Custom React hooks
    │   └── api/          # API integration layer
    └── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account or local MongoDB instance
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd payroll
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your MongoDB URI and configuration
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env with backend API URL
   npm run dev
   ```

4. **Access the Application**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000`

## 📚 Documentation

- [Backend Documentation](./backend/README.md) - API endpoints, database schemas, and backend architecture
- [Analysis Report](./docs/analysis_report.md) - Comprehensive technical analysis (if available)

## 👥 Team Members

This project was developed collaboratively as an academic assignment:

| Name | Role | Contribution |
|------|------|--------------|
| **Shristi Singh Astha** | Authentication & Access Control | Implemented JWT authentication, password reset functionality, role-based routing, and security middleware |
| **Sai Prashanth** | Admin Dashboard & Core Systems | Developed employee management, payroll processing, reports module, bulk operations, and audit logging |
| **Anchal Kumari Malik** | Employee Portal | Built employee self-service interface including dashboard, payslip viewing, leave management, and profile updates |

## 🔐 Security Features

- Password encryption using bcrypt
- JWT token-based authentication
- Role-based access control (Admin/Employee)
- Bank account number masking
- Input validation and sanitization
- Comprehensive audit trail logging
- Secure file upload handling

## 📊 System Capabilities

- Processes payroll for unlimited employees
- Handles multiple leave types with automatic balance tracking
- Generates professional PDF payslips
- Sends email notifications for important events
- Supports bulk employee import via CSV
- Exports data to Excel for reporting
- Real-time updates across all connected clients

## 📝 License

This is an academic project developed for educational purposes.

## 🙏 Acknowledgments

Special thanks to our academic supervisors and mentors for their guidance throughout the development of this project.

---

**Project Status**: Active Development | **Academic Year**: 2024-2025
