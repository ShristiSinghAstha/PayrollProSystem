import { useState, useEffect } from 'react';
import {
  getPayrollRecords,
  getPayrollById,
  getPayrollStats,
  getPayrollByMonth
} from '@/api/payrollApi';
import { message } from 'antd';

export const usePayroll = (filters = {}) => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getPayrollRecords(filters);
      setPayrolls(response.data.data);
      setPagination(response.data.pagination);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to fetch payroll records';
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, [JSON.stringify(filters)]);

  return {
    payrolls,
    loading,
    error,
    pagination,
    refetch: fetchPayrolls
  };
};

export const usePayrollDetail = (id) => {
  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchPayroll = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getPayrollById(id);
        setPayroll(response.data.data);
      } catch (err) {
        const errorMsg = err.response?.data?.message || 'Failed to fetch payroll';
        setError(errorMsg);
        message.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchPayroll();
  }, [id]);

  return { payroll, loading, error };
};

export const usePayrollByMonth = (month) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMonthPayroll = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getPayrollByMonth(month);
      setData(response.data.data);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to fetch monthly payroll';
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!month) {
      setLoading(false);
      return;
    }

    fetchMonthPayroll();
  }, [month]);

  return {
    data,
    loading,
    error,
    refetch: fetchMonthPayroll
  };
};

export const usePayrollStats = (filters = {}) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getPayrollStats(filters);
      setStats(response.data.data);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to fetch stats';
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [JSON.stringify(filters)]);

  return { stats, loading, error, refetch: fetchStats };
};