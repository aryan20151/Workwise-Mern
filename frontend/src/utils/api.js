import axios from 'axios';

// Create centralized Axios instance
const api = axios.create({
  baseURL: '', // Uses Vite proxy (e.g. /api/...)
  withCredentials: true, // Automatically include HTTP-only session cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject active user ID header or auth details
api.interceptors.request.use(
  (config) => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('workwise_user') || '{}');
      const userId = storedUser?.id || storedUser?._id;
      if (userId) {
        config.headers['x-user-id'] = userId;
      }
    } catch (e) {
      // Ignore JSON parsing errors
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Intercept responses globally for status codes & errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'Network error occurred';

    if (status === 401) {
      console.warn('🔒 Axios Interceptor [401 Unauthorized]: Session expired or missing login.');
    } else if (status === 403) {
      console.warn('⛔ Axios Interceptor [403 Forbidden]:', message);
    } else if (status >= 500) {
      console.error('💥 Axios Interceptor [Server Error]:', message);
    }

    return Promise.reject(error);
  }
);

export default api;
