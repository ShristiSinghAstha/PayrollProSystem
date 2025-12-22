import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency, formatMonth } from '@/utils/formatters';

const PayslipPreview = ({ payslip, onDownload }) => {
  if (!payslip) return null;

  const { employeeId, month, earnings = {}, deductions = {}, netSalary, status } = payslip;

  return (
    <Card className="bg-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">{formatMonth(month)}</p>
          <h4 className="text-xl font-semibold text-gray-900">
            {employeeId?.personalInfo?.firstName} {employeeId?.personalInfo?.lastName}
          </h4>
          <p className="text-sm text-gray-500">{employeeId?.employment?.department}</p>
        </div>
        <span className={cn(
          "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold",
          status === 'Paid'
            ? "bg-green-50 text-green-700 border-green-200"
            : "bg-yellow-50 text-yellow-700 border-yellow-200"
        )}>
          {status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding="sm" className="bg-gray-50">
          <p className="text-xs text-gray-500">Gross Earnings</p>
          <p className="text-lg font-semibold text-gray-900">{formatCurrency(earnings.gross)}</p>
        </Card>
        <Card padding="sm" className="bg-gray-50">
          <p className="text-xs text-gray-500">Total Deductions</p>
          <p className="text-lg font-semibold text-gray-900">{formatCurrency(deductions.total)}</p>
        </Card>
        <Card padding="sm" className="bg-success-50 border-success-200">
          <p className="text-xs text-success-600">Net Salary</p>
          <p className="text-2xl font-bold text-success-700">{formatCurrency(netSalary)}</p>
        </Card>
      </div>

      {onDownload && (
        <div className="mt-4 flex justify-end">
          <Button variant="primary" onClick={() => onDownload(payslip)}>
            Download PDF
          </Button>
        </div>
      )}
    </Card>
  );
};

export default PayslipPreview;
