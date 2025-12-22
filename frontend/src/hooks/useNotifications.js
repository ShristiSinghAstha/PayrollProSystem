// websockets will make this feature more interesting... let's see... will come back !!!

import { useState, useEffect } from 'react';
import { getMyNotifications, getUnreadCount } from '@/api/notificationApi';
import { message } from 'antd';

export const useNotifications = (filters = {}) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getMyNotifications(filters);
      setNotifications(response.data.data.notifications);
      setUnreadCount(response.data.data.unreadCount);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to fetch notifications';
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [JSON.stringify(filters)]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refetch: fetchNotifications
  };
};

export const useUnreadCount = () => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = async () => {
    try {
      setLoading(true);
      const response = await getUnreadCount();
      setCount(response.data.data.unreadCount);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();

    // Poll every 30 seconds -> let's try websockets later...
    const interval = setInterval(fetchCount, 30000);

    return () => clearInterval(interval);
  }, []);

  return { count, loading, refetch: fetchCount };
};