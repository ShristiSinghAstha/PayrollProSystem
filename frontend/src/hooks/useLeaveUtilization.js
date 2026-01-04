import { useState, useEffect } from 'react';
import axios from '../api/axios';

export const useLeaveUtilization = (year = new Date().getFullYear()) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUtilization = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`/api/leaves/utilization?year=${year}`);
                setData(response.data.data);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch leave utilization:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUtilization();
    }, [year]);

    return { data, loading, error };
};
