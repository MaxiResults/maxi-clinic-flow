import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, XCircle, PauseCircle } from 'lucide-react';

interface TemplateStatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected' | 'paused';
}

export function TemplateStatusBadge({ status }: TemplateStatusBadgeProps) {
  const config = {
    pending: {
      label: 'Aguardando Aprovação',
      icon: Clock,
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100',
    },
    approved: {
      label: 'Aprovado',
      icon: CheckCircle2,
      className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100',
    },
    rejected: {
      label: 'Rejeitado',
      icon: XCircle,
      className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100',
    },
    paused: {
      label: 'Pausado',
      icon: PauseCircle,
      className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100',
    },
  };

  const { label, icon: Icon, className } = config[status];

  return (
    <Badge variant="outline" className={className}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
}