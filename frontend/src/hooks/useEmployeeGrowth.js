import { useState, useEffect } from 'react';
import axios from '../api/axios';

export const useEmployeeGrowth = (months = 12) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchGrowth = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`/api/employees/growth?months=${months}`);
                setData(response.data.data);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch employee growth:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchGrowth();
    }, [months]);

    return { data, loading, error };
};
