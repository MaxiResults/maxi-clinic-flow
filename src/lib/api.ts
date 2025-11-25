import axios from 'axios';

/**
 * Cliente API - Multi-ambiente
 * 
 * PRODUÇÃO (maxiclinicas.com.br):
 *   → Usa proxy reverso: /api/v1
 * 
 * PREVIEW (lovable.dev/app):
 *   → Aponta direto: https://api.maxiclinicas.com.br/api/v1
 */

// Detectar ambiente
const isProduction = 
  window.location.hostname === 'maxiclinicas.com.br' ||
  window.location.hostname === 'www.maxiclinicas.com.br';

// Base URL conforme ambiente
const API_BASE_URL = isProduction 
  ? '/api/v1'  // Produção: proxy reverso
  : 'https://api.maxiclinicas.com.br/api/v1';  // Preview: VPS direto

// Log ambiente
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

// ============================================
// REQUEST INTERCEPTOR - Autenticação
// ============================================
api.interceptors.request.use(
  (config) => {
    // Adicionar token se existir
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request
    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// ============================================
// RESPONSE INTERCEPTOR - Normalização
// ============================================
api.interceptors.response.use(
  (response) => {
    console.log('📡 API Response:', {
      url: response.config.url,
      status: response.status,
      dataType: typeof response.data,
      isArray: Array.isArray(response.data),
    });

    // Backend retorna: { success: true, data: [...] }
    if (
      response.data &&
      typeof response.data === 'object' &&
      'success' in response.data &&
      'data' in response.data
    ) {
      console.log('✅ Extraindo response.data.data');
      
      const extractedData = response.data.data;
      const finalData = Array.isArray(extractedData) ? extractedData : [];
      
      console.log(`📦 ${finalData.length} itens retornados`);
      
      return {
        ...response,
        data: finalData,
      };
    }

    // Já é array? Retorna direto
    if (Array.isArray(response.data)) {
      console.log(`✅ Array direto: ${response.data.length} itens`);
      return response;
    }

    // Outros casos
    console.log('⚠️ Response original mantido');
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    // Unauthorized - logout
    if (error.response?.status === 401) {
      console.warn('🔒 Token inválido - redirecionando login');
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
