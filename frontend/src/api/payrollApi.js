import axios from './axios';

export const getPayrollRecords = (params) => {
  return axios.get('/api/payroll', { params });
};

export const getPayrollById = (id) => {
  return axios.get(`/api/payroll/${id}`);
};

export const getPayrollByMonth = (month) => {
  return axios.get(`/api/payroll/month/${month}`);
};

export const processMonthlyPayroll = (data) => {
  return axios.post('/api/payroll/process', data);
};

export const addAdjustment = (id, data) => {
  return axios.put(`/api/payroll/${id}/adjustment`, data);
};

export const approvePayroll = (id) => {
  return axios.put(`/api/payroll/${id}/approve`);
};

export const revokePayroll = (id) => {
  return axios.put(`/api/payroll/${id}/revoke`);
};

export const markAsPaid = (id) => {
  return axios.put(`/api/payroll/${id}/pay`);
};

export const bulkApprove = (month) => {
  return axios.post(`/api/payroll/bulk-approve/${month}`);
};

export const bulkRevoke = (month) => {
  return axios.post(`/api/payroll/bulk-revoke/${month}`);
};

export const bulkPayAndGeneratePayslips = (month) => {
  return axios.post(`/api/payroll/bulk-pay/${month}`);
};

export const getPayrollStats = (params) => {
  return axios.get('/api/payroll/stats', { params });
};

export const getMonthlyPayrollSummary = () => {
  return axios.get('/api/payroll/summary');
}