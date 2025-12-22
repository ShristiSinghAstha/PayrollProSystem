import axios from './axios';

export const getMyPayslips = (params) => {
  return axios.get('/api/payslips/me', { params });
};

export const getPayslipById = (id) => {
  return axios.get(`/api/payslips/${id}`);
};

export const downloadPayslip = (id) => {
  return axios.get(`/api/payslips/${id}/download`);
};

export const resendPayslipEmail = (id) => {
  return axios.post(`/api/payslips/${id}/resend`);
};

export const getPayslipStatus = (month) => {
  return axios.get(`/api/payslips/status/${month}`);
};