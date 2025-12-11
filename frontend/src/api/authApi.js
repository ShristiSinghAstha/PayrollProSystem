import axios from './axios';

export const login = (credentials) => {
  return axios.post('/api/auth/login', credentials);
};

export const logout = () => {
  return axios.post('/api/auth/logout');
};

export const getMe = () => {
  return axios.get('/api/auth/me');
};

export const changePassword = (data) => {
  return axios.put('/api/auth/change-password', data);
};

export const updateProfile = (data) => {
  return axios.put('/api/auth/update-profile', data);
};