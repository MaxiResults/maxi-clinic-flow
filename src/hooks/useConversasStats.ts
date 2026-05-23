import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { useSocket } from '@/contexts/SocketContext';

export function useConversasStats() {
  const { socket } = useSocket();
  const [totalNaoLidas, setTotalNaoLidas] = useState(0);
  const [totalAtivas, setTotalAtivas] = useState(0);

  const refetch = useCallback(async () => {
    try {
      const { data } = await api.get('/conversas/stats');
      setTotalNaoLidas(data?.total_nao_lidas ?? 0);
      setTotalAtivas(data?.total_conversas_ativas ?? 0);
    } catch (err) {
      console.error('[useConversasStats] erro:', err);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (!socket) return;
    const handler = () => refetch();
    socket.on('nova_mensagem_nao_lida', handler);
    socket.on('mensagens_lidas', handler);
    socket.on('nova_conversa', handler);
    socket.on('conversa_atualizada', handler);
    return () => {
      socket.off('nova_mensagem_nao_lida', handler);
      socket.off('mensagens_lidas', handler);
      socket.off('nova_conversa', handler);
      socket.off('conversa_atualizada', handler);
    };
  }, [socket, refetch]);

  return { totalNaoLidas, totalAtivas, refetch };
}