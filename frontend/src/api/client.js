import axios from 'axios';

// API Configuration
const baseURL = import.meta.env.VITE_API_URL || 'https://tenagaahli.com/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL,
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 45000, // 45 seconds timeout
});

// Request interceptor - attach auth token and handle requests
api.interceptors.request.use(
  (config) => {
    // Attach auth token if available
    const token = localStorage.getItem('amdal_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Automatically delete Content-Type when data is FormData
    // so browser/axios properly sets multipart/form-data with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
    
    // Log request for debugging (kecuali heartbeat ping berkala agar console tetap bersih)
    if (!config.url?.includes('/presence/ping')) {
      console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle responses and errors
api.interceptors.response.use(
  (response) => {
    if (!response.config.url?.includes('/presence/ping')) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  (error) => {
    const isHeartbeat = error.config?.url?.includes('/presence/ping') || error.config?.url?.includes('/presence/offline');
    if (!isHeartbeat) {
      console.error('❌ Response Error:', error.response?.data || error.message);
    }
    
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('amdal_token');
      localStorage.removeItem('amdal_user');
      window.location.href = '/sign-in';
    }
    
    return Promise.reject(error);
  }
);

// Test database connection
export const testConnection = async () => {
  try {
    const response = await api.get('/health-check');
    console.log('✅ Database connection test successful');
    return response.data;
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    throw error;
  }
};

export default api;
