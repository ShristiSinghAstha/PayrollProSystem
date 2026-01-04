import { useState } from 'react';
import { processMonthlyPayroll, bulkApprove, bulkRevoke, bulkPayAndGeneratePayslips } from '@/api/payrollApi';
import { message } from 'antd';

export const useProcessPayroll = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const process = async (payload) => {
        try {
            setLoading(true);
            setError(null);
            const response = await processMonthlyPayroll(payload);

            if (response.data.totalErrors > 0) {
                message.error(
                    `Payroll processed with ${response.data.totalErrors} errors. Check details.`
                );
                // Show detailed errors in console or modal
                console.error('Payroll errors:', response.data.errors);
            } else {
                message.success('Payroll processed successfully');
            }

            return response.data;
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to process payroll';
            setError(errorMsg);
            message.error(errorMsg);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const approveAll = async (month) => {
        try {
            setLoading(true);
            setError(null);
            const response = await bulkApprove(month);
            message.success('All payrolls approved');
            return response.data;
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to approve payrolls';
            setError(errorMsg);
            message.error(errorMsg);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const payAll = async (month) => {
        try {
            setLoading(true);
            setError(null);
            const response = await bulkPayAndGeneratePayslips(month);
            message.success('Payments initiated and payslips generated');
            return response.data;
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to pay payrolls';
            setError(errorMsg);
            message.error(errorMsg);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const revokeAll = async (month) => {
        try {
            setLoading(true);
            setError(null);
            const response = await bulkRevoke(month);
            message.success('All approvals revoked');
            return response.data;
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to revoke approvals';
            setError(errorMsg);
            message.error(errorMsg);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { process, approveAll, revokeAll, payAll, loading, error };
};
