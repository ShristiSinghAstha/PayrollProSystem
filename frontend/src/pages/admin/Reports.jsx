import Card from '@/components/common/Card';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PageContainer from '@/components/layout/PageContainer';
import { usePayrollStats } from '@/hooks/usePayroll';
import { formatCurrency } from '@/utils/formatters';

const Reports = () => {
  const { stats, loading } = usePayrollStats();

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600">Monthly payout summaries</p>
      </div>

      {loading ? (
        <div className="py-10 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <p className="text-xs text-gray-500 uppercase">Current Month Gross</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {formatCurrency(stats?.currentMonthGross || 0)}
            </p>
          </Card>
          <Card>
            <p className="text-xs text-gray-500 uppercase">Current Month Deductions</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {formatCurrency(stats?.currentMonthDeductions || 0)}
            </p>
          </Card>
          <Card className="bg-success-50 border-success-200">
            <p className="text-xs text-success-700 uppercase">Net Payout</p>
            <p className="text-2xl font-bold text-success-800 mt-2">
              {formatCurrency(stats?.currentMonthNet || 0)}
            </p>
          </Card>
        </div>
      )}
    </PageContainer>
  );
};

export default Reports;
