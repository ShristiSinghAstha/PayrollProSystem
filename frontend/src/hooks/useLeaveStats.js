import { useState, useEffect } from 'react';
import axios from '../api/axios';

export const useLeaveStats = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/api/leaves/stats');
                setStats(response.data.data);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch leave stats:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return { stats, loading, error };
};
