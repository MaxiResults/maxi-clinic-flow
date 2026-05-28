/**
 * useAIStatus Hook
 * Gerencia o status IA/Humano de uma conversa com real-time updates
 * 
 * Features:
 * - TanStack Query para server state
 * - Socket.io para updates real-time
 * - Cache automático
 * - Revalidação em background
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { getAIStatus, type AIStatus } from '@/services/ai.service';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// TYPES
// ============================================================================

interface UseAIStatusOptions {
  sessaoId: string;
  enabled?: boolean; // Habilitar query (padrão: true)
  refetchInterval?: number; // Auto-refetch interval em ms
}

interface AIStatusHookReturn {
  // Estado
  aiStatus: AIStatus | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;

  // Computed
  isAIActive: boolean;
  isHumanActive: boolean;
  isQueue: boolean;
  attendantName: string | undefined;
  badgeColor: 'green' | 'blue' | 'gray';
  badgeIcon: '🤖' | '👤' | '🏥';
  badgeText: string;

  refetch: () => void;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

const aiStatusKeys = {
  all: ['ai-status'] as const,
  status: (sessaoId: string) => [...aiStatusKeys.all, sessaoId] as const,
};

// ============================================================================
// HOOK
// ============================================================================

export const useAIStatus = ({
  sessaoId,
  enabled = true,
  refetchInterval
}: UseAIStatusOptions): AIStatusHookReturn => {
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const { toast } = useToast();

  // ============================================================================
  // QUERY: Buscar status IA
  // ============================================================================
  
  const {
    data: aiStatus,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: aiStatusKeys.status(sessaoId),
    queryFn: () => getAIStatus(sessaoId),
    enabled: enabled && !!sessaoId,
    refetchInterval,
    staleTime: 1000 * 30, // 30 segundos
    gcTime: 1000 * 60 * 5, // 5 minutos (antigo cacheTime)
    retry: 2,
  });

  // ============================================================================
  // SOCKET.IO: Real-time updates
  // ============================================================================
  
  useEffect(() => {
    if (!socket || !sessaoId) return;

    // Event: Responsável da conversa mudou (assign/transfer/handoff)
    const handleAssignmentChanged = (data: { sessaoId: string }) => {
      if (data.sessaoId === sessaoId) {
        queryClient.invalidateQueries({
          queryKey: aiStatusKeys.status(sessaoId),
        });
      }
    };

    // Event: Handoff IA → Humano
    const handleAIHandoff = (data: {
      sessaoId: string;
      trigger: string;
      reason?: string;
    }) => {
      if (data.sessaoId === sessaoId) {
        queryClient.invalidateQueries({ 
          queryKey: aiStatusKeys.status(sessaoId) 
        });
        
        toast({
          title: '🤝 Handoff para humano',
          description: data.reason || 'A conversa foi transferida para atendimento humano',
          variant: 'default',
        });
      }
    };

    // Event: IA assumiu conversa
    const handleAITakeover = (data: {
      sessaoId: string;
      reason?: string;
    }) => {
      if (data.sessaoId === sessaoId) {
        queryClient.invalidateQueries({ 
          queryKey: aiStatusKeys.status(sessaoId) 
        });
        
        toast({
          title: '🤖 IA assumiu',
          description: data.reason || 'O assistente IA está agora atendendo esta conversa',
          variant: 'default',
        });
      }
    };

    // Registrar listeners
    socket.on('ai_status_changed', handleAssignmentChanged);
    socket.on('conversa_atribuida', handleAssignmentChanged);
    socket.on('conversa_transferida', handleAssignmentChanged);
    socket.on('ai_handoff', handleAIHandoff);
    socket.on('ai_takeover', handleAITakeover);

    // Cleanup
    return () => {
      socket.off('ai_status_changed', handleAssignmentChanged);
      socket.off('conversa_atribuida', handleAssignmentChanged);
      socket.off('conversa_transferida', handleAssignmentChanged);
      socket.off('ai_handoff', handleAIHandoff);
      socket.off('ai_takeover', handleAITakeover);
    };
  }, [socket, sessaoId, queryClient, refetch, toast]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const isAIActive = aiStatus?.responsavel?.is_ai_agent === true;
  const isQueue = aiStatus?.responsavel?.is_default === true;
  const isHumanActive = !!aiStatus?.responsavel && !isAIActive && !isQueue;
  const attendantName = aiStatus?.responsavel?.nome;

  const badgeColor: 'green' | 'blue' | 'gray' = isAIActive
    ? 'green'
    : isQueue
      ? 'gray'
      : 'blue';
  const badgeIcon: '🤖' | '👤' | '🏥' = isAIActive ? '🤖' : isQueue ? '🏥' : '👤';
  const badgeText = isAIActive
    ? 'Agente IA'
    : isQueue
      ? 'Fila'
      : attendantName || 'Atendente';

  // ============================================================================
  // RETURN
  // ============================================================================
  
  return {
    // Estado
    aiStatus,
    isLoading,
    isError,
    error: error as Error | null,

    // Computed
    isAIActive,
    isHumanActive,
    isQueue,
    attendantName,
    badgeColor,
    badgeIcon,
    badgeText,

    refetch,
  };
};

// ============================================================================
// HELPER: Invalidar cache de status IA
// ============================================================================

export const useInvalidateAIStatus = () => {
  const queryClient = useQueryClient();
  
  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: aiStatusKeys.all });
    },
    invalidateSession: (sessaoId: string) => {
      queryClient.invalidateQueries({ queryKey: aiStatusKeys.status(sessaoId) });
    }
  };
};
