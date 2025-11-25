import axios from 'axios';

const api = axios.create({
  baseURL: 'http://api.maxiclinicas.com.br/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    'User-Agent': 'MaxiResults/1.0',
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

// Response interceptor - VERSÃO CORRIGIDA
api.interceptors.response.use(
  (response) => {
    console.log('📡 API Response:', {
      url: response.config.url,
      data: response.data,
      type: typeof response.data,
      isArray: Array.isArray(response.data)
    });

    // Se backend retorna { success: true, data: [...] }
    if (
      response.data && 
      typeof response.data === 'object' && 
      'success' in response.data && 
      'data' in response.data
    ) {
      console.log('✅ Extraindo response.data.data');
      
      // Garantir que data.data é um array
      const extractedData = response.data.data;
      const finalData = Array.isArray(extractedData) ? extractedData : [];
      
      console.log('📦 Dados finais:', finalData);
      
      return {
        ...response,
        data: finalData
      };
    }

    // Se já vier como array direto, retorna
    if (Array.isArray(response.data)) {
      console.log('✅ Já é array, retornando direto');
      return response;
    }

    // Caso contrário, retorna response original
    console.log('⚠️ Retornando response original');
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
