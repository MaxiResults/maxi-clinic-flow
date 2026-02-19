import api from './api';
import {
  AnamneseTemplate,
  TemplateCompleto,
  AnamneseSecao,
  AnamneseCampo,
  Anamnese,
  CriarTemplateForm,
  CriarSecaoForm,
  CriarCampoForm,
  ApiResponse
} from '@/types/anamnese.types';

// ============================================================================
// TEMPLATES
// ============================================================================

export const anamneseTemplatesApi = {
  /**
   * Listar templates
   */
  listar: async (filtros?: {
    tipo?: string;
    ativo?: boolean;
    busca?: string;
  }) => {
    const params = new URLSearchParams();
    if (filtros?.tipo) params.append('tipo', filtros.tipo);
    if (filtros?.ativo !== undefined) params.append('ativo', String(filtros.ativo));
    if (filtros?.busca) params.append('busca', filtros.busca);

    const response = await api.get(`/anamnese/templates?${params.toString()}`);
    return response.data as ApiResponse<AnamneseTemplate[]>;
  },

  /**
   * Buscar template por ID (completo com seções e campos)
   */
  buscarPorId: async (id: string) => {
    const response = await api.get(`/anamnese/templates/${id}`);
    return response.data as ApiResponse<TemplateCompleto>;
  },

  /**
   * Criar template
   */
  criar: async (dados: CriarTemplateForm) => {
    const response = await api.post('/anamnese/templates', dados);
    return response.data as ApiResponse<AnamneseTemplate>;
  },

  /**
   * Atualizar template
   */
  atualizar: async (id: string, dados: Partial<CriarTemplateForm>) => {
    const response = await api.patch(`/anamnese/templates/${id}`, dados);
    return response.data as ApiResponse<AnamneseTemplate>;
  },

  /**
   * Excluir template
   */
  excluir: async (id: string) => {
    const response = await api.delete(`/anamnese/templates/${id}`);
    return response.data as ApiResponse<void>;
  },

  /**
   * Ativar/Desativar template
   */
  toggleAtivo: async (id: string, ativo: boolean) => {
    const response = await api.patch(`/anamnese/templates/${id}/toggle`, { ativo });
    return response.data as ApiResponse<AnamneseTemplate>;
  },

  /**
   * Duplicar template
   */
  duplicar: async (id: string, novoNome?: string) => {
    const response = await api.post(`/anamnese/templates/${id}/duplicar`, {
      novo_nome: novoNome
    });
    return response.data as ApiResponse<TemplateCompleto>;
  }
};

// ============================================================================
// SEÇÕES
// ============================================================================

export const anamneseSecoesApi = {
  /**
   * Listar seções de um template
   */
  listar: async (templateId: string) => {
    const response = await api.get(`/anamnese/templates/${templateId}/secoes`);
    return response.data as ApiResponse<AnamneseSecao[]>;
  },

  /**
   * Criar seção
   */
  criar: async (templateId: string, dados: CriarSecaoForm) => {
    const response = await api.post(`/anamnese/templates/${templateId}/secoes`, dados);
    return response.data as ApiResponse<AnamneseSecao>;
  },

  /**
   * Atualizar seção
   */
  atualizar: async (id: string, dados: Partial<CriarSecaoForm>) => {
    const response = await api.patch(`/anamnese/secoes/${id}`, dados);
    return response.data as ApiResponse<AnamneseSecao>;
  },

  /**
   * Excluir seção
   */
  excluir: async (id: string) => {
    const response = await api.delete(`/anamnese/secoes/${id}`);
    return response.data as ApiResponse<void>;
  },

  /**
   * Reordenar seções
   */
  reordenar: async (
    templateId: string,
    secoes: Array<{ id: string; ordem: number }>
  ) => {
    const response = await api.patch(
      `/anamnese/templates/${templateId}/secoes/reordenar`,
      { secoes }
    );
    return response.data as ApiResponse<AnamneseSecao[]>;
  }
};

// ============================================================================
// CAMPOS
// ============================================================================

export const anamneseCamposApi = {
  /**
   * Listar campos de uma seção
   */
  listar: async (secaoId: string) => {
    const response = await api.get(`/anamnese/secoes/${secaoId}/campos`);
    return response.data as ApiResponse<AnamneseCampo[]>;
  },

  /**
   * Criar campo
   */
  criar: async (secaoId: string, dados: CriarCampoForm) => {
    const response = await api.post(`/anamnese/secoes/${secaoId}/campos`, {
      tipoCampo: dados.tipo_campo,
      label: dados.label,
      campoSistema: dados.campo_sistema,
      placeholder: dados.placeholder,
      opcoes: dados.opcoes,
      validacao: dados.validacao,
      mascara: dados.mascara,
      ordem: dados.ordem,
      obrigatorio: dados.obrigatorio,
      largura: dados.largura,
      ajuda: dados.ajuda
    });
    return response.data as ApiResponse<AnamneseCampo>;
  },

  /**
   * Atualizar campo
   */
  atualizar: async (id: string, dados: Partial<CriarCampoForm>) => {
    const updateData: any = {};
    if (dados.tipo_campo) updateData.tipoCampo = dados.tipo_campo;
    if (dados.label) updateData.label = dados.label;
    if (dados.campo_sistema !== undefined) updateData.campoSistema = dados.campo_sistema;
    if (dados.placeholder !== undefined) updateData.placeholder = dados.placeholder;
    if (dados.opcoes !== undefined) updateData.opcoes = dados.opcoes;
    if (dados.validacao !== undefined) updateData.validacao = dados.validacao;
    if (dados.mascara !== undefined) updateData.mascara = dados.mascara;
    if (dados.ordem !== undefined) updateData.ordem = dados.ordem;
    if (dados.obrigatorio !== undefined) updateData.obrigatorio = dados.obrigatorio;
    if (dados.largura !== undefined) updateData.largura = dados.largura;
    if (dados.ajuda !== undefined) updateData.ajuda = dados.ajuda;

    const response = await api.patch(`/anamnese/campos/${id}`, updateData);
    return response.data as ApiResponse<AnamneseCampo>;
  },

  /**
   * Excluir campo
   */
  excluir: async (id: string) => {
    const response = await api.delete(`/anamnese/campos/${id}`);
    return response.data as ApiResponse<void>;
  },

  /**
   * Reordenar campos
   */
  reordenar: async (
    secaoId: string,
    campos: Array<{ id: string; ordem: number }>
  ) => {
    const response = await api.patch(
      `/anamnese/secoes/${secaoId}/campos/reordenar`,
      { campos }
    );
    return response.data as ApiResponse<AnamneseCampo[]>;
  },

  /**
   * Duplicar campo
   */
  duplicar: async (id: string) => {
    const response = await api.post(`/anamnese/campos/${id}/duplicar`);
    return response.data as ApiResponse<AnamneseCampo>;
  }
};

// ============================================================================
// ANAMNESES
// ============================================================================

export const anamnesesApi = {
  /**
   * Criar anamnese
   */
  criar: async (dados: {
    lead_id?: string;
    cliente_final_id?: string;
    agendamento_id?: string;
    template_id: string;
    link_expira_em?: string;
  }) => {
    const response = await api.post('/anamnese', dados);
    return response.data as ApiResponse<Anamnese>;
  },

  /**
   * Enviar anamnese por WhatsApp
   */
  enviarPorWhatsApp: async (id: string) => {
    const response = await api.post(`/anamnese/${id}/enviar`);
    return response.data as ApiResponse<void>;
  },

  /**
   * Buscar anamnese por token (PÚBLICO - sem auth)
   */
  buscarPorToken: async (token: string) => {
    const response = await api.get(`/anamnese/publico/${token}`);
    return response.data;
  },

  /**
   * Salvar rascunho (PÚBLICO - sem auth)
   */
  salvarRascunho: async (
    token: string,
    respostas: Array<{
      campo_id: string;
      resposta: string;
      resposta_arquivo_url?: string;
    }>,
    progressoPercentual?: number
  ) => {
    const response = await api.patch(`/anamnese/publico/${token}/rascunho`, {
      respostas,
      progresso_percentual: progressoPercentual
    });
    return response.data as ApiResponse<void>;
  },

  /**
   * Finalizar anamnese (PÚBLICO - sem auth)
   */
  finalizar: async (
    token: string,
    dados: {
      respostas: Array<{
        campo_id: string;
        resposta: string;
        resposta_arquivo_url?: string;
      }>;
      assinatura_digital?: string;
      consentimento_lgpd: boolean;
      consentimento_fotos: boolean;
      consentimento_tratamento: boolean;
    }
  ) => {
    const response = await api.post(`/anamnese/publico/${token}/finalizar`, dados);
    return response.data as ApiResponse<void>;
  }
};