import axios from 'axios';

// Create axios instance for public API (no authentication required)
const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/public',
  headers: {
    'Content-Type': 'application/json'
  }
});

// No authentication interceptor for public routes
// Public routes don't need JWT tokens

export default publicApi;
