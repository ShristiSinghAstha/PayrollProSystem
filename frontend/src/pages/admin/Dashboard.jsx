import Card from '@/components/common/Card';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PageContainer from '@/components/layout/PageContainer';
import Badge from '@/components/common/Badge';
import { useEmployeeStats } from '@/hooks/useEmployees';
import { usePayrollStats } from '@/hooks/usePayroll';
import { formatCurrency } from '@/utils/formatters';
import { Link } from 'react-router-dom';

const StatCard = ({ label, value, hint, tone = 'default' }) => {
  const tones = {
    default: 'border-gray-200',
    success: 'border-success-200 bg-success-50',
    warning: 'border-warning-200 bg-warning-50',
    danger: 'border-error-200 bg-error-50',
  };

  return (
    <Card padding="sm" className={`border ${tones[tone]}`}>
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </Card>
  );
};

const AdminDashboard = () => {
  const { stats: employeeStats, loading: employeeLoading } = useEmployeeStats();
  const { stats: payrollStats, loading: payrollLoading } = usePayrollStats({ month: undefined });

  const loading = employeeLoading || payrollLoading;

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Quick overview of employees and payroll</p>
        </div>
        <Link
          to="/admin/payroll"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Process Payroll
        </Link>
      </div>

      {loading ? (
        <div className="py-10 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Active Employees" value={employeeStats?.activeEmployees ?? 0} />
            <StatCard
              label="Pending Payrolls"
              value={payrollStats?.pending ?? 0}
              tone={payrollStats?.pending ? 'warning' : 'default'}
            />
            <StatCard
              label="Total Net (Current Month)"
              value={formatCurrency(payrollStats?.currentMonthNet || 0)}
              hint={payrollStats?.currentMonth}
            />
            <StatCard
              label="Failed Payments"
              value={payrollStats?.failed ?? 0}
              tone={payrollStats?.failed ? 'danger' : 'default'}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card title="Pending Actions">
              <div className="space-y-3">
                <div className="p-3 rounded-lg border border-warning-200 bg-warning-50">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">Monthly payroll</p>
                    <Badge variant="warning">Pending</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {payrollStats?.pending
                      ? 'Payroll awaiting approval'
                      : 'All payrolls approved'}
                  </p>
                  <Link to="/admin/payroll" className="text-sm text-primary-700 hover:underline mt-2 inline-block">
                    Review payroll
                  </Link>
                </div>
                <div className="p-3 rounded-lg border border-primary-200 bg-primary-50">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">New hires</p>
                    <Badge variant="info">Action</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Add onboarding details for new employees.</p>
                  <Link to="/admin/employees/new" className="text-sm text-primary-700 hover:underline mt-2 inline-block">
                    Add employee
                  </Link>
                </div>
              </div>
            </Card>

            <Card title="Latest Payroll Snapshot" className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-500 uppercase">Gross Payout</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(payrollStats?.currentMonthGross || 0)}</p>
                </div>
                <div className="p-3 border rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-500 uppercase">Deductions</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(payrollStats?.currentMonthDeductions || 0)}</p>
                </div>
                <div className="p-3 border rounded-lg bg-success-50 border-success-200">
                  <p className="text-xs text-success-700 uppercase">Net Pay</p>
                  <p className="text-2xl font-bold text-success-800">{formatCurrency(payrollStats?.currentMonthNet || 0)}</p>
                </div>
                <div className="p-3 border rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-500 uppercase">Employees Processed</p>
                  <p className="text-xl font-bold text-gray-900">{payrollStats?.employeesProcessed ?? 0}</p>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </PageContainer>
  );
};

export default AdminDashboard;
