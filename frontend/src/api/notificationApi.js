import axios from './axios';

export const getMyNotifications = (params) => {
  return axios.get('/api/notifications/me', { params });
};

export const getUnreadCount = () => {
  return axios.get('/api/notifications/unread-count');
};

export const markAsRead = (id) => {
  return axios.put(`/api/notifications/${id}/read`);
};

export const markAllAsRead = () => {
  return axios.put('/api/notifications/read-all');
};