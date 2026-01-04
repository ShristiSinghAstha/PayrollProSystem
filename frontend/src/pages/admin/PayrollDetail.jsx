import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SkeletonTable from '@/components/common/SkeletonTable';
import LottieEmptyState from '@/components/common/LottieEmptyState';
import PageContainer from '@/components/layout/PageContainer';
import PayrollRow from '@/components/domain/PayrollRow';
import SalaryBreakdown from '@/components/domain/SalaryBreakdown';
import PaymentProgressModal from '@/components/domain/PaymentProgressModal';
import { usePayrollByMonth } from '@/hooks/usePayroll';
import { approvePayroll, markAsPaid, addAdjustment, revokePayroll } from '@/api/payrollApi';
import { resendPayslipEmail } from '@/api/payslipApi';
import { useProcessPayroll } from '@/hooks/useProcessPayroll';
import { formatMonth, formatCurrency } from '@/utils/formatters';
import { message } from 'antd';
import { confirmApprove, confirmPayment, confirmRevoke, confirmBulkPayment, confirmBulkRevoke } from '@/utils/confirmations';

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
    const [paymentProgress, setPaymentProgress] = useState({
        isOpen: false,
        currentStep: 0,
        status: 'idle', // idle | processing | success | error
        error: null,
        transactionId: null,
        payroll: null
    });

    const { approveAll, revokeAll, payAll, loading: bulkLoading } = useProcessPayroll();

    const handleBulkApprove = async () => {
        try {
            await approveAll(month);
            refetch();
        } catch (error) {
            console.error('Bulk approve failed:', error);
        }
    };

    const handleBulkRevoke = async () => {
        if (!summary?.statusBreakdown?.approved || summary.statusBreakdown.approved === 0) {
            message.error('No approved payrolls to revoke');
            return;
        }

        const employeeCount = summary.statusBreakdown.approved;
        const confirmed = await confirmBulkRevoke(employeeCount);

        if (!confirmed) return;

        try {
            await revokeAll(month);
            refetch();
        } catch (error) {
            console.error('Bulk revoke failed:', error);
        }
    };

    const handleBulkPay = async () => {
        if (!summary?.statusBreakdown?.approved || summary.statusBreakdown.approved === 0) {
            message.error('No approved payrolls to pay');
            return;
        }

        // Add confirmation dialog
        const totalAmount = formatCurrency(summary.totalNet);
        const employeeCount = summary.statusBreakdown.approved;
        const confirmed = await confirmBulkPayment(totalAmount, employeeCount);

        if (!confirmed) return;

        // Show simplified animation for bulk
        setPaymentProgress({
            isOpen: true,
            currentStep: 1,
            status: 'processing',
            error: null,
            transactionId: null,
            payroll: {
                netSalary: summary.totalNet,
                earnings: { gross: summary.totalGross },
                deductions: { total: summary.totalDeductions }
            }
        });

        // Simulate bulk processing with faster steps
        const steps = [
            { delay: 400 },  // Calculate
            { delay: 300 },  // Deductions
            { delay: 600 },  // PDF generation for all
            { delay: 500 },  // Upload all
            { delay: 800 },  // Initiate bulk NEFT
            { delay: 1000 }, // Bank batch processing
            { delay: 600 },  // Confirmation
            { delay: 400 }   // Email all
        ];

        try {
            // Progress through steps
            for (let i = 0; i < steps.length; i++) {
                await new Promise(resolve => setTimeout(resolve, steps[i].delay));
                if (i < steps.length - 1) {
                    setPaymentProgress(prev => ({ ...prev, currentStep: i + 2 }));
                }
            }

            // Actual API call
            await payAll(month);

            // Success!
            setPaymentProgress(prev => ({
                ...prev,
                currentStep: 9,
                status: 'success',
                transactionId: `BULK-TXN-${Date.now()}`
            }));

            // Close modal after 2 seconds
            setTimeout(() => {
                setPaymentProgress({
                    isOpen: false,
                    currentStep: 0,
                    status: 'idle',
                    error: null,
                    transactionId: null,
                    payroll: null
                });
                refetch();
            }, 2000);

        } catch (error) {
            console.error('Bulk pay failed:', error);
            setPaymentProgress(prev => ({
                ...prev,
                status: 'error',
                error: 'Bulk payment processing failed'
            }));

            setTimeout(() => {
                setPaymentProgress({
                    isOpen: false,
                    currentStep: 0,
                    status: 'idle',
                    error: null,
                    transactionId: null,
                    payroll: null
                });
            }, 3000);
        }
    };

    const handleApprove = async (payroll) => {
        const employeeName = `${payroll.employeeId?.personalInfo?.firstName || ''} ${payroll.employeeId?.personalInfo?.lastName || ''}`;
        const confirmed = await confirmApprove(`${employeeName}'s payroll`);

        if (!confirmed) return;

        try {
            await approvePayroll(payroll._id);
            message.success('Payroll approved successfully');
            refetch();
        } catch (error) {
            message.error('Failed to approve payroll');
        }
    };

    const handleRevoke = async (payroll) => {
        const employeeName = `${payroll.employeeId?.personalInfo?.firstName || ''} ${payroll.employeeId?.personalInfo?.lastName || ''}`;
        const confirmed = await confirmRevoke(employeeName);

        if (!confirmed) return;

        try {
            await revokePayroll(payroll._id);
            message.success('Payroll approval revoked successfully');
            refetch();
        } catch (error) {
            message.error(error.response?.data?.error?.message || 'Failed to revoke payroll');
        }
    };

    const handlePay = async (payroll) => {
        const employeeName = `${payroll.employeeId?.personalInfo?.firstName || ''} ${payroll.employeeId?.personalInfo?.lastName || ''}`;
        const amount = formatCurrency(payroll.netSalary);
        const confirmed = await confirmPayment(amount, employeeName);

        if (!confirmed) return;

        // Open progress modal
        setPaymentProgress({
            isOpen: true,
            currentStep: 1, // Start at step 1 to show first animation
            status: 'processing',
            error: null,
            transactionId: null,
            payroll: payroll
        });

        // Simulate step progression with banking
        const steps = [
            { delay: 600 },  // Step 1: Calculate salary
            { delay: 500 },  // Step 2: Apply deductions  
            { delay: 1000 }, // Step 3: Generate PDF
            { delay: 900 },  // Step 4: Upload
            { delay: 1200 }, // Step 5: Initiate NEFT transfer
            { delay: 1500 }, // Step 6: Bank processing
            { delay: 800 },  // Step 7: Payment confirmed
            { delay: 600 }   // Step 8: Send email
        ];

        let currentStepIndex = 0;

        try {
            // Progress through steps
            for (let i = 0; i < steps.length; i++) {
                currentStepIndex = i + 1;
                setPaymentProgress(prev => ({ ...prev, currentStep: currentStepIndex }));
                await new Promise(resolve => setTimeout(resolve, steps[i].delay));
            }

            // Actual API call (backend has its own delays)
            const response = await markAsPaid(payroll._id);

            // Success!
            setPaymentProgress(prev => ({
                ...prev,
                currentStep: 9, // Changed from 6 to 9 (8 steps + success)
                status: 'success',
                transactionId: response.data.transactionId
            }));

            message.success('Payment processed successfully');

            // Close modal after 3 seconds
            setTimeout(() => {
                setPaymentProgress({
                    isOpen: false,
                    currentStep: 0,
                    status: 'idle',
                    error: null,
                    transactionId: null,
                    payroll: null
                });
                refetch();
            }, 3000);

        } catch (error) {
            setPaymentProgress(prev => ({
                ...prev,
                status: 'error',
                error: error.response?.data?.message || 'Payment processing failed'
            }));

            // Close modal after 4 seconds on error
            setTimeout(() => {
                setPaymentProgress({
                    isOpen: false,
                    currentStep: 0,
                    status: 'idle',
                    error: null,
                    transactionId: null,
                    payroll: null
                });
            }, 4000);
        }
    };

    const handleResendEmail = async (payroll) => {
        try {
            await resendPayslipEmail(payroll._id);
            message.success('Payslip email resent successfully');
        } catch (error) {
            message.error('Failed to resend email');
        }
    };

    const handleAdjustment = async () => {
        if (!selected) return;

        if (!adjustmentForm.description.trim()) {
            message.error('Description is required');
            return;
        }

        if (adjustmentForm.amount <= 0) {
            message.error('Amount must be greater than 0');
            return;
        }

        try {
            await addAdjustment(selected._id, adjustmentForm);
            message.success('Adjustment added');
            setShowAdjustment(false);
            setSelected(null);
            setAdjustmentForm({ type: 'Bonus', amount: 0, description: '' });
            refetch();
        } catch (error) {
            message.error('Failed to add adjustment');
        }
    };

    if (loading) {
        return <SkeletonTable rows={8} columns={5} hasActions={true} />;
    }

    if (!data) {
        return (
            <LottieEmptyState
                title="No Payroll Data Found"
                description="No payroll has been processed for this month yet. Please process payroll first to view details."
            />
        );
    }

    const { summary, payrolls } = data;

    return (
        <PageContainer>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Payroll: {formatMonth(month)}</h1>
                    <p className="text-muted-foreground">Review payroll before approval and payment</p>
                </div>
                <div className="flex gap-3">
                    {summary?.statusBreakdown?.pending > 0 && (
                        <Button
                            size="lg"
                            onClick={handleBulkApprove}
                            disabled={bulkLoading}
                            className="gap-2"
                        >
                            {bulkLoading ? 'Processing...' : `Approve All Pending (${summary.statusBreakdown.pending})`}
                        </Button>
                    )}
                    {summary?.statusBreakdown?.approved > 0 && (
                        <>
                            <Button
                                size="lg"
                                onClick={handleBulkRevoke}
                                disabled={bulkLoading}
                                className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-white"
                            >
                                {bulkLoading ? 'Processing...' : `Revoke All Approved (${summary.statusBreakdown.approved})`}
                            </Button>
                            <Button
                                size="lg"
                                onClick={handleBulkPay}
                                disabled={bulkLoading}
                                className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                            >
                                {bulkLoading ? 'Processing...' : `Pay All Approved (${summary.statusBreakdown.approved})`}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="border">
                    <CardContent className="pt-6">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Employees</p>
                        <p className="text-2xl font-semibold text-foreground mt-2">{summary?.totalEmployees ?? 0}</p>
                    </CardContent>
                </Card>
                <Card className="border">
                    <CardContent className="pt-6">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Gross</p>
                        <p className="text-xl font-semibold text-foreground mt-2">{formatCurrency(summary?.totalGross ?? 0)}</p>
                    </CardContent>
                </Card>
                <Card className="border">
                    <CardContent className="pt-6">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Deductions</p>
                        <p className="text-xl font-semibold text-foreground mt-2">{formatCurrency(summary?.totalDeductions ?? 0)}</p>
                    </CardContent>
                </Card>
                <Card className="border bg-green-50">
                    <CardContent className="pt-6">
                        <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Net</p>
                        <p className="text-2xl font-semibold text-green-800 mt-2">{formatCurrency(summary?.totalNet ?? 0)}</p>
                    </CardContent>
                </Card>
            </div>


            {/* Employees Table */}
            <Card className="border">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Employees</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Employee</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Gross</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Deductions</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Net</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Paid At</th>
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
                                        onRevoke={handleRevoke}
                                        onPay={handlePay}
                                        onResendEmail={handleResendEmail}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>


            {/* Salary Breakdown Modal */}
            {selected && !showAdjustment && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelected(null)}>
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-2" onClick={(e) => e.stopPropagation()}>
                        <CardHeader className="border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle>
                                    {selected.employeeId?.personalInfo?.firstName} {selected.employeeId?.personalInfo?.lastName}
                                </CardTitle>
                                <Button variant="ghost" size="icon" onClick={() => setSelected(null)}>
                                    ✕
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <SalaryBreakdown
                                earnings={selected.earnings}
                                deductions={selected.deductions}
                                adjustments={selected.adjustments}
                                netSalary={selected.netSalary}
                            />
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Add Adjustment Modal */}
            {showAdjustment && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => {
                    setShowAdjustment(false);
                    setAdjustmentForm({ type: 'Bonus', amount: 0, description: '' });
                }}>
                    <Card className="w-full max-w-md bg-card border-2" onClick={(e) => e.stopPropagation()}>
                        <CardHeader className="border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle>Add Adjustment</CardTitle>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        setShowAdjustment(false);
                                        setAdjustmentForm({ type: 'Bonus', amount: 0, description: '' });
                                    }}
                                >
                                    ✕
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Adjustment Type</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-md"
                                    value={adjustmentForm.type}
                                    onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, type: e.target.value }))}
                                >
                                    <option value="Bonus">Bonus</option>
                                    <option value="Penalty">Penalty</option>
                                    <option value="Allowance">Allowance</option>
                                    <option value="Deduction">Deduction</option>
                                    <option value="Reimbursement">Reimbursement</option>
                                    <option value="Recovery">Recovery</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Amount</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full px-3 py-2 border rounded-md"
                                    value={adjustmentForm.amount}
                                    onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Description</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-md"
                                    value={adjustmentForm.description}
                                    onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, description: e.target.value }))}
                                    placeholder="Reason for adjustment"
                                    required
                                />
                            </div>
                            <div className="flex gap-2 justify-end pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowAdjustment(false);
                                        setAdjustmentForm({ type: 'Bonus', amount: 0, description: '' });
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button onClick={handleAdjustment}>
                                    Add Adjustment
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Payment Progress Modal */}
            <PaymentProgressModal
                isOpen={paymentProgress.isOpen}
                employee={{
                    name: `${paymentProgress.payroll?.employeeId?.personalInfo?.firstName || ''} ${paymentProgress.payroll?.employeeId?.personalInfo?.lastName || ''}`,
                    email: paymentProgress.payroll?.employeeId?.personalInfo?.email
                }}
                payroll={paymentProgress.payroll}
                currentStep={paymentProgress.currentStep}
                status={paymentProgress.status}
                error={paymentProgress.error}
                transactionId={paymentProgress.transactionId}
                isBulk={!paymentProgress.payroll?.employeeId}
                employeeCount={summary?.totalEmployees || 0}
            />
        </PageContainer>
    );
};

export default PayrollDetail;
