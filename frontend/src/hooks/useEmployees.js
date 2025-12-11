import { useState, useEffect } from 'react';
import { getEmployees, getEmployeeById, getEmployeeStats } from '@/api/employeeApi';
import toast from 'react-hot-toast';

export const useEmployees = (filters = {}) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getEmployees(filters);
      setEmployees(response.data.data);
      setPagination(response.data.pagination);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch employees';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [JSON.stringify(filters)]);

  return { 
    employees, 
    loading, 
    error, 
    pagination,
    refetch: fetchEmployees 
  };
};

export const useEmployee = (id) => {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchEmployee = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await getEmployeeById(id);
        setEmployee(response.data.data);
      } catch (err) {
        const message = err.response?.data?.message || 'Failed to fetch employee';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id]);

  return { employee, loading, error };
};

export const useEmployeeStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getEmployeeStats();
      setStats(response.data.data);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch stats';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, loading, error, refetch: fetchStats };
};