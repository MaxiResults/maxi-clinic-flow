import { Badge } from "@/components/ui/badge";

type StatusType =
  | "novo"
  | "qualificado"
  | "convertido"
  | "agendado"
  | "confirmado"
  | "cancelado"
  | "concluido";

interface StatusBadgeProps {
  status: StatusType;
}

const statusConfig = {
  novo: { label: "Novo", variant: "default" as const },
  qualificado: { label: "Qualificado", variant: "secondary" as const },
  convertido: { label: "Convertido", variant: "default" as const },
  agendado: { label: "Agendado", variant: "default" as const },
  confirmado: { label: "Confirmado", variant: "default" as const },
  cancelado: { label: "Cancelado", variant: "destructive" as const },
  concluido: { label: "Concluído", variant: "secondary" as const },
};

const statusColors = {
  novo: "bg-status-new/10 text-status-new border-status-new/20",
  qualificado: "bg-status-qualified/10 text-status-qualified border-status-qualified/20",
  convertido: "bg-status-converted/10 text-status-converted border-status-converted/20",
  agendado: "bg-status-scheduled/10 text-status-scheduled border-status-scheduled/20",
  confirmado: "bg-status-confirmed/10 text-status-confirmed border-status-confirmed/20",
  cancelado: "bg-status-cancelled/10 text-status-cancelled border-status-cancelled/20",
  concluido: "bg-status-completed/10 text-status-completed border-status-completed/20",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  const colorClass = statusColors[status];

  return (
    <Badge variant="outline" className={`${colorClass} font-medium`}>
      {config.label}
    </Badge>
  );
}
