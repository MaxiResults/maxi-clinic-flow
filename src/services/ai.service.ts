/**
 * AI Service - Chamadas API para módulo IA
 * MaxiClínicas - Assistente IA
 * 
 * Base URL: http://148.230.79.220:3001/api/v1
 */

import api from '@/lib/api'; // Usar o Axios configurado do projeto

// ============================================================================
// TYPES
// ============================================================================

export interface AIStatus {
  sessaoId: string;
  clienteId?: number;
  empresaId?: number;
  responsavel: {
    id: string;
    nome: string;
    is_ai_agent: boolean;
    is_default: boolean;
  } | null;
  isAIActive: boolean;
  isHumanActive: boolean;
  isQueue: boolean;
}

export interface AISuggestion {
  text: string;
  confidence?: number;
}

export interface AIConfig {
  id: string;
  clienteId: number;
  empresaId: number;
  ativado: boolean;
  modelo: 'claude-haiku-4-5' | 'claude-sonnet-4-6';
  modo: 'auto_reply' | 'suggestions_only' | 'disabled';
  thresholdAutoResponder: number;
  horarioInicio: string;
  horarioFim: string;
  diasSemana: {
    segunda: boolean;
    terca: boolean;
    quarta: boolean;
    quinta: boolean;
    sexta: boolean;
    sabado: boolean;
    domingo: boolean;
  };
  intentsBloqueados: string[];
  intentsAutoRespond: string[];
}

export interface AIAnalyticsOverview {
  totalConversasIA: number;
  taxaAutoResolucao: number;
  totalHandoffs: number;
  tempoMedioResposta: number;
  period: {
    start: string;
    end: string;
  };
}

// ============================================================================
// AI STATUS
// ============================================================================

/**
 * Buscar status IA de uma conversa específica
 */
export const getAIStatus = async (sessaoId: string): Promise<AIStatus> => {
  const response = await api.get<AIStatus>(`/ai/status/${sessaoId}`);
  return response.data;
};

/**
 * Toggle IA para uma conversa específica
 */
export const toggleAIForConversation = async (
  sessaoId: string,
  enabled: boolean
): Promise<void> => {
  await api.patch(`/conversas/${sessaoId}/ai-toggle`, { enabled });
};

/**
 * Assumir atendimento manualmente (desativa IA)
 */
export const assumirAtendimento = async (sessaoId: string): Promise<void> => {
  await api.post(`/conversas/${sessaoId}/assumir`, {
    trigger: 'manual',
    reason: 'Atendente assumiu manualmente'
  });
};

// ============================================================================
// AI SUGGESTIONS
// ============================================================================

/**
 * Buscar sugestões simples de resposta (sem RAG)
 */
export const getSuggestReplies = async (
  conversationId: string,
  count: number = 3
): Promise<AISuggestion[]> => {
  const response = await api.post<{ suggestions: string[] }>(
    '/ai/suggest-replies',
    { conversationId, count }
  );
  
  return response.data.suggestions.map(text => ({ text }));
};

/**
 * Buscar sugestões com RAG (knowledge base)
 */
export const getSuggestWithRAG = async (
  conversationId: string,
  count: number = 3
): Promise<{ suggestions: AISuggestion[]; sources?: string[] }> => {
  const response = await api.post<{
    suggestions: string[];
    knowledgeUsed: boolean;
    sources?: string[];
  }>('/ai/suggest', { conversationId, count });
  
  return {
    suggestions: response.data.suggestions.map(text => ({ text })),
    sources: response.data.sources
  };
};

// ============================================================================
// AI CHAT
// ============================================================================

/**
 * Chat manual com IA (para testes ou admin)
 */
export const sendAIChat = async (
  conversationId: string,
  message: string
): Promise<{
  response: string;
  intent: string;
  confidence: number;
  requiresHumanHandoff: boolean;
}> => {
  const response = await api.post('/ai/chat', {
    conversationId,
    message
  });
  
  return response.data;
};

/**
 * Classificar intent de uma mensagem
 */
export const classifyIntent = async (message: string): Promise<{
  intent: string;
  confidence: number;
  requiresHumanHandoff: boolean;
  explanation: string;
}> => {
  const response = await api.post('/ai/classify', { message });
  return response.data;
};

// ============================================================================
// AI CONFIG
// ============================================================================

/**
 * Buscar configuração IA do tenant
 */
export const getAIConfig = async (): Promise<AIConfig> => {
  const response = await api.get<AIConfig>('/ai/config');
  return response.data;
};

/**
 * Atualizar configuração IA
 */
export const updateAIConfig = async (
  config: Partial<AIConfig>
): Promise<AIConfig> => {
  const response = await api.patch<AIConfig>('/ai/config', config);
  return response.data;
};

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Buscar overview de analytics IA
 */
export const getAnalyticsOverview = async (
  startDate?: string,
  endDate?: string
): Promise<AIAnalyticsOverview> => {
  const response = await api.get<AIAnalyticsOverview>('/ai/analytics/overview', {
    params: { startDate, endDate }
  });
  
  return response.data;
};

/**
 * Buscar timeline de conversas IA vs Humano
 */
export const getAnalyticsTimeline = async (
  days: number = 30
): Promise<Array<{
  date: string;
  conversasIA: number;
  conversasHumano: number;
  total: number;
}>> => {
  const response = await api.get('/ai/analytics/timeline', {
    params: { days }
  });
  
  return response.data;
};

// ============================================================================
// KNOWLEDGE BASE
// ============================================================================

/**
 * Upload documento para knowledge base
 */
export const uploadKnowledgeDocument = async (
  file: File,
  metadata: {
    title: string;
    category?: string;
  }
): Promise<void> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', metadata.title);
  if (metadata.category) {
    formData.append('category', metadata.category);
  }
  
  await api.post('/ai/knowledge-base/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

/**
 * Listar documentos da knowledge base
 */
export const listKnowledgeDocuments = async (): Promise<Array<{
  id: string;
  title: string;
  category: string;
  createdAt: string;
}>> => {
  const response = await api.get('/ai/knowledge-base');
  return response.data;
};

/**
 * Deletar documento da knowledge base
 */
export const deleteKnowledgeDocument = async (id: string): Promise<void> => {
  await api.delete(`/ai/knowledge-base/${id}`);
};

/**
 * Atualizar metadados de documento
 */
export const updateKnowledgeDocument = async (
  id: string,
  metadata: { title?: string; category?: string }
): Promise<void> => {
  await api.patch(`/ai/knowledge-base/${id}`, metadata);
};

export default {
  // Status
  getAIStatus,
  toggleAIForConversation,
  assumirAtendimento,
  
  // Suggestions
  getSuggestReplies,
  getSuggestWithRAG,
  
  // Chat
  sendAIChat,
  classifyIntent,
  
  // Config
  getAIConfig,
  updateAIConfig,
  
  // Analytics
  getAnalyticsOverview,
  getAnalyticsTimeline,
  
  // Knowledge Base
  uploadKnowledgeDocument,
  listKnowledgeDocuments,
  deleteKnowledgeDocument,
  updateKnowledgeDocument
};
