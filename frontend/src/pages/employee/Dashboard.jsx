import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import PageContainer from '@/components/layout/PageContainer';
import { useEmployeeDashboard } from '@/hooks/useEmployeeDashboard';
import { formatCurrency, formatMonth } from '@/utils/formatters';
import { useNavigate } from 'react-router-dom';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error } = useEmployeeDashboard();

  const currentPayroll = data?.currentPayroll;
  const recentPayslips = data?.recentPayslips || [];
  const unreadNotifications = data?.unreadNotifications || 0;

  const getStatusVariant = (status) => {
    const variants = {
      Pending: 'warning',
      Approved: 'info',
      Paid: 'success',
      Failed: 'error'
    };
    return variants[status] || 'default';
  };

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {user?.personalInfo?.firstName || 'User'}
        </h1>
        <p className="text-gray-600">Here is your payroll overview</p>
      </div>

      {loading ? (
        <div className="py-10 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <Card>
          <EmptyState
            title="Unable to load dashboard"
            description={error}
            action={
              <Button variant="primary" onClick={() => window.location.reload()}>
                Retry
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Month Salary Card */}
          <Card className="lg:col-span-2">
            <p className="text-xs text-gray-500 uppercase">Current Month Salary</p>
            {currentPayroll ? (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xl font-bold text-gray-900">{formatMonth(currentPayroll.month)}</p>
                    <p className="text-sm text-gray-600">Net Salary: {formatCurrency(currentPayroll.netSalary)}</p>
                  </div>
                  <Badge variant={getStatusVariant(currentPayroll.status)}>
                    {currentPayroll.status}
                  </Badge>
                </div>
                
                {currentPayroll.status === 'Paid' && currentPayroll.payslipGenerated && (
                  <Button variant="primary" onClick={() => navigate('/employee/payslips')}>
                    Download Payslip
                  </Button>
                )}
                
                {currentPayroll.status === 'Pending' && (
                  <p className="text-sm text-gray-500 mt-2">
                    ⏳ Payroll is being processed. You'll be notified once completed.
                  </p>
                )}
                
                {currentPayroll.status === 'Approved' && (
                  <p className="text-sm text-gray-500 mt-2">
                    ✓ Payroll approved. Payment will be processed soon.
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-2">
                <p className="text-gray-600">No payroll processed yet for this month.</p>
                <p className="text-sm text-gray-500 mt-1">Your payslip will appear here once it's processed.</p>
              </div>
            )}
          </Card>

          {/* Notifications Card */}
          <Card>
            <p className="text-xs text-gray-500 uppercase">Notifications</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{unreadNotifications}</p>
            <p className="text-sm text-gray-600">Unread alerts</p>
            <Button 
              variant="secondary" 
              className="mt-3 w-full" 
              onClick={() => navigate('/employee/notifications')}
            >
              View Notifications
            </Button>
          </Card>

          {/* Recent Payslips Card */}
          <Card className="lg:col-span-3" title="Recent Payslips">
            {recentPayslips.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No payslips available yet</p>
                <p className="text-sm text-gray-500 mt-1">Your payslips will appear here once generated</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentPayslips.map((payslip) => (
                  <div key={payslip._id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{formatMonth(payslip.month)}</p>
                      <p className="text-sm text-gray-600">{formatCurrency(payslip.netSalary)}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => navigate('/employee/payslips')}
                    >
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </PageContainer>
  );
};

export default EmployeeDashboard;