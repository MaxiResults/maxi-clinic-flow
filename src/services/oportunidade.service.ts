import api from '../lib/api';
import {
  Oportunidade,
  WorkflowEtapa,
  LeadAtividade,
  CriarOportunidadeDTO,
  AtualizarOportunidadeDTO,
} from '../types/oportunidade';

// ─────────────────────────────────────────
// Workflow Etapas
// ─────────────────────────────────────────

export const buscarEtapasWorkflow = async (): Promise<WorkflowEtapa[]> => {
  try {
    const response = await api.get('/workflow-etapas');
    return (response.data as WorkflowEtapa[]) || [];
  } catch (error) {
    console.error('[buscarEtapasWorkflow] Erro:', error);
    return [];
  }
};

// ─────────────────────────────────────────
// Oportunidades
// ─────────────────────────────────────────

export const buscarOportunidades = async (filtros?: {
  etapa_id?: number;
  status?: string;
  search?: string;
}): Promise<Oportunidade[]> => {
  try {
    const response = await api.get('/oportunidades', { params: filtros });
    return (response.data as Oportunidade[]) || [];
  } catch (error) {
    console.error('[buscarOportunidades] Erro:', error);
    return [];
  }
};

export const buscarOportunidadePorId = async (id: string): Promise<Oportunidade | null> => {
  try {
    const response = await api.get(`/oportunidades/${id}`);
    return (response.data as Oportunidade) ?? null;
  } catch (error) {
    console.error('[buscarOportunidadePorId] Erro:', error);
    return null;
  }
};

export const criarOportunidade = async (
  dados: CriarOportunidadeDTO
): Promise<{ success: boolean; oportunidade_id?: string; error?: string }> => {
  try {
    const response = await api.post('/oportunidades', dados);
    const data = response.data as { oportunidade_id: string };
    return { success: true, oportunidade_id: data.oportunidade_id };
  } catch (error: any) {
    console.error('[criarOportunidade] Erro:', error);
    const mensagem = error.response?.data?.error || 'Erro ao criar oportunidade';
    return { success: false, error: mensagem };
  }
};

export const atualizarOportunidade = async (
  id: string,
  dados: AtualizarOportunidadeDTO
): Promise<{ success: boolean; error?: string }> => {
  try {
    await api.patch(`/oportunidades/${id}`, dados);
    return { success: true };
  } catch (error: any) {
    console.error('[atualizarOportunidade] Erro:', error);
    const mensagem = error.response?.data?.error || 'Erro ao atualizar oportunidade';
    return { success: false, error: mensagem };
  }
};

export const moverEtapa = async (
  id: string,
  novaEtapaId: number,
  // novaEtapaNome é usado localmente pelo componente para feedback visual
  _novaEtapaNome?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await api.patch(`/oportunidades/${id}/etapa`, { nova_etapa_id: novaEtapaId });
    return { success: true };
  } catch (error: any) {
    console.error('[moverEtapa] Erro:', error);
    const mensagem = error.response?.data?.error || 'Erro ao mover etapa';
    return { success: false, error: mensagem };
  }
};

export const atualizarStatus = async (
  id: string,
  status: 'ganha' | 'perdida' | 'cancelada',
  motivoPerda?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await api.patch(`/oportunidades/${id}/status`, {
      status,
      motivo_perda: motivoPerda,
    });
    return { success: true };
  } catch (error: any) {
    console.error('[atualizarStatus] Erro:', error);
    const mensagem = error.response?.data?.error || 'Erro ao atualizar status';
    return { success: false, error: mensagem };
  }
};

export const deletarOportunidade = async (
  id: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await api.delete(`/oportunidades/${id}`);
    return { success: true };
  } catch (error: any) {
    console.error('[deletarOportunidade] Erro:', error);
    const mensagem = error.response?.data?.error || 'Erro ao deletar oportunidade';
    return { success: false, error: mensagem };
  }
};

export const buscarAtividades = async (filtros: {
  oportunidade_id: string;
  limit?: number;
}): Promise<LeadAtividade[]> => {
  try {
    const { oportunidade_id, limit = 20 } = filtros;
    const response = await api.get(`/oportunidades/${oportunidade_id}/atividades`, {
      params: { limit },
    });
    return (response.data as LeadAtividade[]) || [];
  } catch (error) {
    console.error('[buscarAtividades] Erro:', error);
    return [];
  }
};
