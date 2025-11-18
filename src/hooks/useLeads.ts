import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Lead {
  id: number;
  name: string;
  phone: string;
  email: string;
  status: 'novo' | 'qualificado' | 'convertido';
  channel: string;
  date: string;
  notes: string;
}

export function useLeads() {
  return useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const response = await api.get<Lead[]>('/leads');
      return response.data;
    },
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (lead: Omit<Lead, 'id'>) => {
      const response = await api.post<Lead>('/leads', lead);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...lead }: Partial<Lead> & { id: number }) => {
      const response = await api.put<Lead>(`/leads/${id}`, lead);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}
