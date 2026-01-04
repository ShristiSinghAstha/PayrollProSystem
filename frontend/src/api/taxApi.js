import axios from './axios';

export const submitTaxDeclaration = (data) => {
    return axios.post('/api/tax/declarations', data);
};

export const getMyTaxDeclarations = (params) => {
    return axios.get('/api/tax/declarations/my', { params });
};

export const updateTaxDeclaration = (id, data) => {
    return axios.put(`/api/tax/declarations/${id}`, data);
};

export const calculateTaxEstimate = (data) => {
    return axios.post('/api/tax/calculate-estimate', data);
};

// Admin APIs
export const getAllTaxDeclarations = (params) => {
    return axios.get('/api/tax/declarations', { params });
};

export const verifyTaxDeclaration = (id, data) => {
    return axios.put(`/api/tax/declarations/${id}/verify`, data);
};

export const getTaxStats = (params) => {
    return axios.get('/api/tax/stats', { params });
};
