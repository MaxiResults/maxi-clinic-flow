import api from '../lib/api';

export interface GoogleCalendarStatus {
  isConnected: boolean;
  googleEmail: string | null;
  lastSync: Date | null;
  totalEvents: number;
  syncedEvents: number;
  pendingEvents: number;
  errorEvents: number;
}

export interface SyncAllResult {
  synced: number;
  errors: number;
  details?: Array<{
    id: string;
    success: boolean;
    error?: string;
  }>;
}

/**
 * Busca status da integração Google Calendar
 */
export const getStatus = async (): Promise<GoogleCalendarStatus> => {
  const response = await api.get('/calendar/status');
  return response.data;
};

/**
 * Inicia processo de conexão OAuth com Google
 * Retorna URL de autorização que deve ser aberta em nova aba
 */
export const connect = async (): Promise<{ authUrl: string }> => {
  const response = await api.get('/calendar/connect');
  return response.data;
};

/**
 * Desconecta integração com Google Calendar
 */
export const disconnect = async (): Promise<void> => {
  await api.post('/calendar/disconnect');
};

/**
 * Força sincronização de todos os agendamentos pendentes
 */
export const syncAll = async (): Promise<SyncAllResult> => {
  const response = await api.post('/calendar/sync-all');
  return response.data;
};

/**
 * Força sincronização de um agendamento específico
 */
export const syncAgendamento = async (agendamentoId: string): Promise<{ success: boolean; eventId?: string }> => {
  const response = await api.post(`/calendar/sync/${agendamentoId}`);
  return response.data;
};
