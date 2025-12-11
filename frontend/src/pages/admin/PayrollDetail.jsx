import { useState } from 'react';
import { useParams } from 'react-router-dom';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import PageContainer from '@/components/layout/PageContainer';
import PayrollRow from '@/components/domain/PayrollRow';
import SalaryBreakdown from '@/components/domain/SalaryBreakdown';
import { usePayrollByMonth } from '@/hooks/usePayroll';
import { approvePayroll, markAsPaid, addAdjustment } from '@/api/payrollApi';
import { resendPayslipEmail } from '@/api/payslipApi';
import { useProcessPayroll } from '@/hooks/useProcessPayroll';
import { formatMonth, formatCurrency } from '@/utils/formatters';
import toast from 'react-hot-toast';

const PayrollDetail = () => {
    const { month } = useParams();
    const { data, loading, refetch } = usePayrollByMonth(month);
    const [selected, setSelected] = useState(null);
    const [showAdjustment, setShowAdjustment] = useState(false);
    const [adjustmentForm, setAdjustmentForm] = useState({
        type: 'Bonus',
        amount: 0,
        description: '',
    });

    const { approveAll, payAll, loading: bulkLoading } = useProcessPayroll();

    const handleBulkApprove = async () => {
        try {
            await approveAll(month);
            refetch();
        } catch (error) {
            console.error('Bulk approve failed:', error);
        }
    };

    const handleBulkPay = async () => {
        try {
            await payAll(month);
            refetch();
        } catch (error) {
            console.error('Bulk pay failed:', error);
        }
    };

    const handleApprove = async (payroll) => {
        try {
            await approvePayroll(payroll._id);
            toast.success('Payroll approved');
            refetch();
        } catch (error) {
            toast.error('Failed to approve payroll');
        }
    };

    const handlePay = async (payroll) => {
        try {
            await markAsPaid(payroll._id);
            toast.success('Marked as paid');
            refetch();
        } catch (error) {
            toast.error('Failed to mark as paid');
        }
    };

    const handleResendEmail = async (payroll) => {
        try {
            await resendPayslipEmail(payroll._id);
            toast.success('Payslip email resent successfully');
        } catch (error) {
            toast.error('Failed to resend email');
        }
    };

    const handleAdjustment = async () => {
        if (!selected) return;
        
        if (!adjustmentForm.description.trim()) {
            toast.error('Description is required');
            return;
        }

        if (adjustmentForm.amount <= 0) {
            toast.error('Amount must be greater than 0');
            return;
        }

        try {
            await addAdjustment(selected._id, adjustmentForm);
            toast.success('Adjustment added');
            setShowAdjustment(false);
            setSelected(null);
            setAdjustmentForm({ type: 'Bonus', amount: 0, description: '' });
            refetch();
        } catch (error) {
            toast.error('Failed to add adjustment');
        }
    };

    if (loading) {
        return (
            <div className="py-10 flex justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!data) {
        return (
            <EmptyState
                title="No payroll found"
                description="Process payroll first to view details"
            />
        );
    }

    const { summary, payrolls } = data;

    return (
        <PageContainer>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Payroll: {formatMonth(month)}</h1>
                    <p className="text-gray-600">Review payroll before approval and payment</p>
                </div>
                <div className="flex gap-2">
                    {summary?.statusBreakdown?.pending > 0 && (
                        <Button
                            variant="primary"
                            onClick={handleBulkApprove}
                            loading={bulkLoading}
                            disabled={bulkLoading}
                        >
                            Approve All Pending ({summary.statusBreakdown.pending})
                        </Button>
                    )}
                    {summary?.statusBreakdown?.approved > 0 && (
                        <Button
                            variant="success"
                            onClick={handleBulkPay}
                            loading={bulkLoading}
                            disabled={bulkLoading}
                        >
                            Pay All Approved ({summary.statusBreakdown.approved})
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card padding="sm">
                    <p className="text-xs text-gray-500 uppercase">Employees</p>
                    <p className="text-2xl font-bold text-gray-900">{summary?.totalEmployees ?? 0}</p>
                </Card>
                <Card padding="sm">
                    <p className="text-xs text-gray-500 uppercase">Gross</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(summary?.totalGross ?? 0)}</p>
                </Card>
                <Card padding="sm">
                    <p className="text-xs text-gray-500 uppercase">Deductions</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(summary?.totalDeductions ?? 0)}</p>
                </Card>
                <Card padding="sm" className="bg-success-50 border-success-200">
                    <p className="text-xs text-success-700 uppercase">Net</p>
                    <p className="text-2xl font-bold text-success-800">{formatCurrency(summary?.totalNet ?? 0)}</p>
                </Card>
            </div>

            <Card title="Employees">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gross</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid At</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {payrolls.map((payroll) => (
                                <PayrollRow
                                    key={payroll._id}
                                    payroll={payroll}
                                    onViewBreakdown={setSelected}
                                    onAddAdjustment={(p) => {
                                        setSelected(p);
                                        setShowAdjustment(true);
                                    }}
                                    onApprove={handleApprove}
                                    onPay={handlePay}
                                    onResendEmail={handleResendEmail}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Salary Breakdown Modal */}
            <Modal
                isOpen={!!selected && !showAdjustment}
                onClose={() => setSelected(null)}
                title={selected ? `${selected.employeeId?.personalInfo?.firstName} ${selected.employeeId?.personalInfo?.lastName}` : ''}
                size="lg"
            >
                {selected && (
                    <SalaryBreakdown
                        earnings={selected.earnings}
                        deductions={selected.deductions}
                        adjustments={selected.adjustments}
                        netSalary={selected.netSalary}
                    />
                )}
            </Modal>

            {/* Add Adjustment Modal */}
            <Modal
                isOpen={showAdjustment}
                onClose={() => {
                    setShowAdjustment(false);
                    setAdjustmentForm({ type: 'Bonus', amount: 0, description: '' });
                }}
                title="Add Adjustment"
                footer={
                    <>
                        <Button 
                            variant="secondary" 
                            onClick={() => {
                                setShowAdjustment(false);
                                setAdjustmentForm({ type: 'Bonus', amount: 0, description: '' });
                            }}
                        >
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleAdjustment}>
                            Add Adjustment
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Select
                        label="Adjustment Type"
                        value={adjustmentForm.type}
                        onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, type: e.target.value }))}
                        options={[
                            { label: 'Bonus', value: 'Bonus' },
                            { label: 'Penalty', value: 'Penalty' },
                            { label: 'Allowance', value: 'Allowance' },
                            { label: 'Deduction', value: 'Deduction' },
                            { label: 'Reimbursement', value: 'Reimbursement' },
                            { label: 'Recovery', value: 'Recovery' },
                        ]}
                    />
                    <Input
                        label="Amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={adjustmentForm.amount}
                        onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                        required
                    />
                    <Input
                        label="Description"
                        value={adjustmentForm.description}
                        onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Reason for adjustment"
                        required
                    />
                </div>
            </Modal>
        </PageContainer>
    );
};

export default PayrollDetail;