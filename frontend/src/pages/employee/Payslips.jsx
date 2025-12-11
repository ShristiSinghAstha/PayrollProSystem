import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import PageContainer from '@/components/layout/PageContainer';
import { usePayslips } from '@/hooks/usePayslips';
import { downloadPayslip } from '@/api/payslipApi';
import { formatCurrency, formatMonth } from '@/utils/formatters';
import toast from 'react-hot-toast';

const Payslips = () => {
  const { payslips, loading, refetch } = usePayslips();

  const handleDownload = async (payslip) => {
    try {
      const response = await downloadPayslip(payslip._id);
      const url = response.data?.data?.url || response.data?.url;
      if (url) {
        window.open(url, '_blank');
        toast.success('Payslip downloaded');
      } else {
        toast.error('Download link not available');
      }
    } catch (err) {
      toast.error('Failed to download payslip');
    }
  };

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Payslips</h1>
        <p className="text-gray-600">Download your monthly payslips</p>
      </div>

      <Card>
        {loading ? (
          <div className="py-10 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : payslips.length === 0 ? (
          <EmptyState title="No payslips yet" description="Your payslips will appear here once generated." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gross</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payslips.map((payslip) => (
                  <tr key={payslip._id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatMonth(payslip.month)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(payslip.earnings?.gross)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-semibold">{formatCurrency(payslip.netSalary)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="primary" onClick={() => handleDownload(payslip)}>
                        Download
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageContainer>
  );
};

export default Payslips;
