import axios from 'axios';

// Determine API base URL
const getBaseURL = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  // For Electron app (file protocol)
  if (protocol === 'file:') {
    return 'http://localhost:5000/api';
  }

  // For production web deployment
  if (hostname === 'juicy.gentime.in') {
    return 'https://juicyapi.gentime.in/api';
  }

  // For local development with Vite dev server
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Use proxy if available, otherwise direct connection
    return import.meta.env.DEV ? '/api' : 'http://localhost:5000/api';
  }

  // Default fallback
  return '/api';
};

// Get the base URL and log it for debugging
const baseURL = getBaseURL();
console.log('API Base URL:', baseURL);

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
