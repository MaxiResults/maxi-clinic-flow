import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Message {
  id: number;
  sender: 'lead' | 'system';
  text: string;
  timestamp: string;
}

export interface Conversa {
  id: number;
  leadName: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
}

export function useConversas() {
  return useQuery({
    queryKey: ['conversas'],
    queryFn: async () => {
      const response = await api.get<Conversa[]>('/conversas');
      return response.data;
    },
  });
}

export function useConversaHistorico(leadId: number) {
  return useQuery({
    queryKey: ['conversas', leadId, 'historico'],
    queryFn: async () => {
      const response = await api.get<Message[]>(`/conversas/${leadId}/historico`);
      return response.data;
    },
    enabled: !!leadId,
  });
}
