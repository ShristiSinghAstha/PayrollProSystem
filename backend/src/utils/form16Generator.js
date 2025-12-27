/**
 * Form 16 PDF Generator - TDS Certificate (Part A + Part B)
 * Generates official Form 16 as per Indian Income Tax format
 */

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { uploadPDFToCloudinary } from './pdfGenerator.js';
import Payroll from '../models/Payroll.js';
import Employee from '../models/Employee.js';
import TaxDeclaration from '../models/TaxDeclaration.js';
import { calculateTDS } from './taxCalculator.js';

const EMPLOYER_DETAILS = {
    name: 'PayrollPro Solutions Pvt Ltd',
    address: 'Corporate Tower, Business District, Mumbai - 400001',
    tan: 'MUMX12345A', // Tax Deduction Account Number
    pan: 'AABCP1234C'
};

/**
 * Generate Form 16 PDF for employee
 * @param {string} employeeId - Employee ID
 * @param {string} financialYear - FY (e.g., "2024-25")
 * @returns {Promise<string>} - Cloudinary URL of PDF
 */
export const generateForm16 = async (employeeId, financialYear) => {
    const employee = await Employee.findById(employeeId)
        .select('employeeId personalInfo employment salaryStructure');

    if (!employee) {
        throw new Error('Employee not found');
    }

    // Get payroll records for the financial year
    const [startYear, endYear] = financialYear.split('-');
    const fyStart = `${startYear}-04`; // April
    const fyEnd = `${20}${endYear}-03`; // March next year

    const payrolls = await Payroll.find({
        employeeId,
        month: { $gte: fyStart, $lte: fyEnd }
    }).sort({ month: 1 });

    if (payrolls.length === 0) {
        throw new Error('No payroll records found for this financial year');
    }

    // Get tax declaration
    const taxDeclaration = await TaxDeclaration.findOne({ employeeId, financialYear });

    // Calculate annual totals
    const annualData = calculateAnnualTotals(payrolls);
    const taxCalculation = calculateTDS(annualData.grossIncome, taxDeclaration || {});

    // Create PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const fileName = `Form16_${employee.employeeId}_FY${financialYear}.pdf`;
    const filePath = path.join(process.cwd(), 'temp', fileName);

    // Ensure temp directory exists
    if (!fs.existsSync(path.join(process.cwd(), 'temp'))) {
        fs.mkdirSync(path.join(process.cwd(), 'temp'));
    }

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Generate PDF content
    generateForm16Content(doc, employee, payrolls, annualData, taxCalculation, taxDeclaration, financialYear);

    doc.end();

    // Wait for PDF to be written
    await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
    });

    // Upload to Cloudinary
    const cloudinaryUrl = await uploadPDFToCloudinary(filePath, fileName);

    // Clean up temp file
    fs.unlinkSync(filePath);

    return cloudinaryUrl;
};

/**
 * Calculate annual totals from monthly payrolls
 */
const calculateAnnualTotals = (payrolls) => {
    const totals = {
        basicSalary: 0,
        hra: 0,
        da: 0,
        specialAllowance: 0,
        otherAllowances: 0,
        grossIncome: 0,
        pf: 0,
        professionalTax: 0,
        esi: 0,
        tds: 0,
        totalDeductions: 0,
        netSalary: 0
    };

    payrolls.forEach(payroll => {
        totals.basicSalary += payroll.earnings.basic || 0;
        totals.hra += payroll.earnings.hra || 0;
        totals.da += payroll.earnings.da || 0;
        totals.specialAllowance += payroll.earnings.specialAllowance || 0;
        totals.otherAllowances += payroll.earnings.otherAllowances || 0;
        totals.grossIncome += payroll.earnings.gross || 0;

        totals.pf += payroll.deductions.pf || 0;
        totals.professionalTax += payroll.deductions.professionalTax || 0;
        totals.esi += payroll.deductions.esi || 0;
        totals.tds += payroll.deductions.tds || 0;
        totals.totalDeductions += payroll.deductions.total || 0;

        totals.netSalary += payroll.netSalary || 0;
    });

    return totals;
};

/**
 * Generate Form 16 PDF content
 */
const generateForm16Content = (doc, employee, payrolls, annualData, taxCalc, taxDeclaration, fy) => {
    const [startYear, endYear] = fy.split('-');
    const assessmentYear = `20${endYear}-${parseInt(endYear) + 1}`;

    // Header
    doc.fontSize(18).font('Helvetica-Bold').text('FORM NO. 16', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('[See rule 31(1)(a)]', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).font('Helvetica-Bold').text('Certificate under section 203 of the Income-tax Act, 1961', { align: 'center' });
    doc.fontSize(10).text('for tax deducted at source on salary', { align: 'center' });
    doc.moveDown(2);

    // Part A
    doc.fontSize(12).font('Helvetica-Bold').text('PART A', { underline: true });
    doc.moveDown();

    doc.fontSize(10).font('Helvetica');
    doc.text(`Name and address of Employer: ${EMPLOYER_DETAILS.name}`);
    doc.text(EMPLOYER_DETAILS.address);
    doc.text(`TAN of Employer: ${EMPLOYER_DETAILS.tan}`);
    doc.text(`PAN of Employer: ${EMPLOYER_DETAILS.pan}`);
    doc.moveDown();

    doc.text(`Name and Address of Employee: ${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`);
    doc.text(`Employee ID: ${employee.employeeId}`);
    doc.text(`PAN of Employee: ${employee.personalInfo.pan || 'Not Provided'}`);
    doc.moveDown();

    doc.text(`Assessment Year: ${assessmentYear}`);
    doc.text(`Financial Year: ${fy}`);
    doc.text(`Period: 01/04/${startYear} to 31/03/20${endYear}`);
    doc.moveDown(2);

    // Summary of TDS
    doc.fontSize(11).font('Helvetica-Bold').text('Summary of Tax Deducted at Source');
    doc.moveDown();

    const summaryY = doc.y;
    doc.fontSize(9).font('Helvetica');

    // Table headers
    doc.text('Quarter', 50, summaryY);
    doc.text('Receipt Numbers', 200, summaryY);
    doc.text('Tax Deposited', 400, summaryY);
    doc.moveDown();

    // Quarterly breakdown (simplified - showing annual)
    doc.text('Annual', 50);
    doc.text('N/A', 200);
    doc.text(`₹${annualData.tds.toLocaleString('en-IN')}`, 400);
    doc.moveDown(2);

    // Part B - SALARY DETAILS
    doc.addPage();
    doc.fontSize(12).font('Helvetica-Bold').text('PART B', { underline: true });
    doc.moveDown();
    doc.fontSize(11).text('Details of Salary Paid and any other income and tax deducted');
    doc.moveDown();

    doc.fontSize(10).font('Helvetica');

    // Gross Salary
    doc.font('Helvetica-Bold').text('1. Gross Salary');
    doc.font('Helvetica');
    doc.text(`   (a) Salary as per section 17(1): ₹${annualData.basicSalary.toLocaleString('en-IN')}`);
    doc.text(`   (b) Value of perquisites: ₹0`);
    doc.text(`   (c) Profits in lieu of salary: ₹0`);
    doc.text(`   (d) Total: ₹${annualData.grossIncome.toLocaleString('en-IN')}`);
    doc.moveDown();

    // Deductions
    doc.font('Helvetica-Bold').text('2. Less: Allowances to the extent exempt u/s 10');
    doc.font('Helvetica');
    const hraExemption = taxCalc.deductions?.hraExemption || 0;
    doc.text(`   House Rent Allowance: ₹${hraExemption.toLocaleString('en-IN')}`);
    doc.moveDown();

    doc.font('Helvetica-Bold').text('3. Balance (1 - 2)');
    doc.font('Helvetica');
    const balance = annualData.grossIncome - hraExemption;
    doc.text(`   ₹${balance.toLocaleString('en-IN')}`);
    doc.moveDown();

    // Deductions under Chapter VI-A
    doc.font('Helvetica-Bold').text('4. Deductions under Chapter VI-A');
    doc.font('Helvetica');
    if (taxDeclaration) {
        doc.text(`   Section 80C: ₹${(taxDeclaration.section80C?.total || 0).toLocaleString('en-IN')}`);
        doc.text(`   Section 80D: ₹${(taxDeclaration.section80D?.total || 0).toLocaleString('en-IN')}`);
        doc.text(`   Section 80CCD(1B): ₹${(taxDeclaration.nps || 0).toLocaleString('en-IN')}`);
    }
    doc.text(`   Standard Deduction: ₹${(taxCalc.deductions?.standardDeduction || 50000).toLocaleString('en-IN')}`);
    doc.text(`   Total: ₹${(taxCalc.deductions?.total || 0).toLocaleString('en-IN')}`);
    doc.moveDown();

    // Taxable Income
    doc.font('Helvetica-Bold').text('5. Taxable Income (3 - 4)');
    doc.font('Helvetica');
    doc.text(`   ₹${taxCalc.taxableIncome.toLocaleString('en-IN')}`);
    doc.moveDown();

    // Tax Calculation
    doc.font('Helvetica-Bold').text('6. Tax on Taxable Income');
    doc.font('Helvetica');
    doc.text(`   Tax: ₹${taxCalc.taxCalculation.taxBeforeCess.toLocaleString('en-IN')}`);
    doc.text(`   Health & Education Cess (4%): ₹${taxCalc.taxCalculation.cess.toLocaleString('en-IN')}`);
    doc.text(`   Total Tax: ₹${taxCalc.taxCalculation.totalTax.toLocaleString('en-IN')}`);
    if (taxCalc.taxCalculation.rebate > 0) {
        doc.text(`   Less: Rebate u/s 87A: ₹${taxCalc.taxCalculation.rebate.toLocaleString('en-IN')}`);
    }
    doc.moveDown();

    doc.font('Helvetica-Bold').text('7. Tax Deducted at Source');
    doc.font('Helvetica');
    doc.text(`   ₹${annualData.tds.toLocaleString('en-IN')}`);
    doc.moveDown(2);

    // Footer
    doc.fontSize(8).font('Helvetica-Italic');
    doc.text('This is a computer-generated document and does not require a signature.', { align: 'center' });
    doc.moveDown();
    doc.text(`Date of Issue: ${new Date().toLocaleDateString('en-IN')}`, { align: 'center' });
    doc.text('Place: Mumbai', { align: 'center' });
};

export default { generateForm16 };
