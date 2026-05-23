import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagBadgeProps {
  nome: string;
  cor: string;
  onRemove?: () => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function TagBadge({ nome, cor, onRemove, size = 'sm', className }: TagBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
  };

  return (
    <Badge
      className={cn('gap-1 font-medium border', sizeClasses[size], className)}
      style={{ backgroundColor: cor, color: '#FFFFFF', borderColor: cor }}
    >
      {nome}
      {onRemove && (
        <X
          className="h-3 w-3 cursor-pointer hover:opacity-70"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        />
      )}
    </Badge>
  );
}