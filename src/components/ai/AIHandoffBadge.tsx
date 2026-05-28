/**
 * AIHandoffBadge Component
 * Badge visual que mostra se a conversa está sendo atendida por IA ou Humano
 * 
 * Features:
 * - Atualização em tempo real via Socket.io
 * - Cores dinâmicas (verde IA, azul Humano)
 * - Tooltip explicativo
 * - Loading state
 * - Mobile responsive
 */

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Loader2 } from 'lucide-react';
import { useAIStatus } from '@/hooks/useAIStatus';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface AIHandoffBadgeProps {
  sessaoId: string;
  className?: string;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showText?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const AIHandoffBadge: React.FC<AIHandoffBadgeProps> = ({
  sessaoId,
  className,
  showTooltip = true,
  size = 'md',
  showIcon = true,
  showText = true,
}) => {
  const {
    aiStatus,
    isLoading,
    isAIActive,
    isQueue,
    badgeColor,
    badgeIcon,
    badgeText,
  } = useAIStatus({ sessaoId });

  // ============================================================================
  // COMPUTED: Classes dinâmicas
  // ============================================================================

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const badgeClasses = cn(
    'font-medium transition-all duration-300',
    sizeClasses[size],
    {
      // IA Ativa: Verde
      'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700':
        isAIActive,
      // Fila: Cinza
      'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-600':
        isQueue,
      // Humano: Azul
      'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700':
        !isAIActive && !isQueue,
    },
    className
  );

  // ============================================================================
  // TOOLTIP CONTENT
  // ============================================================================

  const tooltipContent = isAIActive ? (
    <div className="space-y-1">
      <p className="font-semibold">🤖 Assistente IA Ativo</p>
      <p className="text-xs opacity-90">
        Esta conversa está sendo atendida automaticamente pelo assistente IA.
      </p>
    </div>
  ) : isQueue ? (
    <div className="space-y-1">
      <p className="font-semibold">🏥 Na fila</p>
      <p className="text-xs opacity-90">
        Esta conversa ainda não foi atribuída a um atendente.
      </p>
    </div>
  ) : (
    <div className="space-y-1">
      <p className="font-semibold">👤 {aiStatus?.responsavel?.nome || 'Atendente'}</p>
      <p className="text-xs opacity-90">
        Esta conversa está sendo atendida por {aiStatus?.responsavel?.nome || 'um atendente humano'}.
      </p>
    </div>
  );

  // ============================================================================
  // RENDER: Loading State
  // ============================================================================

  if (isLoading) {
    return (
      <Badge variant="outline" className={cn('gap-1.5', sizeClasses[size], className)}>
        <Loader2 className="h-3 w-3 animate-spin" />
        {showText && <span className="text-xs">Carregando...</span>}
      </Badge>
    );
  }

  // ============================================================================
  // RENDER: Badge Content
  // ============================================================================

  const badgeContent = (
    <Badge variant="outline" className={badgeClasses}>
      <div className="flex items-center gap-1.5">
        {showIcon && (
          <span className="text-base leading-none" aria-label={badgeText}>
            {badgeIcon}
          </span>
        )}
        {showText && (
          <span className="leading-none">{badgeText}</span>
        )}
        
        {/* Pulse indicator para IA ativa */}
        {isAIActive && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
        )}
      </div>
    </Badge>
  );

  // ============================================================================
  // RENDER: Com Tooltip
  // ============================================================================

  if (showTooltip) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            {badgeContent}
          </TooltipTrigger>
          <TooltipContent 
            side="bottom" 
            className="max-w-xs"
            sideOffset={5}
          >
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // ============================================================================
  // RENDER: Sem Tooltip
  // ============================================================================

  return badgeContent;
};

// ============================================================================
// VARIANTS: Componentes especializados
// ============================================================================

/**
 * Badge compacto (apenas ícone)
 */
export const AIHandoffBadgeCompact: React.FC<Omit<AIHandoffBadgeProps, 'showText' | 'showIcon'>> = (props) => {
  return <AIHandoffBadge {...props} showText={false} showIcon={true} size="sm" />;
};

/**
 * Badge com texto completo
 */
export const AIHandoffBadgeFull: React.FC<Omit<AIHandoffBadgeProps, 'showText' | 'showIcon'>> = (props) => {
  return <AIHandoffBadge {...props} showText={true} showIcon={true} size="md" />;
};

/**
 * Badge inline (sem tooltip, para usar em listas)
 */
export const AIHandoffBadgeInline: React.FC<Omit<AIHandoffBadgeProps, 'showTooltip'>> = (props) => {
  return <AIHandoffBadge {...props} showTooltip={false} />;
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default AIHandoffBadge;
