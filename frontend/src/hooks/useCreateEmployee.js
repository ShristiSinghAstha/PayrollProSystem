import { useState } from 'react';
import { createEmployee } from '@/api/employeeApi';
import toast from 'react-hot-toast';

export const useCreateEmployee = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const create = async (payload) => {
    try {
      setLoading(true);
      setError(null);

      const response = await createEmployee(payload);
      toast.success('Employee created successfully');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create employee';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error };
};
