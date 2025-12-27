import { useState, useEffect } from 'react';
import axios from '../api/axios';

export const useSalaryByDepartment = (month = null, year = new Date().getFullYear()) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSalaryStats = async () => {
            try {
                setLoading(true);
                const params = { year };
                if (month) params.month = month;

                const response = await axios.get('/api/payroll/salary-by-department', { params });
                setData(response.data.data);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch salary by department:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSalaryStats();
    }, [month, year]);

    return { data, loading, error };
};
