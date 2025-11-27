import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface Lead {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  cpf?: string;
  canal_origem: string;
  campanha?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  origem_url?: string;
  status: 'novo' | 'qualificado' | 'convertido';
  interesse?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export function useLeadsData() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/leads', {
        params: { t: Date.now() }
      });
      const leadsArray = response.data || [];
      
      setLeads(leadsArray);
    } catch (err: any) {
      setError(err.message);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const createLead = useCallback(async (data: Partial<Lead>): Promise<Lead | null> => {
    try {
      const response = await api.post('/leads', data);
      
      toast({
        title: "✅ Sucesso!",
        description: "Lead criado com sucesso!",
      });
      
      await fetchLeads();
      return response.data;
    } catch (err: any) {
      toast({
        title: "❌ Erro",
        description: err.message || "Erro ao criar lead. Tente novamente.",
        variant: "destructive",
      });
      return null;
    }
  }, [fetchLeads, toast]);

  const updateLead = useCallback(async (id: string, data: Partial<Lead>): Promise<Lead | null> => {
    try {
      const response = await api.patch(`/leads/${id}`, data);
      
      toast({
        title: "✅ Sucesso!",
        description: "Lead atualizado com sucesso!",
      });
      
      await fetchLeads();
      return response.data;
    } catch (err: any) {
      toast({
        title: "❌ Erro",
        description: err.message || "Erro ao atualizar lead. Tente novamente.",
        variant: "destructive",
      });
      return null;
    }
  }, [fetchLeads, toast]);

  const deleteLead = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/leads/${id}`);
      
      toast({
        title: "✅ Sucesso!",
        description: "Lead excluído com sucesso!",
      });
      
      await fetchLeads();
      return true;
    } catch (err: any) {
      toast({
        title: "❌ Erro",
        description: err.message || "Erro ao excluir lead. Tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  }, [fetchLeads, toast]);

  const refreshLeads = useCallback(async () => {
    await fetchLeads();
  }, [fetchLeads]);

  return {
    leads,
    loading,
    error,
    fetchLeads,
    createLead,
    updateLead,
    deleteLead,
    refreshLeads,
  };
}
