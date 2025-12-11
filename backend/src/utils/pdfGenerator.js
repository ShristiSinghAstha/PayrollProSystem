import PDFDocument from 'pdfkit';
import cloudinary from '../config/cloudinary.js';

const formatCurrency = (amount) => {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const generatePayslipPDF = async (payrollData, employeeData) => {
  // Validate required data
  if (!payrollData || !employeeData) {
    throw new Error('Payroll and employee data are required');
  }

  if (!employeeData.personalInfo) {
    throw new Error('Employee personal information is missing');
  }

  if (!employeeData.employment) {
    throw new Error('Employee employment information is missing');
  }

  if (!employeeData.bankDetails) {
    throw new Error('Employee bank details are missing');
  }

  if (!payrollData.earnings || !payrollData.deductions) {
    throw new Error('Payroll earnings or deductions are missing');
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const { personalInfo, employment, bankDetails, employeeId } = employeeData;
      const { month, earnings, deductions, adjustments, netSalary, transactionId, paidAt } = payrollData;

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('PAYSLIP', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').text('PayrollPro Management System', { align: 'center' });
      doc.moveDown(2);

      // Pay Period
      doc.fontSize(12).font('Helvetica-Bold').text(`Pay Period: ${month}`);
      doc.fontSize(10).font('Helvetica').text(`Generated: ${formatDate(new Date())}`);
      doc.moveDown(1);

      // Employee Details
      doc.fontSize(11).font('Helvetica-Bold').text('Employee Details', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Name: ${personalInfo.firstName} ${personalInfo.lastName}`);
      doc.text(`Employee ID: ${employeeId}`);
      doc.text(`Department: ${employment.department}`);
      doc.text(`Designation: ${employment.designation}`);
      doc.moveDown(1);

      // Earnings Section
      doc.fontSize(11).font('Helvetica-Bold').text('Earnings', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');

      const earningsY = doc.y;
      doc.text('Basic Salary', 50);
      doc.text(formatCurrency(earnings.basic), 450, earningsY, { align: 'right' });
      
      doc.text('HRA', 50);
      doc.text(formatCurrency(earnings.hra), 450, doc.y - 12, { align: 'right' });
      
      doc.text('DA', 50);
      doc.text(formatCurrency(earnings.da), 450, doc.y - 12, { align: 'right' });
      
      doc.text('Special Allowance', 50);
      doc.text(formatCurrency(earnings.specialAllowance), 450, doc.y - 12, { align: 'right' });
      
      if (earnings.otherAllowances > 0) {
        doc.text('Other Allowances', 50);
        doc.text(formatCurrency(earnings.otherAllowances), 450, doc.y - 12, { align: 'right' });
      }

      // Adjustments Section
      if (adjustments && adjustments.length > 0) {
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica-Bold').text('Adjustments', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');

        adjustments.forEach(adj => {
          const isPositive = ['Bonus', 'Allowance', 'Reimbursement'].includes(adj.type);
          doc.text(`${adj.type}: ${adj.description}`, 50);
          doc.text(
            isPositive ? formatCurrency(adj.amount) : `-${formatCurrency(adj.amount)}`,
            450,
            doc.y - 12,
            { align: 'right' }
          );
        });
      }

      doc.moveDown(0.5);
      doc.strokeColor('#000000').lineWidth(1);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      doc.font('Helvetica-Bold');
      doc.text('Gross Earnings', 50);
      doc.text(formatCurrency(earnings.gross), 450, doc.y - 12, { align: 'right' });
      doc.moveDown(1);

      // Deductions Section
      doc.fontSize(11).font('Helvetica-Bold').text('Deductions', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');

      doc.text('Provident Fund (PF)', 50);
      doc.text(formatCurrency(deductions.pf), 450, doc.y - 12, { align: 'right' });
      
      if (deductions.professionalTax > 0) {
        doc.text('Professional Tax', 50);
        doc.text(formatCurrency(deductions.professionalTax), 450, doc.y - 12, { align: 'right' });
      }
      
      if (deductions.esi > 0) {
        doc.text('ESI', 50);
        doc.text(formatCurrency(deductions.esi), 450, doc.y - 12, { align: 'right' });
      }

      doc.moveDown(0.5);
      doc.strokeColor('#000000').lineWidth(1);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      doc.font('Helvetica-Bold');
      doc.text('Total Deductions', 50);
      doc.text(formatCurrency(deductions.total), 450, doc.y - 12, { align: 'right' });
      doc.moveDown(1);

      // Net Salary
      doc.strokeColor('#000000').lineWidth(2);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      doc.fontSize(13).font('Helvetica-Bold');
      doc.text('NET SALARY', 50);
      doc.text(formatCurrency(netSalary), 450, doc.y - 15, { align: 'right' });
      doc.moveDown(2);

      // Payment Details
      doc.fontSize(11).font('Helvetica-Bold').text('Payment Details', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Transaction ID: ${transactionId || 'N/A'}`);
      doc.text(`Payment Date: ${paidAt ? formatDate(paidAt) : 'Pending'}`);
      doc.text(`Bank Account: ${bankDetails.accountHolderName} - ****${bankDetails.accountNumber.slice(-4)}`);
      doc.moveDown(2);

      // Footer
      doc.fontSize(8).font('Helvetica-Oblique').fillColor('#666666');
      doc.text('This is a computer-generated payslip and does not require a signature.', { align: 'center' });
      doc.text('For any queries, please contact HR department.', { align: 'center' });

      doc.end();

    } catch (error) {
      reject(new Error(`PDF generation failed: ${error.message}`));
    }
  });
};

export const uploadPDFToCloudinary = async (pdfBuffer, filename) => {
  if (!pdfBuffer || pdfBuffer.length === 0) {
    throw new Error('PDF buffer is empty');
  }

  if (!filename) {
    throw new Error('Filename is required');
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: 'payslips',
        public_id: filename,
        format: 'pdf'
      },
      (error, result) => {
        if (error) {
          return reject(new Error(`Cloudinary upload failed: ${error.message}`));
        }
        if (!result || !result.secure_url) {
          return reject(new Error('Cloudinary upload succeeded but no URL returned'));
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(pdfBuffer);
  });
};