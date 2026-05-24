import { useState } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface EncaminharDTO {
  mensagemIds: string[];
  numeroDestino: string;
  nomeDestino: string;
  sessaoOrigemId: string;
}

export function useEncaminhamento() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const encaminharMensagens = async (dto: EncaminharDTO) => {
    try {
      setLoading(true);
      const response = await api.post('/encaminhamento', dto);

      if (response.data.success) {
        const { total, enviadas, falhas } = response.data.data || {};
        toast({
          title: 'Mensagens encaminhadas',
          description: `${enviadas ?? dto.mensagemIds.length} de ${total ?? dto.mensagemIds.length} mensagens enviadas com sucesso${
            falhas > 0 ? `. ${falhas} falharam.` : ''
          }`,
        });
        return { success: true, ...response.data };
      } else {
        throw new Error(response.data.error || 'Falha ao encaminhar');
      }
    } catch (error: any) {
      console.error('Erro ao encaminhar mensagens:', error);
      toast({
        title: 'Erro ao encaminhar',
        description: error.response?.data?.error || error.message || 'Erro ao encaminhar mensagens',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const listarHistorico = async (sessaoId: string) => {
    try {
      const response = await api.get(`/encaminhamento/historico/${sessaoId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      return { success: false, error: 'Erro ao buscar histórico' };
    }
  };

  return { encaminharMensagens, listarHistorico, loading };
}
