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

// Response interceptor - EXTRAI O DATA.DATA AUTOMATICAMENTE
api.interceptors.response.use(
  (response) => {
    console.log('📡 Response original:', response.data);
    
    // Se backend retorna { success, data, total }
    if (response.data && response.data.success !== undefined && response.data.data) {
      console.log('✅ Extraindo data.data:', response.data.data);
      return {
        ...response,
        data: response.data.data,
        total: response.data.total
      };
    }
    
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error);
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
