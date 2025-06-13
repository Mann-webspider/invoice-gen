import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8000/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          localStorage.removeItem('authToken');
          // window.location.href = '/login';
          break;
        case 403:
          // Forbidden access - handled silently
          break;
        case 404:
          // Resource not found - handled silently
          break;
        case 500:
          // Server error - handled silently
          break;
        default:
          // An error occurred - handled silently
      }
    } else if (error.request) {
      // No response received from server - handled silently
    } else {
      // Error setting up request - handled silently
    }
    return Promise.reject(error);
  }
);

export default api; 