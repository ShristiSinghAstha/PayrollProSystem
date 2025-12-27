import axios from './axios';

// Step 1: Login with email/password (sends OTP)
export const login = (credentials) => {
  return axios.post('/api/auth/login', credentials);
};

// Step 2: Verify OTP and complete login
export const verifyOTP = (email, otp) => {
  return axios.post('/api/auth/verify-otp', { email, otp });
};

// Resend OTP
export const resendOTP = (email) => {
  return axios.post('/api/auth/resend-otp', { email });
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