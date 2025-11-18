import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Agendamento {
  id: number;
  clientName: string;
  professional: string;
  service: string;
  date: string;
  time: string;
  status: 'agendado' | 'confirmado' | 'cancelado' | 'concluido';
}

export function useAgendamentos() {
  return useQuery({
    queryKey: ['agendamentos'],
    queryFn: async () => {
      const response = await api.get<Agendamento[]>('/agendamentos');
      return response.data;
    },
  });
}

export function useCreateAgendamento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (agendamento: Omit<Agendamento, 'id'>) => {
      const response = await api.post<Agendamento>('/agendamentos', agendamento);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
    },
  });
}

export function useUpdateAgendamento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...agendamento }: Partial<Agendamento> & { id: number }) => {
      const response = await api.put<Agendamento>(`/agendamentos/${id}`, agendamento);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
    },
  });
}
