import { formatCurrency } from '@/utils/formatters';

const SalaryBreakdown = ({ earnings = {}, deductions = {}, adjustments = [], netSalary }) => {
    const breakdownRows = [
        { label: 'Basic', value: earnings.basic },
        { label: 'HRA', value: earnings.hra },
        { label: 'DA', value: earnings.da },
        { label: 'Special Allowance', value: earnings.specialAllowance },
        { label: 'Other Allowances', value: earnings.otherAllowances },
    ];

    const deductionRows = [
        { label: 'PF', value: deductions.pf },
        { label: 'Professional Tax', value: deductions.professionalTax },
        { label: 'ESI', value: deductions.esi },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-2 bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <p className="font-semibold text-gray-900">Earnings</p>
                    <p className="text-sm text-gray-500">Gross: {formatCurrency(earnings.gross)}</p>
                </div>
                <div className="divide-y divide-gray-100">
                    {breakdownRows.map((row) => (
                        <div key={row.label} className="flex items-center justify-between px-4 py-3">
                            <span className="text-sm text-gray-700">{row.label}</span>
                            <span className="text-sm font-medium text-gray-900">{formatCurrency(row.value)}</span>
                        </div>
                    ))}
                </div>
            </div>

            {adjustments && adjustments.length > 0 && (
                <div className="md:col-span-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="font-semibold text-blue-900 mb-2">Adjustments</p>
                    <div className="space-y-2">
                        {adjustments.map((adj, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                                <span className="text-gray-700">
                                    {adj.type}: {adj.description}
                                </span>
                                <span className={`font-medium ${['Bonus', 'Allowance', 'Reimbursement'].includes(adj.type)
                                    ? 'text-green-700'
                                    : 'text-red-700'
                                    }`}>
                                    {['Bonus', 'Allowance', 'Reimbursement'].includes(adj.type) ? '+' : '-'}
                                    {formatCurrency(adj.amount)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <p className="font-semibold text-gray-900">Deductions</p>
                    <p className="text-sm text-gray-500">Total: {formatCurrency(deductions.total)}</p>
                </div>
                <div className="divide-y divide-gray-100">
                    {deductionRows.map((row) => (
                        <div key={row.label} className="flex items-center justify-between px-4 py-3">
                            <span className="text-sm text-gray-700">{row.label}</span>
                            <span className="text-sm font-medium text-gray-900">{formatCurrency(row.value)}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="md:col-span-3 bg-success-50 border border-success-200 rounded-lg p-4 flex items-center justify-between">
                <div>
                    <p className="text-xs text-success-700 uppercase tracking-wide">Net Salary</p>
                    <p className="text-2xl font-bold text-success-800">{formatCurrency(netSalary)}</p>
                </div>
                <div className="text-right text-sm text-gray-600">
                    <p>Earnings - Deductions</p>
                </div>
            </div>
        </div>
    );
};

export default SalaryBreakdown;
