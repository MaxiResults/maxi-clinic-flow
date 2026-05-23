import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface Tag {
  id: string;
  Cliente_ID?: number;
  Empresa_ID?: number;
  nome: string;
  cor: string;
  icone: string;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTags = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tags');
      if (response.data?.success) {
        setTags(response.data.data);
      } else if (Array.isArray(response.data)) {
        setTags(response.data);
      }
    } catch (error) {
      console.error('Erro ao buscar tags:', error);
      toast({ title: 'Erro ao carregar tags', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const criarTag = async (nome: string, cor: string, icone: string = 'Tag') => {
    try {
      const response = await api.post('/tags', { nome, cor, icone });
      const nova = response.data?.data ?? response.data;
      if (nova) {
        setTags((prev) => [...prev, nova]);
        toast({ title: 'Tag criada com sucesso' });
        return nova;
      }
    } catch (error) {
      console.error('Erro ao criar tag:', error);
      toast({ title: 'Erro ao criar tag', variant: 'destructive' });
      throw error;
    }
  };

  const atualizarTag = async (id: string, nome: string, cor: string, icone: string) => {
    try {
      const response = await api.patch(`/tags/${id}`, { nome, cor, icone });
      const atualizada = response.data?.data ?? response.data;
      setTags((prev) => prev.map((t) => (t.id === id ? { ...t, ...atualizada } : t)));
      toast({ title: 'Tag atualizada com sucesso' });
    } catch (error) {
      console.error('Erro ao atualizar tag:', error);
      toast({ title: 'Erro ao atualizar tag', variant: 'destructive' });
      throw error;
    }
  };

  const deletarTag = async (id: string) => {
    try {
      await api.delete(`/tags/${id}`);
      setTags((prev) => prev.filter((t) => t.id !== id));
      toast({ title: 'Tag removida com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar tag:', error);
      toast({ title: 'Erro ao deletar tag', variant: 'destructive' });
      throw error;
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  return { tags, loading, criarTag, atualizarTag, deletarTag, refetch: fetchTags };
}