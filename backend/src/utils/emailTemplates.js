// No imports needed - dayjs is handled in emailService.js

/**
 * Generate professional HTML email for payslip delivery
 * Uses inline CSS for maximum email client compatibility
 */
const generatePayslipEmail = (data) => {
  const {
    employeeName,
    employeeId,
    month,
    netSalary,
    grossSalary,
    deductions,
    transactionId,
    paidDate,
    payslipUrl,
    bankName,
    accountNumber
  } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payslip for ${month}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 40px 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">PayrollPro</h1>
              <p style="margin: 8px 0 0; color: #93c5fd; font-size: 14px; font-weight: 500;">Professional Payroll Management System</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              
              <!-- Greeting -->
              <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 24px; font-weight: 600;">Salary Processed Successfully! 🎉</h2>
              <p style="margin: 0 0 8px; color: #475569; font-size: 16px; line-height: 1.6;">Dear <strong>${employeeName}</strong>,</p>
              <p style="margin: 0 0 24px; color: #475569; font-size: 16px; line-height: 1.6;">Your salary for <strong>${month}</strong> has been processed and credited to your account.</p>

              <!-- Payment Summary Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border-radius: 8px; margin-bottom: 30px; overflow: hidden; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 24px;">
                    <table width="100%" cellpadding="8" cellspacing="0" border="0">
                      <tr>
                        <td style="color: #64748b; font-size: 14px; font-weight: 500; padding-bottom: 8px;">Employee ID</td>
                        <td style="color: #0f172a; font-size: 14px; font-weight: 600; text-align: right; padding-bottom: 8px;">${employeeId}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-size: 14px; font-weight: 500; padding-bottom: 8px;">Gross Salary</td>
                        <td style="color: #0f172a; font-size: 14px; font-weight: 600; text-align: right; padding-bottom: 8px;">₹${grossSalary.toLocaleString('en-IN')}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-size: 14px; font-weight: 500; padding-bottom: 8px;">Total Deductions</td>
                        <td style="color: #dc2626; font-size: 14px; font-weight: 600; text-align: right; padding-bottom: 8px;">-₹${deductions.toLocaleString('en-IN')}</td>
                      </tr>
                      <tr style="border-top: 2px solid #cbd5e1;">
                        <td style="color: #0f172a; font-size: 16px; font-weight: 700; padding-top: 12px;">Net Salary Credited</td>
                        <td style="color: #10b981; font-size: 22px; font-weight: 700; text-align: right; padding-top: 12px;">₹${netSalary.toLocaleString('en-IN')}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Transaction Details -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding-bottom: 16px;">
                    <p style="margin: 0; color: #0f172a; font-size: 16px; font-weight: 600;">Payment Details</p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table width="100%" cellpadding="8" cellspacing="0" border="0" style="border: 1px solid #e2e8f0; border-radius: 6px;">
                      <tr style="background-color: #f8fafc;">
                        <td style="color: #475569; font-size: 13px; width: 45%;">Transaction ID:</td>
                        <td style="color: #0f172a; font-size: 13px; font-weight: 600; font-family: 'Courier New', monospace;">${transactionId}</td>
                      </tr>
                      <tr>
                        <td style="color: #475569; font-size: 13px;">Payment Date:</td>
                        <td style="color: #0f172a; font-size: 13px; font-weight: 600;">${paidDate}</td>
                      </tr>
                      <tr style="background-color: #f8fafc;">
                        <td style="color: #475569; font-size: 13px;">Bank Account:</td>
                        <td style="color: #0f172a; font-size: 13px; font-weight: 600;">${bankName} - ****${accountNumber}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Download Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <a href="${payslipUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);">
                      📄 Download Payslip PDF
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; border-radius: 6px;">
                    <p style="margin: 0; color: #1e40af; font-size: 13px; line-height: 1.6;">
                      <strong>💡 Note:</strong> Please keep this payslip for your records. If you have any questions or notice any discrepancies, please contact the HR department immediately.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 32px 40px; border-top: 1px solid #e2e8f0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 8px; color: #64748b; font-size: 13px;">
                      This is an automated email. Please do not reply to this message.
                    </p>
                    <p style="margin: 0 0 16px; color: #64748b; font-size: 13px;">
                      For queries, contact HR at <a href="mailto:hr@company.com" style="color: #2563eb; text-decoration: none;">hr@company.com</a>
                    </p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                      © ${new Date().getFullYear()} PayrollPro. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

/**
 * Generate professional HTML email for OTP delivery
 */
export const generateOTPEmail = (otp, userName) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login OTP - PayrollPro</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                PayrollPro
              </h1>
              <p style="margin: 8px 0 0; color: #e0e7ff; font-size: 14px; font-weight: 500;">
                Secure Login Verification
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px; color: #18181b; font-size: 16px; line-height: 1.5;">
                Hello <strong>${userName || 'User'}</strong>,
              </p>
              
              <p style="margin: 0 0 32px; color: #52525b; font-size: 15px; line-height: 1.6;">
                Your One-Time Password (OTP) for logging into PayrollPro is:
              </p>

              <!-- OTP Display -->
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 32px;">
                <div style="font-size: 48px; font-weight: 700; color: #ffffff; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${otp}
                </div>
                <p style="margin: 16px 0 0; color: #e0e7ff; font-size: 13px;">
                  This OTP is valid for 5 minutes
                </p>
              </div>

              <!-- Instructions -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                  <strong>⚠️ Security Notice:</strong><br>
                  Never share this OTP with anyone. PayrollPro staff will never ask for your OTP.
                </p>
              </div>

              <p style="margin: 0 0 16px; color: #52525b; font-size: 14px; line-height: 1.6;">
                If you didn't request this OTP, please ignore this email or contact your administrator immediately.
              </p>

              <p style="margin: 0; color: #71717a; font-size: 13px; line-height: 1.5;">
                This is an automated email. Please do not reply to this message.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #fafafa; border-radius: 0 0 12px 12px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; color: #a1a1aa; font-size: 12px; text-align: center; line-height: 1.5;">
                © ${new Date().getFullYear()} PayrollPro. All rights reserved.<br>
                Professional Payroll Management System
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

export { generatePayslipEmail };
