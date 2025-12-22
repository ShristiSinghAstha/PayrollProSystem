import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginApi, logout as logoutApi, getMe } from '@/api/authApi';
import { message } from 'antd';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize: Check if user is already logged in
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');

      if (token) {
        try {
          const response = await getMe();
          setUser(response.data.data);
        } catch (error) {
          // Token invalid, clear it
          localStorage.removeItem('token');
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await loginApi(credentials);
      const { token, data } = response.data;

      localStorage.setItem('token', token);
      setUser(data.user);

      // Navigate based on role
      if (data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/employee/dashboard');
      }

      // Success message handled in Login component
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Login failed';
      message.error(errorMsg);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      // Logout anyway even if API fails
      console.error('Logout API error:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      navigate('/login');
      message.success('Logged out successfully');
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isEmployee: user?.role === 'employee',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};