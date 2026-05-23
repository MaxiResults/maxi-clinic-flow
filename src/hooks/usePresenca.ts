import { useEffect, useState } from 'react';
import { useSocket } from '@/contexts/SocketContext';

export interface UserPresence {
  userId: string;
  nome: string;
  status: 'online' | 'ausente' | 'offline';
  lastActivity?: string;
}

export function usePresenca() {
  const { socket } = useSocket();
  const [usuarios, setUsuarios] = useState<UserPresence[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleOnlineUsers = (users: UserPresence[]) => {
      setUsuarios(Array.isArray(users) ? users : []);
    };

    const handleStatusChanged = (data: {
      userId: string;
      status: 'online' | 'ausente' | 'offline';
      nome?: string;
      lastActivity?: string;
    }) => {
      setUsuarios((prev) => {
        const exists = prev.find((u) => u.userId === data.userId);
        if (data.status === 'offline') {
          return prev.filter((u) => u.userId !== data.userId);
        }
        if (exists) {
          return prev.map((u) =>
            u.userId === data.userId
              ? { ...u, status: data.status, lastActivity: data.lastActivity ?? u.lastActivity }
              : u
          );
        }
        return [
          ...prev,
          {
            userId: data.userId,
            nome: data.nome || '',
            status: data.status,
            lastActivity: data.lastActivity,
          },
        ];
      });
    };

    socket.on('online_users', handleOnlineUsers);
    socket.on('user_status_changed', handleStatusChanged);

    // Heartbeat de atividade
    const interval = setInterval(() => {
      socket.emit('activity');
    }, 30000);

    return () => {
      socket.off('online_users', handleOnlineUsers);
      socket.off('user_status_changed', handleStatusChanged);
      clearInterval(interval);
    };
  }, [socket]);

  return { usuarios };
}