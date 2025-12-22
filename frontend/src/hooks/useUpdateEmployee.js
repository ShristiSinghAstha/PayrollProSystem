import { useState } from 'react';
import { updateEmployee } from '@/api/employeeApi';
import { message } from 'antd';

export const useUpdateEmployee = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const update = async (id, payload) => {
    try {
      setLoading(true);
      setError(null);

      const response = await updateEmployee(id, payload);
      message.success('Employee updated successfully');
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update employee';
      setError(errorMsg);
      message.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { update, loading, error };
};
