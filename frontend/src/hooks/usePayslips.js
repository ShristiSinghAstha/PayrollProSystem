import { useState, useEffect } from 'react';
import { getMyPayslips, getPayslipById } from '@/api/payslipApi';
import toast from 'react-hot-toast';

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
      const message = err.response?.data?.message || 'Failed to fetch payslips';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips();
  }, [JSON.stringify(filters)]);

  return { 
    payslips, 
    loading, 
    error, 
    pagination,
    refetch: fetchPayslips 
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
        const message = err.response?.data?.message || 'Failed to fetch payslip';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchPayslip();
  }, [id]);

  return { payslip, loading, error };
};