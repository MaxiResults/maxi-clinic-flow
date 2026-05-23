import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Tag } from './useTags';

export function useConversaTags(sessaoId: string | null) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchTags = async () => {
    if (!sessaoId) return;
    try {
      setLoading(true);
      const response = await api.get(`/tags/conversa/${sessaoId}`);
      const data = response.data?.data ?? response.data;
      setTags(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar tags da conversa:', error);
    } finally {
      setLoading(false);
    }
  };

  const atribuirTag = async (tagId: string) => {
    if (!sessaoId) return;
    try {
      await api.post('/tags/atribuir', { sessaoId, tagId });
      await fetchTags();
      toast({ title: 'Tag atribuída' });
    } catch (error) {
      console.error('Erro ao atribuir tag:', error);
      toast({ title: 'Erro ao atribuir tag', variant: 'destructive' });
    }
  };

  const removerTag = async (tagId: string) => {
    if (!sessaoId) return;
    try {
      await api.delete(`/tags/remover/${sessaoId}/${tagId}`);
      setTags((prev) => prev.filter((t) => t.id !== tagId));
      toast({ title: 'Tag removida' });
    } catch (error) {
      console.error('Erro ao remover tag:', error);
      toast({ title: 'Erro ao remover tag', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessaoId]);

  return { tags, loading, atribuirTag, removerTag, refetch: fetchTags };
}