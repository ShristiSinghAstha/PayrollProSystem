import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
                <span className={cn(
                    "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold",
                    payroll.status === 'Pending' && "bg-yellow-50 text-yellow-700 border-yellow-200",
                    payroll.status === 'Approved' && "bg-blue-50 text-blue-700 border-blue-200",
                    payroll.status === 'Paid' && "bg-green-50 text-green-700 border-green-200",
                    payroll.status === 'Failed' && "bg-red-50 text-red-700 border-red-200",
                )}>
                    {payroll.status}
                </span>
                {payroll.status === 'Paid' && payroll.notificationSent && (
                    <p className="text-xs text-green-600 mt-1">✓ Email sent</p>
                )}
                {payroll.status === 'Paid' && !payroll.notificationSent && (
                    <p className="text-xs text-red-600 mt-1">✗ Email failed</p>
                )}
            </td>
            <td className="px-4 py-3 text-sm text-gray-500">{payroll.paidAt ? formatDate(payroll.paidAt) : '-'}</td>
            <td className="px-4 py-3 text-sm text-right">
                <div className="flex items-center justify-end gap-2">
                    {onViewBreakdown && (
                        <Button size="sm" variant="outline" onClick={() => onViewBreakdown(payroll)}>
                            View
                        </Button>
                    )}
                    {onAddAdjustment && payroll.status === 'Pending' && (
                        <Button size="sm" variant="outline" onClick={() => onAddAdjustment(payroll)}>
                            Adjustment
                        </Button>
                    )}
                    {onApprove && payroll.status === 'Pending' && (
                        <Button size="sm" onClick={() => onApprove(payroll)}>
                            Approve
                        </Button>
                    )}
                    {onPay && payroll.status === 'Approved' && (
                        <Button size="sm" onClick={() => onPay(payroll)} className="bg-green-600 hover:bg-green-700 text-white">
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
                </div>
            </td>
        </tr>
    );
};

export default PayrollRow;