import { useState } from 'react';
import { updateEmployee } from '@/api/employeeApi';
import toast from 'react-hot-toast';

export const useUpdateEmployee = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const update = async (id, payload) => {
    try {
      setLoading(true);
      setError(null);

      const response = await updateEmployee(id, payload);
      toast.success('Employee updated successfully');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update employee';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { update, loading, error };
};
