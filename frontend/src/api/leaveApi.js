import axios from './axios';

export const applyLeave = (leaveData) => {
    return axios.post('/api/leaves/apply', leaveData);
};

export const getMyLeaves = (year) => {
    return axios.get('/api/leaves/my-leaves', { params: { year } });
};

export const getMyLeaveBalance = () => {
    return axios.get('/api/leaves/my-balance');
};

export const deleteLeave = (leaveId) => {
    return axios.delete(`/api/leaves/${leaveId}`);
};

// Admin endpoints
export const getAllLeaves = (filters) => {
    return axios.get('/api/leaves', { params: filters });
};

export const getLeaveStats = () => {
    return axios.get('/api/leaves/stats');
};

export const approveLeave = (leaveId, remarks) => {
    return axios.patch(`/api/leaves/${leaveId}/approve`, { remarks });
};

export const rejectLeave = (leaveId, reason) => {
    return axios.patch(`/api/leaves/${leaveId}/reject`, { reason });
};

export const getEmployeeLeaveBalance = (employeeId, year) => {
    return axios.get(`/api/leaves/balance/${employeeId}`, { params: { year } });
};
