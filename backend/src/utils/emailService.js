import nodemailer from 'nodemailer';

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
    const { month, netSalary } = payrollData;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@payrollpro.com',
      to: employeeEmail,
      subject: `Payslip for ${month} - PayrollPro`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Your Payslip is Ready!</h2>
          
          <p>Dear ${employeeName},</p>
          
          <p>Your salary for <strong>${month}</strong> has been processed successfully.</p>
          
          <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1F2937;">Payment Summary</h3>
            <p style="font-size: 24px; color: #059669; font-weight: bold; margin: 10px 0;">
              ${formatCurrency(netSalary)}
            </p>
            <p style="color: #6B7280; font-size: 14px;">Net Salary Credited</p>
          </div>
          
          <p>You can download your detailed payslip using the link below:</p>
          
          <a href="${payslipUrl}" 
             style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Download Payslip
          </a>
          
          <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
            If you have any questions about your payslip, please contact the HR department.
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