import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PresenceBadgeProps {
  status: 'online' | 'ausente' | 'offline';
  lastActivity?: string;
  nome?: string;
  showName?: boolean;
}

const config = {
  online: { color: 'bg-green-500', label: 'Online' },
  ausente: { color: 'bg-yellow-500', label: 'Ausente' },
  offline: { color: 'bg-gray-400', label: 'Offline' },
};

export function PresenceBadge({
  status,
  lastActivity,
  nome,
  showName = true,
}: PresenceBadgeProps) {
  const { color, label } = config[status];

  let tooltipText = label;
  if (lastActivity && status !== 'online') {
    try {
      tooltipText = `${label} — última atividade há ${formatDistanceToNow(
        new Date(lastActivity),
        { locale: ptBR }
      )}`;
    } catch {
      // ignore parse errors
    }
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${color} flex-shrink-0`} />
            {showName && nome && (
              <span className="text-sm text-foreground truncate">{nome}</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}