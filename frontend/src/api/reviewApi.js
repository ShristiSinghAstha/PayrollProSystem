import axios from './axios';

export const createReview = (data) => {
    return axios.post('/api/reviews', data);
};

export const getAllReviews = (params) => {
    return axios.get('/api/reviews', { params });
};

export const getReview = (id) => {
    return axios.get(`/api/reviews/${id}`);
};

export const updateReview = (id, data) => {
    return axios.put(`/api/reviews/${id}`, data);
};

export const completeReview = (id) => {
    return axios.post(`/api/reviews/${id}/complete`);
};

export const getMyReviews = () => {
    return axios.get('/api/reviews/my');
};

export const submitSelfAssessment = (id, data) => {
    return axios.post(`/api/reviews/${id}/self-assessment`, data);
};

export const acknowledgeReview = (id) => {
    return axios.post(`/api/reviews/${id}/acknowledge`);
};

export const getPendingReviews = () => {
    return axios.get('/api/reviews/pending');
};

export const getReviewStats = (params) => {
    return axios.get('/api/reviews/stats', { params });
};

export const applySalaryAdjustments = () => {
    return axios.post('/api/reviews/apply-salary-adjustments');
};
