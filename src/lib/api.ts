import axios from 'axios';

const api = axios.create({
  baseURL: 'https://viewlessly-unadjoining-lashanda.ngrok-free.dev/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - ATUALIZADO! ✅
api.interceptors.response.use(
  (response) => {
    // Backend retorna { success, data, total }
    if (response.data && response.data.success !== undefined) {
      return {
        ...response,
        data: response.data.data || response.data,
        total: response.data.total
      };
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
