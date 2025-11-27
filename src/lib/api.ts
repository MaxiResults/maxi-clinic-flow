import axios from 'axios';

const isProduction = 
  window.location.hostname === 'maxiclinicas.com.br' ||
  window.location.hostname === 'www.maxiclinicas.com.br';

const API_BASE_URL = isProduction 
  ? '/api/v1'
  : 'https://api.maxiclinicas.com.br/api/v1';

console.log(`🔧 Ambiente: ${isProduction ? 'PRODUÇÃO' : 'PREVIEW'}`);
console.log(`🌐 API URL: ${API_BASE_URL}`);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: false,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('📡 API Response:', {
      url: response.config.url,
      status: response.status,
      dataType: typeof response.data,
      isArray: Array.isArray(response.data),
    });

    // DEBUG completo
    console.log('🔍 RESPONSE COMPLETA:', JSON.stringify(response.data, null, 2));
    console.log('🔍 response.data.data:', response.data.data);
    console.log('🔍 Tipo:', typeof response.data.data);
    console.log('🔍 É array?', Array.isArray(response.data.data));
    console.log('🔍 É null?', response.data.data === null);
    console.log('🔍 É undefined?', response.data.data === undefined);

    // Backend retorna: { success: true, data: [...] ou {...} }
    if (
      response.data &&
      typeof response.data === 'object' &&
      'success' in response.data &&
      'data' in response.data
    ) {
      console.log('✅ Extraindo response.data.data');
      
      const extractedData = response.data.data;
      
      // Array
      if (Array.isArray(extractedData)) {
        console.log(`📦 ${extractedData.length} itens retornados`);
        return {
          ...response,
          data: extractedData,
        };
      }
      
      // Objeto único
      if (extractedData && typeof extractedData === 'object') {
        console.log('📦 1 objeto retornado');
        return {
          ...response,
          data: extractedData,
        };
      }

      // Se data é null ou undefined
      console.log('⚠️ response.data.data é null/undefined');
      return {
        ...response,
        data: null,
      };
    }

    // Array direto
    if (Array.isArray(response.data)) {
      console.log(`✅ Array direto: ${response.data.length} itens`);
      return response;
    }

    // Outros
    console.log('✅ Response original mantido');
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    if (error.response?.status === 401) {
      console.warn('🔒 Token inválido - redirecionando login');
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
