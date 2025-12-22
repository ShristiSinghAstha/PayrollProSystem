import axios from './axios';

export const getEmployees = (params) => {
  return axios.get('/api/employees', { params });
};

export const getEmployeeById = (id) => {
  return axios.get(`/api/employees/${id}`);
};

export const createEmployee = (data) => {
  return axios.post('/api/employees', data);
};

export const updateEmployee = (id, data) => {
  return axios.put(`/api/employees/${id}`, data);
};

export const deactivateEmployee = (id) => {
  return axios.delete(`/api/employees/${id}`);
};

export const getEmployeeStats = () => {
  return axios.get('/api/employees/stats');
};

export const getEmployeeDashboard = () => {
  return axios.get('/api/employees/dashboard');
};