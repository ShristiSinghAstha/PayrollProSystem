import { useState } from 'react';
import { processMonthlyPayroll, bulkApprove, bulkPayAndGeneratePayslips } from '@/api/payrollApi';
import toast from 'react-hot-toast';

export const useProcessPayroll = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const process = async (payload) => {
    try {
      setLoading(true);
      setError(null);
      const response = await processMonthlyPayroll(payload);
      toast.success('Payroll processed successfully');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to process payroll';
      setError(message);
      toast.error(message);
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
      toast.success('All payrolls approved');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to approve payrolls';
      setError(message);
      toast.error(message);
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
      toast.success('Payments initiated and payslips generated');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to pay payrolls';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { process, approveAll, payAll, loading, error };
};
