import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import { formatCurrency, formatDate } from '@/utils/formatters';

const PayrollRow = ({ payroll, onViewBreakdown, onAddAdjustment, onApprove, onPay, onResendEmail }) => {
    const statusVariant = {
        Pending: 'warning',
        Approved: 'info',
        Paid: 'success',
        Failed: 'error',
        Cancelled: 'default',
    }[payroll.status] || 'default';

    return (
        <tr className="border-b border-gray-100">
            <td className="px-4 py-3 text-sm text-gray-900">
                {payroll.employeeId?.personalInfo?.firstName} {payroll.employeeId?.personalInfo?.lastName}
                <p className="text-xs text-gray-500">{payroll.employeeId?.employment?.department}</p>
            </td>
            <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(payroll.earnings?.gross)}</td>
            <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(payroll.deductions?.total)}</td>
            <td className="px-4 py-3 text-sm text-gray-900 font-semibold">{formatCurrency(payroll.netSalary)}</td>
            <td className="px-4 py-3 text-sm">
                <Badge variant={statusVariant}>{payroll.status}</Badge>
                {payroll.status === 'Paid' && payroll.notificationSent && (
                    <p className="text-xs text-green-600 mt-1">✓ Email sent</p>
                )}
                {payroll.status === 'Paid' && !payroll.notificationSent && (
                    <p className="text-xs text-red-600 mt-1">✗ Email failed</p>
                )}
            </td>
            <td className="px-4 py-3 text-sm text-gray-500">{payroll.paidAt ? formatDate(payroll.paidAt) : '-'}</td>
            <td className="px-4 py-3 text-sm text-right space-x-2">
                {onViewBreakdown && (
                    <Button size="sm" variant="ghost" onClick={() => onViewBreakdown(payroll)}>
                        View
                    </Button>
                )}
                {onAddAdjustment && payroll.status === 'Pending' && (
                    <Button size="sm" variant="secondary" onClick={() => onAddAdjustment(payroll)}>
                        Adjustment
                    </Button>
                )}
                {onApprove && payroll.status === 'Pending' && (
                    <Button size="sm" variant="primary" onClick={() => onApprove(payroll)}>
                        Approve
                    </Button>
                )}
                {onPay && payroll.status === 'Approved' && (
                    <Button size="sm" variant="success" onClick={() => onPay(payroll)}>
                        Mark Paid
                    </Button>
                )}
                {onResendEmail && payroll.status === 'Paid' && payroll.payslipGenerated && (
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => onResendEmail(payroll)}
                        title="Resend payslip email"
                    >
                        📧 Resend
                    </Button>
                )}
            </td>
        </tr>
    );
};

export default PayrollRow;