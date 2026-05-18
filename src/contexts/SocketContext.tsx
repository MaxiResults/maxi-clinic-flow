import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/useAuth';
import { useUnread } from '@/contexts/UnreadContext';

interface NovaConversaEvent {
  lead: any;
  timestamp: number;
}

interface ConversaAtualizadaEvent {
  leadId: string;
  sessaoId: string;
  ultima_mensagem: {
    mensagem: string;
    data_envio: string;
    tipo_mensagem: string;
  };
  ultima_interacao: string;
  timestamp: number;
}

interface SocketContextType {
  socket: Socket | null;
  lastNovaConversa: NovaConversaEvent | null;
  lastConversaAtualizada: ConversaAtualizadaEvent | null;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  lastNovaConversa: null,
  lastConversaAtualizada: null,
});

export const SocketProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useAuth();
  const { setTotalUnread } = useUnread();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [lastNovaConversa, setLastNovaConversa] =
    useState<NovaConversaEvent | null>(null);
  const [lastConversaAtualizada, setLastConversaAtualizada] =
    useState<ConversaAtualizadaEvent | null>(null);

  useEffect(() => {
    if (!user?.cliente_id || !user?.empresa_id) return;

    const socketConnection = io('https://api.maxiclinicas.com.br', {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socketConnection.on('connect', () => {
      console.log('[Socket.io Global] Conectado:', socketConnection.id);
      socketConnection.emit('join_clinic', {
        clienteId: user.cliente_id,
        empresaId: user.empresa_id,
      });
    });

    socketConnection.on('disconnect', () => {
      console.log('[Socket.io Global] Desconectado');
    });

    socketConnection.on('connect_error', (err) => {
      console.error('[Socket.io Global] Erro:', err.message);
    });

    socketConnection.on('nova_conversa', (data: any) => {
      console.log('[Socket.io Global] nova_conversa:', data);
      setLastNovaConversa({ ...data, timestamp: Date.now() });
      if (!window.location.pathname.includes('/conversas')) {
        setTotalUnread((prev) => prev + 1);
      }
    });

    socketConnection.on('conversa_atualizada', (data: any) => {
      console.log('[Socket.io Global] conversa_atualizada:', data);
      setLastConversaAtualizada({ ...data, timestamp: Date.now() });
      if (!window.location.pathname.includes('/conversas')) {
        setTotalUnread((prev) => prev + 1);
      }
    });

    setSocket(socketConnection);

    return () => {
      socketConnection.disconnect();
      setSocket(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.cliente_id, user?.empresa_id]);

  return (
    <SocketContext.Provider
      value={{ socket, lastNovaConversa, lastConversaAtualizada }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
