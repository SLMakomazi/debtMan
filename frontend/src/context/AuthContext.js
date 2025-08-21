import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [oauthLoading, setOauthLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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

  // Complete OAuth login with token
  const completeOAuthLogin = useCallback(async (token) => {
    try {
      setLoading(true);
      // Store the token
      localStorage.setItem('token', token);
      api.defaults.headers.Authorization = `Bearer ${token}`;
      
      // Get user data
      const response = await api.get('/auth/me');
      const userData = response.data;
      
      // Store user data
      const userWithToken = { ...userData, token };
      localStorage.setItem('user', JSON.stringify(userWithToken));
      setUser(userWithToken);
      
      // Redirect to dashboard or intended URL
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
      
      return true;
    } catch (error) {
      console.error('Complete OAuth login error:', error);
      toast.error('Failed to complete login. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [location.state?.from?.pathname, navigate]);

  // Handle OAuth callback
  const handleOAuthCallback = useCallback(async () => {
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get('token');
    const needsRegistration = urlParams.get('needsRegistration') === 'true';
    
    if (token) {
      try {
        setOauthLoading(true);
        // Store the token for the complete registration flow
        localStorage.setItem('oauth_token', token);
        
        if (needsRegistration) {
          // Redirect to complete registration page
          navigate('/complete-registration', { 
            state: { token },
            replace: true 
          });
        } else {
          // Complete the login process
          await completeOAuthLogin(token);
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        toast.error('Failed to complete OAuth login. Please try again.');
        navigate('/login');
      } finally {
        setOauthLoading(false);
      }
    }
  }, [location.search, navigate, completeOAuthLogin]);

  // Complete OAuth registration
  const completeOAuthRegistration = async (userData) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('oauth_token');
      if (!token) {
        throw new Error('No registration token found');
      }
      
      const response = await api.post('/auth/complete-oauth-registration', userData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Complete the login process
      await completeOAuthLogin(response.data.token);
      
      // Clean up
      localStorage.removeItem('oauth_token');
      
      toast.success('Registration completed successfully!');
      return true;
    } catch (error) {
      console.error('Complete OAuth registration error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to complete registration. Please try again.';
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/signup', userData);
      const { user, token } = response.data;

      const userDataWithToken = { ...user, token };
      localStorage.setItem('user', JSON.stringify(userDataWithToken));
      api.defaults.headers.Authorization = `Bearer ${token}`;
      setUser(userDataWithToken);

      toast.success('Registration successful!');
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
    localStorage.removeItem('oauth_token');
    delete api.defaults.headers.Authorization;
    setUser(null);
    toast.success('Logged out successfully.');
    navigate('/login');
  };

  // Check for OAuth callback on initial load
  useEffect(() => {
    handleOAuthCallback();
  }, [handleOAuthCallback]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: loading || oauthLoading,
        login,
        register,
        logout,
        completeOAuthRegistration
      }}
    >
      {!loading && !oauthLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);
