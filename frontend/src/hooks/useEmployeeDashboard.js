import { useState, useEffect } from 'react';
import { getEmployeeDashboard } from '@/api/employeeApi';
import { message } from 'antd';

export const useEmployeeDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getEmployeeDashboard();
      setData(response.data.data);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to fetch dashboard data';
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchDashboard
  };
};