import axios from 'axios';

// Create axios instance with correct base URL
const baseURL = process.env.NODE_ENV === 'production' 
  ? 'https://debtman.onrender.com' 
  : process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${baseURL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for sending cookies with requests
});

console.log('API Base URL:', api.defaults.baseURL);

console.log('API Configuration:');
console.log('- Base URL:', api.defaults.baseURL);
console.log('- Environment:', process.env.NODE_ENV);
console.log('- REACT_APP_API_URL:', process.env.REACT_APP_API_URL || 'Not set, using default');

// Add token automatically to each request if available
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      headers: config.headers
    });
    
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (storedUser?.token) {
      config.headers.Authorization = `Bearer ${storedUser.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('API Error:', {
      message: error.message,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        fullURL: error.config?.baseURL && error.config?.url 
          ? `${error.config.baseURL}${error.config.url}` 
          : 'N/A',
        data: error.config?.data
      },
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : 'No response',
      request: error.request ? 'Request made but no response received' : 'No request was made'
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
