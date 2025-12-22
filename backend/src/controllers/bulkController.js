import fs from 'fs';
import csv from 'csv-parser';
import xlsx from 'xlsx';
import Employee from '../models/Employee.js';
import Payroll from '../models/Payroll.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { calculateSalary } from '../utils/salaryCalculator.js';

// Bulk import employees from CSV
export const bulkImportEmployees = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'Please upload a CSV file'
        });
    }

    const results = [];
    const errors = [];
    let lineNumber = 1;

    // Read and parse CSV
    const stream = fs.createReadStream(req.file.path)
        .pipe(csv());

    for await (const row of stream) {
        lineNumber++;
        try {
            // Validate required fields
            if (!row.firstName || !row.lastName || !row.email || !row.phone || !row.dateOfBirth ||
                !row.department || !row.designation || !row.dateOfJoining || !row.basicSalary) {
                errors.push({
                    line: lineNumber,
                    error: 'Missing required fields',
                    data: row
                });
                continue;
            }

            // Check if employee already exists
            const existingEmployee = await Employee.findOne({ 'personalInfo.email': row.email });
            if (existingEmployee) {
                errors.push({
                    line: lineNumber,
                    error: `Employee with email ${row.email} already exists`,
                    data: row
                });
                continue;
            }

            // Generate temporary password
            const tempPassword = `Emp${Math.random().toString(36).slice(-8)}`;

            // Create employee
            const employee = await Employee.create({
                personalInfo: {
                    firstName: row.firstName,
                    lastName: row.lastName,
                    email: row.email,
                    phone: row.phone,
                    dateOfBirth: new Date(row.dateOfBirth),
                    gender: row.gender || 'Other',
                    address: {
                        street: row.street || '',
                        city: row.city || '',
                        state: row.state || '',
                        pincode: row.pincode || '',
                        country: row.country || 'India'
                    }
                },
                employment: {
                    department: row.department,
                    designation: row.designation,
                    dateOfJoining: new Date(row.dateOfJoining),
                    employmentType: row.employmentType || 'Full-Time',
                    status: 'Active'
                },
                bankDetails: {
                    accountNumber: row.accountNumber || '',
                    ifscCode: row.ifscCode || '',
                    bankName: row.bankName || '',
                    branch: row.branch || ''
                },
                salaryStructure: {
                    basicSalary: parseFloat(row.basicSalary),
                    hra: parseFloat(row.hra || 0),
                    da: parseFloat(row.da || 0),
                    specialAllowance: parseFloat(row.specialAllowance || 0),
                    otherAllowances: parseFloat(row.otherAllowances || 0),
                    pfPercentage: parseFloat(row.pfPercentage || 12),
                    professionalTax: parseFloat(row.professionalTax || 200),
                    esiPercentage: parseFloat(row.esiPercentage || 0.75)
                },
                password: tempPassword,
                role: 'employee',
                createdBy: req.user._id
            });

            results.push({
                line: lineNumber,
                employeeId: employee.employeeId,
                name: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
                email: employee.personalInfo.email,
                tempPassword: tempPassword
            });

        } catch (error) {
            errors.push({
                line: lineNumber,
                error: error.message,
                data: row
            });
        }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.status(200).json({
        success: true,
        message: `Imported ${results.length} employees successfully`,
        data: {
            imported: results,
            errors: errors,
            total: lineNumber - 1,
            successful: results.length,
            failed: errors.length
        }
    });
});

// Export employees to Excel
export const exportEmployees = asyncHandler(async (req, res) => {
    const { department, status } = req.query;

    const query = { isDeleted: false };
    if (department) query['employment.department'] = department;
    if (status) query['employment.status'] = status;

    const employees = await Employee.find(query).select('-password').sort({ createdAt: -1 });

    // Prepare data for Excel
    const data = employees.map(emp => ({
        'Employee ID': emp.employeeId,
        'First Name': emp.personalInfo.firstName,
        'Last Name': emp.personalInfo.lastName,
        'Email': emp.personalInfo.email,
        'Phone': emp.personalInfo.phone,
        'Date of Birth': emp.personalInfo.dateOfBirth?.toISOString().split('T')[0] || '',
        'Gender': emp.personalInfo.gender,
        'Department': emp.employment.department,
        'Designation': emp.employment.designation,
        'Date of Joining': emp.employment.dateOfJoining?.toISOString().split('T')[0] || '',
        'Employment Type': emp.employment.employmentType,
        'Status': emp.employment.status,
        'Basic Salary': emp.salaryStructure.basicSalary,
        'HRA': emp.salaryStructure.hra,
        'DA': emp.salaryStructure.da,
        'Special Allowance': emp.salaryStructure.specialAllowance,
        'Other Allowances': emp.salaryStructure.otherAllowances,
        'Account Number': emp.bankDetails.accountNumber,
        'IFSC Code': emp.bankDetails.ifscCode,
        'Bank Name': emp.bankDetails.bankName,
        'Street': emp.personalInfo.address?.street || '',
        'City': emp.personalInfo.address?.city || '',
        'State': emp.personalInfo.address?.state || '',
        'Pincode': emp.personalInfo.address?.pincode || ''
    }));

    // Create workbook and worksheet
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);

    // Set column widths
    ws['!cols'] = [
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 12 },
        { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
        { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 10 },
        { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 12 }, { wch: 15 }
    ];

    xlsx.utils.book_append_sheet(wb, ws, 'Employees');

    // Generate buffer
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename=employees-${Date.now()}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
});

// Export payroll to Excel
export const exportPayroll = asyncHandler(async (req, res) => {
    const { month, status } = req.query;

    const query = {};
    if (month) query.month = month;
    if (status) query.status = status;

    const payrolls = await Payroll.find(query)
        .populate('employeeId', 'employeeId personalInfo.firstName personalInfo.lastName personalInfo.email employment.department employment.designation')
        .sort({ createdAt: -1 });

    // Prepare data for Excel
    const data = payrolls.map(p => ({
        'Employee ID': p.employeeId?.employeeId || '',
        'Name': `${p.employeeId?.personalInfo?.firstName || ''} ${p.employeeId?.personalInfo?.lastName || ''}`,
        'Email': p.employeeId?.personalInfo?.email || '',
        'Department': p.employeeId?.employment?.department || '',
        'Designation': p.employeeId?.employment?.designation || '',
        'Month': p.month,
        'Year': p.year,
        'Basic Salary': p.earnings?.basic || 0,
        'HRA': p.earnings?.hra || 0,
        'DA': p.earnings?.da || 0,
        'Special Allowance': p.earnings?.specialAllowance || 0,
        'Other Allowances': p.earnings?.otherAllowances || 0,
        'Gross Earnings': p.earnings?.gross || 0,
        'PF': p.deductions?.pf || 0,
        'Professional Tax': p.deductions?.professionalTax || 0,
        'ESI': p.deductions?.esi || 0,
        'LOP': p.deductions?.lop || 0,
        'Total Deductions': p.deductions?.total || 0,
        'Net Salary': p.netSalary || 0,
        'Status': p.status,
        'Processed At': p.processedAt?.toISOString().split('T')[0] || '',
        'Approved At': p.approvedAt?.toISOString().split('T')[0] || '',
        'Paid At': p.paidAt?.toISOString().split('T')[0] || ''
    }));

    // Create workbook
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);

    // Set column widths
    ws['!cols'] = [
        { wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 15 },
        { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 10 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 15 },
        { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 12 }, { wch: 10 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }
    ];

    xlsx.utils.book_append_sheet(wb, ws, 'Payroll');

    // Generate buffer
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set headers
    res.setHeader('Content-Disposition', `attachment; filename=payroll-${month || 'all'}-${Date.now()}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
});

// Download CSV template
export const downloadTemplate = asyncHandler(async (req, res) => {
    const templateData = [
        {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '9876543210',
            dateOfBirth: '1990-01-15',
            gender: 'Male',
            street: '123 Main St',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
            country: 'India',
            department: 'Engineering',
            designation: 'Software Engineer',
            dateOfJoining: '2023-01-01',
            employmentType: 'Full-Time',
            accountNumber: '1234567890',
            ifscCode: 'HDFC0001234',
            bankName: 'HDFC Bank',
            branch: 'Mumbai Central',
            basicSalary: '50000',
            hra: '15000',
            da: '5000',
            specialAllowance: '10000',
            otherAllowances: '2000',
            pfPercentage: '12',
            professionalTax: '200',
            esiPercentage: '0.75'
        }
    ];

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(templateData);

    // Set column widths
    ws['!cols'] = Array(28).fill({ wch: 15 });

    xlsx.utils.book_append_sheet(wb, ws, 'Employee Template');

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=employee-import-template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
});
