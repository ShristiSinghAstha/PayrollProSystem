import { useState, useEffect } from 'react';
import { getMyPayslips, getPayslipById } from '@/api/payslipApi';
import { message } from 'antd';

export const usePayslips = (filters = {}) => {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getMyPayslips(filters);
      setPayslips(response.data.data);
      setPagination(response.data.pagination);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to fetch payslips';
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips();
  }, [JSON.stringify(filters)]);

  const downloadPayslip = async (payslipId) => {
    try {
      const response = await import('@/api/payslipApi').then(mod => mod.downloadPayslip(payslipId));
      // Open the payslip URL in a new tab
      if (response.data?.data?.payslipUrl) {
        window.open(response.data.data.payslipUrl, '_blank');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to download payslip';
      message.error(errorMsg);
      throw err;
    }
  };

  return {
    payslips,
    loading,
    error,
    pagination,
    refetch: fetchPayslips,
    downloadPayslip
  };
};

export const usePayslip = (id) => {
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchPayslip = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getPayslipById(id);
        setPayslip(response.data.data);
      } catch (err) {
        const errorMsg = err.response?.data?.message || 'Failed to fetch payslip';
        setError(errorMsg);
        message.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchPayslip();
  }, [id]);

  return { payslip, loading, error };
};