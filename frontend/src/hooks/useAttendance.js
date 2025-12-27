import { useState, useEffect } from 'react';
import { getMyAttendance, getAllAttendance, getAttendanceStats } from '@/api/attendanceApi';

export const useMyAttendance = (month, year) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await getMyAttendance({ month, year });
                setData(response.data.data);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch attendance:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (month && year) {
            fetchData();
        }
    }, [month, year]);

    return { data, loading, error };
};

export const useAllAttendance = (filters) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await getAllAttendance(filters);
            setData(response.data.data);
            setPagination(response.data.pagination);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch attendance:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [JSON.stringify(filters)]);

    return { data, loading, error, pagination, refetch: fetchData };
};

export const useAttendanceStats = (params) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const response = await getAttendanceStats(params);
                setStats(response.data.data);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch stats:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (params?.startDate && params?.endDate) {
            fetchStats();
        }
    }, [JSON.stringify(params)]);

    return { stats, loading, error };
};
