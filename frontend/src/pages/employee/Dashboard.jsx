import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PageContainer from '@/components/layout/PageContainer';
import { usePayslips } from '@/hooks/usePayslips';
import { useNotifications } from '@/hooks/useNotifications';
import { formatCurrency, formatMonth } from '@/utils/formatters';
import { useNavigate } from 'react-router-dom';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { payslips, loading } = usePayslips({ limit: 3 });
  const { unreadCount } = useNotifications();

  const currentPayslip = payslips?.[0];

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.personalInfo?.firstName}</h1>
        <p className="text-gray-600">Here is your payroll overview</p>
      </div>

      {loading ? (
        <div className="py-10 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <p className="text-xs text-gray-500 uppercase">Current Month Salary</p>
            {currentPayslip ? (
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <p className="text-xl font-bold text-gray-900">{formatMonth(currentPayslip.month)}</p>
                  <p className="text-sm text-gray-600">Net Salary: {formatCurrency(currentPayslip.netSalary)}</p>
                  <p className="text-sm text-gray-600">Status: {currentPayslip.status}</p>
                </div>
                <Button variant="primary" onClick={() => navigate('/employee/payslips')}>
                  View Payslip
                </Button>
              </div>
            ) : (
              <p className="text-gray-600 mt-2">No payslip available yet.</p>
            )}
          </Card>

          <Card>
            <p className="text-xs text-gray-500 uppercase">Notifications</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{unreadCount}</p>
            <p className="text-sm text-gray-600">Unread alerts</p>
            <Button variant="secondary" className="mt-3" onClick={() => navigate('/employee/notifications')}>
              View Notifications
            </Button>
          </Card>

          <Card className="lg:col-span-3" title="Recent Payslips">
            <div className="divide-y divide-gray-100">
              {payslips.map((p) => (
                <div key={p._id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{formatMonth(p.month)}</p>
                    <p className="text-sm text-gray-600">{formatCurrency(p.netSalary)}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => navigate('/employee/payslips')}>
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </PageContainer>
  );
};

export default EmployeeDashboard;
