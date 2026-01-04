import axios from './axios';

export const checkIn = (location) => {
    return axios.post('/api/attendance/check-in', { location });
};

export const checkOut = (location) => {
    return axios.post('/api/attendance/check-out', { location });
};

export const getMyAttendance = (params) => {
    return axios.get('/api/attendance/my', { params });
};

export const getAllAttendance = (params) => {
    return axios.get('/api/attendance', { params });
};

export const getAttendanceStats = (params) => {
    return axios.get('/api/attendance/stats', { params });
};

export const getMonthlyReport = (params) => {
    return axios.get('/api/attendance/report', { params });
};

export const updateAttendance = (id, data) => {
    return axios.put(`/api/attendance/${id}`, data);
};

export const markAbsent = (date) => {
    return axios.post('/api/attendance/mark-absent', { date });
};
