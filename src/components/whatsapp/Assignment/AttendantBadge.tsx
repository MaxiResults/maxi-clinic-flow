import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserCircle, ArrowRightLeft } from "lucide-react";

interface AttendantBadgeProps {
  atendente?: {
    id: string;
    nome: string;
    email?: string;
  };
  onTransfer?: () => void;
  showTransferButton?: boolean;
}

export function AttendantBadge({
  atendente,
  onTransfer,
  showTransferButton = true,
}: AttendantBadgeProps) {
  if (!atendente) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <UserCircle className="h-4 w-4" />
        <span>Não atribuído</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-7 w-7">
        <AvatarFallback className="text-xs">
          {atendente.nome.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm font-medium">{atendente.nome}</span>
      {showTransferButton && onTransfer && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onTransfer}
          title="Transferir conversa"
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
