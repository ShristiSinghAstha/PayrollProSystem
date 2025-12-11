import { useState, useEffect } from 'react';
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
import { getMonthlyPayrollSummary } from '@/api/payrollApi';
import { formatMonth, formatDate } from '@/utils/formatters';

const PayrollList = () => {
    const [filters] = useState({});
    const [summaries, setSummaries] = useState([]);
    const [showProcessModal, setShowProcessModal] = useState(false);
    const [processForm, setProcessForm] = useState({
        month: new Date().toISOString().slice(0, 7), // "YYYY-MM"
    });

    const navigate = useNavigate();
    const { payrolls, loading, refetch } = usePayroll(filters);
    const { process, loading: processing } = useProcessPayroll();

    useEffect(() => {
        const fetchSummaries = async () => {
            try {
                const res = await getMonthlyPayrollSummary();
                setSummaries(res.data.data);
            } catch (error) {
                console.error('Failed to fetch summaries:', error);
            }
        };
        fetchSummaries();
    }, []);

    const columns = [
        { header: 'Month', key: 'month', render: (value) => formatMonth(value) },
        { header: 'Employees', key: 'totalEmployees' },
        {
            header: 'Status',
            key: 'status',
            render: (_, row) => `Pending: ${row.pending}, Paid: ${row.paid}`
        },
        { header: 'Updated', key: 'updatedAt', render: (value) => formatDate(value) },
    ];

    const handleProcess = async () => {
        const [year, monthNum] = processForm.month.split('-');
        await process({
            month: parseInt(monthNum, 10),
            year: parseInt(year, 10)
        });
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
                ) : summaries.length === 0 ? (
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
                        data={summaries}
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
                        label="Select Month"
                        type="month"
                        value={processForm.month}
                        onChange={(e) => setProcessForm({ month: e.target.value })}
                        max={new Date().toISOString().slice(0, 7)}
                    />
                    <p className="text-sm text-gray-600">
                        This will fetch all active employees and create payroll records for <strong>{formatMonth(processForm.month)}</strong>.
                    </p>
                </div>
            </Modal>
        </PageContainer>
    );
};

export default PayrollList;