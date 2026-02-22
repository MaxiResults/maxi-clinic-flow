import api from '../lib/api';
import { AnamneseListResponse, AnamneseMetricasResponse } from '../types/anamnese';

export const anamneseService = {
  /**
   * Listar anamneses com paginação e filtros
   */
  async listar(params?: {
    page?: number;
    limit?: number;
    status?: string;
    template_id?: string;
    lead_id?: string;
    data_inicio?: string;
    data_fim?: string;
  }): Promise<AnamneseListResponse> {
    const response = await api.get('/anamnese/', { params });
    return response.data;
  },

  /**
   * Buscar métricas do dashboard
   */
  async buscarMetricas(): Promise<AnamneseMetricasResponse> {
    const response = await api.get('/anamnese/metricas');
    return response.data;
  },

  /**
   * Baixar PDF em branco
   */
  async downloadPDFBranco(id: string): Promise<Blob> {
    const response = await api.get(`/pdf/anamnese/${id}/branco`, {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Baixar PDF preenchido
   */
  async downloadPDFPreenchido(id: string): Promise<Blob> {
    const response = await api.get(`/pdf/anamnese/${id}/preenchido`, {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Reenviar anamnese por WhatsApp
   */
  async reenviar(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/anamnese/${id}/enviar`);
    return response.data;
  }
};