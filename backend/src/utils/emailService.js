import nodemailer from 'nodemailer';
import { generatePayslipEmail } from './emailTemplates.js';
import dayjs from 'dayjs';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const formatCurrency = (amount) => {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const sendPayslipEmail = async (employeeEmail, employeeName, payslipUrl, payrollData) => {
  // Validation
  if (!employeeEmail || !validateEmail(employeeEmail)) {
    return {
      success: false,
      error: 'Invalid or missing employee email address'
    };
  }

  if (!employeeName) {
    return {
      success: false,
      error: 'Employee name is required'
    };
  }

  if (!payslipUrl) {
    return {
      success: false,
      error: 'Payslip URL is required'
    };
  }

  if (!payrollData || !payrollData.month || payrollData.netSalary === undefined) {
    return {
      success: false,
      error: 'Invalid payroll data'
    };
  }

  try {
    const { month, netSalary, earnings, deductions, transactionId, paidAt, employeeId } = payrollData;

    // Format month nicely (e.g., "2025-01" => "January 2025")
    const formattedMonth = dayjs(month).format('MMMM YYYY');

    // Format payment date
    const formattedDate = dayjs(paidAt).format('DD MMM YYYY, hh:mm A');

    // Get bank details
    const bankName = employeeId?.bankDetails?.bankName || 'Bank';
    const accountNumber = employeeId?.bankDetails?.accountNumber
      ? employeeId.bankDetails.accountNumber.slice(-4)
      : '****';

    // Calculate totals
    const grossSalary = earnings?.gross || 0;
    const totalDeductions = deductions?.total || 0;

    // Generate professional HTML email
    const htmlContent = generatePayslipEmail({
      employeeName,
      employeeId: employeeId?.employeeId || 'N/A',
      month: formattedMonth,
      netSalary,
      grossSalary,
      deductions: totalDeductions,
      transactionId: transactionId || 'N/A',
      paidDate: formattedDate,
      payslipUrl,
      bankName,
      accountNumber
    });

    const mailOptions = {
      from: {
        name: 'PayrollPro',
        address: process.env.EMAIL_FROM || 'noreply@payrollpro.com'
      },
      to: employeeEmail,
      subject: `Salary Processed for ${formattedMonth} 💰`,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    console.error('Email sending failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

export const sendWelcomeEmail = async (employeeEmail, employeeName, tempPassword, portalUrl) => {
  if (!employeeEmail || !validateEmail(employeeEmail)) {
    return {
      success: false,
      error: 'Invalid employee email address'
    };
  }

  if (!employeeName || !tempPassword) {
    return {
      success: false,
      error: 'Employee name and password are required'
    };
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@payrollpro.com',
      to: employeeEmail,
      subject: 'Welcome to PayrollPro - Your Account Details',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Welcome to PayrollPro</h2>
          <p>Hi ${employeeName},</p>
          <p>Your employee portal account has been created. Use the credentials below to sign in:</p>
          <div style="background-color: #F3F4F6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Email:</strong> ${employeeEmail}</p>
            <p style="margin: 4px 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
          </div>
          <a href="${portalUrl || process.env.PORTAL_URL || '#'}"
             style="display:inline-block; background-color:#4F46E5; color:#fff; padding:12px 20px; text-decoration:none; border-radius:6px; margin: 12px 0;">
            Open Portal
          </a>
          <p style="color:#6B7280; font-size: 13px; margin-top: 20px;">Please change your password after first login.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Welcome email failed:', error.message);
    return { success: false, error: error.message };
  }
};

export const sendPasswordResetEmail = async (employeeEmail, data) => {
  const { name, resetUrl } = data;

  if (!employeeEmail || !validateEmail(employeeEmail)) {
    return {
      success: false,
      error: 'Invalid email address'
    };
  }

  if (!resetUrl) {
    return {
      success: false,
      error: 'Reset URL is required'
    };
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@payrollpro.com',
      to: employeeEmail,
      subject: 'Password Reset Request - PayrollPro',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Password Reset Request</h2>
          
          <p>Hi ${name},</p>
          
          <p>We received a request to reset your password for your PayrollPro account.</p>
          
          <p>Click the button below to reset your password:</p>
          
          <a href="${resetUrl}" 
             style="display: inline-block; background-color: #4F46E5; color: white; padding: 14px 28px; 
                    text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold;">
            Reset Password
          </a>
          
          <p style="color: #6B7280; font-size: 14px; margin-top: 20px;">
            This link will expire in 1 hour for security reasons.
          </p>
          
          <p style="color: #6B7280; font-size: 14px;">
            If you didn't request a password reset, please ignore this email or contact support if you have concerns.
          </p>
          
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
          
          <p style="color: #9CA3AF; font-size: 12px;">
            This is an automated email from PayrollPro. Please do not reply to this email.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    console.error('Password reset email failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

export const testEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email service is ready');
    return true;
  } catch (error) {
    console.error('❌ Email service error:', error.message);
    return false;
  }
};