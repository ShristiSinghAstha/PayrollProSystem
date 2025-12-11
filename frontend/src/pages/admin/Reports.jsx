import { useState } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PageContainer from '@/components/layout/PageContainer';
import { usePayrollStats } from '@/hooks/usePayroll';
import { useEmployeeStats } from '@/hooks/useEmployees';
import { formatCurrency, formatMonth } from '@/utils/formatters';

const Reports = () => {
  const { stats: payrollStats, loading: payrollLoading } = usePayrollStats();
  const { stats: employeeStats, loading: employeeLoading } = useEmployeeStats();
  const [selectedMonth, setSelectedMonth] = useState(payrollStats?.currentMonth || '');

  const loading = payrollLoading || employeeLoading;

  const handleExportCSV = () => {
    if (!payrollStats) return;

    const csvData = [
      ['Month', 'Employees', 'Gross', 'Deductions', 'Net'],
      ...payrollStats.byMonth.map(m => [
        m._id,
        m.totalEmployees,
        m.totalGross,
        m.totalDeductions,
        m.totalNet
      ])
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payroll-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Monthly payout summaries and department analytics</p>
        </div>
        <Button variant="primary" onClick={handleExportCSV}>
          📥 Export CSV
        </Button>
      </div>

      {loading ? (
        <div className="py-10 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <p className="text-xs text-gray-500 uppercase">Current Month</p>
              <p className="text-xl font-bold text-gray-900 mt-2">
                {formatMonth(payrollStats?.currentMonth || '')}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {payrollStats?.employeesProcessed || 0} employees
              </p>
            </Card>
            <Card>
              <p className="text-xs text-gray-500 uppercase">Gross Payout</p>
              <p className="text-xl font-bold text-gray-900 mt-2">
                {formatCurrency(payrollStats?.currentMonthGross || 0)}
              </p>
            </Card>
            <Card>
              <p className="text-xs text-gray-500 uppercase">Deductions</p>
              <p className="text-xl font-bold text-gray-900 mt-2">
                {formatCurrency(payrollStats?.currentMonthDeductions || 0)}
              </p>
            </Card>
            <Card className="bg-success-50 border-success-200">
              <p className="text-xs text-success-700 uppercase">Net Payout</p>
              <p className="text-2xl font-bold text-success-800 mt-2">
                {formatCurrency(payrollStats?.currentMonthNet || 0)}
              </p>
            </Card>
          </div>

          {/* Status Breakdown */}
          <Card title="Payroll Status" className="mb-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-3xl font-bold text-yellow-700">
                  {payrollStats?.pending || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">Pending</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-700">
                  {payrollStats?.approved || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">Approved</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-700">
                  {payrollStats?.paid || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">Paid</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-3xl font-bold text-red-700">
                  {payrollStats?.failed || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">Failed</p>
              </div>
            </div>
          </Card>

          {/* Monthly History */}
          <Card title="Monthly Payroll History" className="mb-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employees</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gross</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payrollStats?.byMonth?.map((month) => (
                    <tr key={month._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {formatMonth(month._id)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{month.totalEmployees}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(month.totalGross)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(month.totalDeductions)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        {formatCurrency(month.totalNet)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Department-wise Cost Analysis */}
          <Card title="Department-wise Employee Distribution">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {employeeStats?.byDepartment?.map((dept) => (
                <div key={dept._id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">{dept._id}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{dept.count}</p>
                  <p className="text-xs text-gray-500 mt-1">employees</p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </PageContainer>
  );
};

export default Reports;