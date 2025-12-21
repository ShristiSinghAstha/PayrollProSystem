import { useState } from 'react';
import { createEmployee } from '@/api/employeeApi';
import { message } from 'antd';

export const useCreateEmployee = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const create = async (payload) => {
    try {
      setLoading(true);
      setError(null);

      const response = await createEmployee(payload);
      message.success('Employee created successfully');
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to create employee';
      setError(errorMsg);
      message.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error };
};
