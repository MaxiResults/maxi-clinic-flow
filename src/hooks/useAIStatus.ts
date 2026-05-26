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

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { 
  getAIStatus, 
  toggleAIForConversation, 
  assumirAtendimento,
  type AIStatus 
} from '@/services/ai.service';
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
  badgeColor: 'green' | 'blue';
  badgeIcon: '🤖' | '👤';
  badgeText: string;
  
  // Actions
  toggleAI: (enabled: boolean) => Promise<void>;
  assumirManualmente: () => Promise<void>;
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
  // MUTATION: Toggle IA
  // ============================================================================
  
  const toggleMutation = useMutation({
    mutationFn: async (enabledValue: boolean) => {
      await toggleAIForConversation(sessaoId, enabledValue);
    },
    onSuccess: (_, enabledValue) => {
      // Invalidar cache para forçar refetch
      queryClient.invalidateQueries({ 
        queryKey: aiStatusKeys.status(sessaoId) 
      });
      
      toast({
        title: enabledValue ? 'IA ativada' : 'IA desativada',
        description: enabledValue 
          ? 'O assistente IA está agora ativo nesta conversa'
          : 'Atendimento humano ativado',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao alterar modo',
        description: error.message || 'Não foi possível alterar o modo de atendimento',
        variant: 'destructive',
      });
    }
  });

  // ============================================================================
  // MUTATION: Assumir manualmente
  // ============================================================================
  
  const assumirMutation = useMutation({
    mutationFn: async () => {
      await assumirAtendimento(sessaoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: aiStatusKeys.status(sessaoId) 
      });
      
      toast({
        title: 'Atendimento assumido',
        description: 'Você está agora atendendo esta conversa manualmente',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao assumir atendimento',
        description: error.message || 'Não foi possível assumir o atendimento',
        variant: 'destructive',
      });
    }
  });

  // ============================================================================
  // SOCKET.IO: Real-time updates
  // ============================================================================
  
  useEffect(() => {
    if (!socket || !sessaoId) return;

    // Event: Status da IA mudou
    const handleAIStatusChanged = (data: {
      sessaoId: string;
      aiEnabled: boolean;
      tipoAtendimento: 'ai' | 'humano';
    }) => {
      if (data.sessaoId === sessaoId) {
        // Atualizar cache otimisticamente
        queryClient.setQueryData<AIStatus>(
          aiStatusKeys.status(sessaoId),
          (old) => old ? {
            ...old,
            aiEnabledEfetivo: data.aiEnabled,
            tipoAtendimentoAtual: data.tipoAtendimento
          } : undefined
        );
        
        // Refetch para garantir sincronização
        refetch();
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
    socket.on('ai_status_changed', handleAIStatusChanged);
    socket.on('ai_handoff', handleAIHandoff);
    socket.on('ai_takeover', handleAITakeover);

    // Cleanup
    return () => {
      socket.off('ai_status_changed', handleAIStatusChanged);
      socket.off('ai_handoff', handleAIHandoff);
      socket.off('ai_takeover', handleAITakeover);
    };
  }, [socket, sessaoId, queryClient, refetch, toast]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  
  const isAIActive = aiStatus?.tipoAtendimentoAtual === 'ai' && 
                     aiStatus?.aiEnabledEfetivo === true;
  
  const isHumanActive = aiStatus?.tipoAtendimentoAtual === 'humano' || 
                        aiStatus?.aiEnabledEfetivo === false;
  
  const badgeColor = isAIActive ? 'green' : 'blue';
  const badgeIcon = isAIActive ? '🤖' : '👤';
  const badgeText = isAIActive ? 'IA ativa' : 'Humano';

  // ============================================================================
  // ACTIONS
  // ============================================================================
  
  const toggleAI = async (enabledValue: boolean) => {
    await toggleMutation.mutateAsync(enabledValue);
  };

  const assumirManualmente = async () => {
    await assumirMutation.mutateAsync();
  };

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
    badgeColor,
    badgeIcon,
    badgeText,
    
    // Actions
    toggleAI,
    assumirManualmente,
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
