import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Tag } from './useTags';

export function useLeadTags(leadId: string | null) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchTags = async () => {
    if (!leadId) return;
    try {
      setLoading(true);
      const response = await api.get(`/leads/${leadId}/tags`);
      const data = response.data?.data ?? response.data;
      setTags(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar tags do lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const atribuirTag = async (tagId: string) => {
    if (!leadId) return;
    try {
      await api.post(`/leads/${leadId}/tags`, { tagId });
      await fetchTags();
      toast({ title: 'Tag atribuída' });
    } catch (error) {
      console.error('Erro ao atribuir tag:', error);
      toast({ title: 'Erro ao atribuir tag', variant: 'destructive' });
    }
  };

  const removerTag = async (tagId: string) => {
    if (!leadId) return;
    try {
      await api.delete(`/leads/${leadId}/tags/${tagId}`);
      setTags(prev => prev.filter(t => t.id !== tagId));
      toast({ title: 'Tag removida' });
    } catch (error) {
      console.error('Erro ao remover tag:', error);
      toast({ title: 'Erro ao remover tag', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  return { tags, loading, atribuirTag, removerTag, refetch: fetchTags };
}
