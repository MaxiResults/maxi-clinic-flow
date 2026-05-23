import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface RespostaRapida {
  id: string;
  cliente_id: number;
  empresa_id: number;
  atalho: string;
  titulo: string;
  conteudo: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export function useRespostasRapidas() {
  const [respostas, setRespostas] = useState<RespostaRapida[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRespostas = async (filters?: { ativo?: boolean; busca?: string }) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters?.ativo !== undefined) params.append('ativo', String(filters.ativo));
      if (filters?.busca) params.append('busca', filters.busca);

      const qs = params.toString();
      const response = await api.get(`/respostas-rapidas${qs ? `?${qs}` : ''}`);
      setRespostas(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Erro ao carregar respostas rápidas';
      setError(errorMsg);
      toast({
        title: 'Erro',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createResposta = async (data: {
    atalho: string;
    titulo: string;
    conteudo: string;
    ativo?: boolean;
  }) => {
    try {
      await api.post('/respostas-rapidas', data);
      toast({ title: 'Sucesso', description: 'Resposta rápida criada com sucesso' });
      await fetchRespostas();
      return true;
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.response?.data?.error || 'Erro ao criar resposta rápida',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateResposta = async (id: string, data: Partial<RespostaRapida>) => {
    try {
      await api.patch(`/respostas-rapidas/${id}`, data);
      toast({ title: 'Sucesso', description: 'Resposta rápida atualizada com sucesso' });
      await fetchRespostas();
      return true;
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.response?.data?.error || 'Erro ao atualizar resposta rápida',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteResposta = async (id: string) => {
    try {
      await api.delete(`/respostas-rapidas/${id}`);
      toast({ title: 'Sucesso', description: 'Resposta rápida removida com sucesso' });
      await fetchRespostas();
      return true;
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.response?.data?.error || 'Erro ao remover resposta rápida',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchRespostas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    respostas,
    loading,
    error,
    fetchRespostas,
    createResposta,
    updateResposta,
    deleteResposta,
  };
}