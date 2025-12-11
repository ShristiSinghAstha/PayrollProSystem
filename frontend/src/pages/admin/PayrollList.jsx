import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Table from '@/components/common/Table';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import PageContainer from '@/components/layout/PageContainer';
import { usePayroll } from '@/hooks/usePayroll';
import { useProcessPayroll } from '@/hooks/useProcessPayroll';
import { formatMonth } from '@/utils/formatters';

const PayrollList = () => {
  const [filters] = useState({});
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processForm, setProcessForm] = useState({
    month: new Date().toISOString().slice(0, 7),
    year: new Date().getFullYear(),
  });

  const navigate = useNavigate();
  const { payrolls, loading, refetch } = usePayroll(filters);
  const { process, loading: processing } = useProcessPayroll();

  const columns = [
    {
      header: 'Month',
      key: 'month',
      render: (value) => formatMonth(value),
    },
    {
      header: 'Employees',
      key: 'employeeCount',
    },
    {
      header: 'Status',
      key: 'status',
    },
    {
      header: 'Updated',
      key: 'updatedAt',
    },
  ];

  const handleProcess = async () => {
    await process(processForm);
    setShowProcessModal(false);
    refetch();
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
          <p className="text-gray-600">Manage monthly payroll cycles</p>
        </div>
        <Button variant="primary" onClick={() => setShowProcessModal(true)}>
          Process New Payroll
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="py-8 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : payrolls.length === 0 ? (
          <EmptyState
            title="No payrolls yet"
            description="Process the first payroll to see records here."
            action={
              <Button variant="primary" onClick={() => setShowProcessModal(true)}>
                Process Payroll
              </Button>
            }
          />
        ) : (
          <Table
            columns={columns}
            data={payrolls}
            onRowClick={(row) => navigate(`/admin/payroll/${row.month}`)}
          />
        )}
      </Card>

      <Modal
        isOpen={showProcessModal}
        onClose={() => setShowProcessModal(false)}
        title="Process New Payroll"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowProcessModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={processing} onClick={handleProcess}>
              {processing ? 'Processing...' : 'Process Payroll'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Month (YYYY-MM)"
            value={processForm.month}
            onChange={(e) => setProcessForm((prev) => ({ ...prev, month: e.target.value }))}
          />
          <Input
            label="Year"
            type="number"
            value={processForm.year}
            onChange={(e) => setProcessForm((prev) => ({ ...prev, year: Number(e.target.value) }))}
          />
          <p className="text-sm text-gray-600">
            This will fetch all active employees and create payroll records for the selected month.
          </p>
        </div>
      </Modal>
    </PageContainer>
  );
};

export default PayrollList;
