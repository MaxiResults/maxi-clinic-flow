import axios from 'axios';

/**
 * Cliente API - Multi-ambiente (CORRIGIDO)
 * 
 * AMBIENTES:
 * 1. PRODUÇÃO (maxiclinicas.com.br):
 *    → Usa proxy reverso: /api/v1
 * 
 * 2. PREVIEW LOVABLE (*.lovable.dev, *.lovable.app):
 *    → Aponta direto: https://api.maxiclinicas.com.br/api/v1
 * 
 * 3. DESENVOLVIMENTO LOCAL (localhost):
 *    → Aponta direto: https://api.maxiclinicas.com.br/api/v1
 */

// ============================================
// DETECÇÃO DE AMBIENTE
// ============================================
const detectEnvironment = () => {
  const hostname = window.location.hostname;
  const origin = window.location.origin;

  // 1. Produção: domínio próprio
  const isProduction = 
    hostname === 'maxiclinicas.com.br' ||
    hostname === 'www.maxiclinicas.com.br';

  // 2. Preview Lovable: qualquer subdomínio .lovable.dev ou .lovable.app
  const isLovablePreview = 
    hostname.includes('lovable.dev') ||
    hostname.includes('lovable.app');

  // 3. Desenvolvimento local
  const isLocalDevelopment = 
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.');

  return {
    isProduction,
    isLovablePreview,
    isLocalDevelopment,
    hostname,
    origin,
  };
};

const env = detectEnvironment();

// ============================================
// BASE URL CONFORME AMBIENTE
// ============================================
const API_BASE_URL = env.isProduction 
  ? '/api/v1'  // Produção: proxy reverso Nginx
  : 'https://api.maxiclinicas.com.br/api/v1';  // Preview/Local: VPS direto

// ============================================
// LOGS DE AMBIENTE (DEV ONLY)
// ============================================
if (!env.isProduction) {
  console.log('🔧 MaxiClinicas - Configuração API');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📍 Hostname: ${env.hostname}`);
  console.log(`🌍 Origin: ${env.origin}`);
  console.log(`🏭 Ambiente: ${
    env.isProduction ? 'PRODUÇÃO' :
    env.isLovablePreview ? 'LOVABLE PREVIEW' :
    env.isLocalDevelopment ? 'DESENVOLVIMENTO LOCAL' :
    'DESCONHECIDO'
  }`);
  console.log(`🔗 API URL: ${API_BASE_URL}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// ============================================
// AXIOS INSTANCE
// ============================================
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 segundos (aumentado)
  withCredentials: false, // Mantém false para evitar problemas de CORS
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
    
    // Log apenas em desenvolvimento
    if (!env.isProduction) {
      console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
    }
    
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
    // Log apenas em desenvolvimento
    if (!env.isProduction) {
      console.log('📡 API Response:', {
        url: response.config.url,
        status: response.status,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
      });
    }

    // ========================================
    // CASO 1: Backend retorna { success: true, data: [...] }
    // ========================================
    if (
      response.data &&
      typeof response.data === 'object' &&
      'success' in response.data &&
      'data' in response.data
    ) {
      if (!env.isProduction) {
        console.log('✅ Extraindo response.data.data');
      }
      
      const extractedData = response.data.data;
      const finalData = Array.isArray(extractedData) ? extractedData : [];
      
      if (!env.isProduction) {
        console.log(`📦 ${finalData.length} itens retornados`);
      }
      
      return {
        ...response,
        data: finalData,
      };
    }

    // ========================================
    // CASO 2: Já é array direto
    // ========================================
    if (Array.isArray(response.data)) {
      if (!env.isProduction) {
        console.log(`✅ Array direto: ${response.data.length} itens`);
      }
      return response;
    }

    // ========================================
    // CASO 3: Response original
    // ========================================
    if (!env.isProduction) {
      console.log('⚠️ Response original mantido');
    }
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data,
    });

    // ========================================
    // TRATAMENTO DE ERROS ESPECÍFICOS
    // ========================================

    // 401 - Unauthorized: token inválido
    if (error.response?.status === 401) {
      console.warn('🔒 Token inválido - redirecionando para login');
      localStorage.removeItem('auth_token');
      
      // Redirecionar baseado no ambiente
      if (env.isProduction) {
        window.location.href = '/login';
      } else {
        // Em preview/dev, apenas logar
        console.warn('🔒 Faça login novamente');
      }
    }

    // 404 - Not Found: endpoint não existe
    if (error.response?.status === 404) {
      console.error('🔍 Endpoint não encontrado:', error.config?.url);
    }

    // 500 - Server Error: problema no backend
    if (error.response?.status === 500) {
      console.error('⚠️ Erro interno do servidor');
    }

    // Network Error: sem conexão com API
    if (error.message === 'Network Error') {
      console.error('🌐 Sem conexão com API - Verifique:');
      console.error(`   1. Backend rodando em: ${API_BASE_URL}`);
      console.error('   2. Configuração CORS no backend');
      console.error('   3. Firewall/SSL da VPS');
    }

    // CORS Error
    if (error.message.includes('CORS')) {
      console.error('🚫 Erro de CORS - Configure o backend para aceitar:', env.origin);
    }

    return Promise.reject(error);
  }
);

// ============================================
// EXPORTAÇÕES
// ============================================
export default api;

// Exportar info de ambiente (útil para debug)
export const apiConfig = {
  baseURL: API_BASE_URL,
  environment: env.isProduction ? 'production' : 
               env.isLovablePreview ? 'preview' : 
               env.isLocalDevelopment ? 'development' : 'unknown',
  ...env,
};
