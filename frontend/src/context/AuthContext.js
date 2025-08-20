import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize user from localStorage and verify token
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          // Verify token by hitting /auth/me
          await api.get('/auth/me');
          setUser(userData);
        }
      } catch (error) {
        // Clear invalid token
        localStorage.removeItem('user');
        delete api.defaults.headers.Authorization;
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      // Correct endpoint: /auth/login
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data;

      const userData = { ...user, token };
      localStorage.setItem('user', JSON.stringify(userData));
      api.defaults.headers.Authorization = `Bearer ${token}`;
      setUser(userData);

      toast.success('Login successful!');
      return true;
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Login failed. Please check your credentials.'
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    delete api.defaults.headers.Authorization;
    setUser(null);
    toast.success('Logged out successfully.');
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);
