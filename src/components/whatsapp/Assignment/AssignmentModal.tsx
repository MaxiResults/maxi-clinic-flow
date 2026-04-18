import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface Atendente {
  id: string;
  nome: string;
  email: string;
  status: "online" | "ausente" | "offline";
  conversas_ativas: number;
}

interface AssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  currentAtendente?: {
    id: string;
    nome: string;
  };
  onSuccess: () => void;
}

export function AssignmentModal({
  open,
  onOpenChange,
  conversationId,
  currentAtendente,
  onSuccess,
}: AssignmentModalProps) {
  const { toast } = useToast();
  const [atendentes, setAtendentes] = useState<Atendente[]>([]);
  const [selectedAtendente, setSelectedAtendente] = useState("");
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingAtendentes, setLoadingAtendentes] = useState(true);

  const isTransfer = !!currentAtendente;

  useEffect(() => {
    if (open) {
      setSelectedAtendente("");
      setMotivo("");
      fetchAtendentes();
    }
  }, [open]);

  const fetchAtendentes = async () => {
    try {
      setLoadingAtendentes(true);
      const response = await api.get("/atendentes/disponiveis");
      setAtendentes(response.data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar atendentes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingAtendentes(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAtendente) {
      toast({ title: "Selecione um atendente", variant: "destructive" });
      return;
    }
    if (isTransfer && !motivo.trim()) {
      toast({
        title: "Motivo é obrigatório para transferências",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const endpoint = isTransfer
        ? `/conversas/${conversationId}/transfer`
        : `/conversas/${conversationId}/assign`;

      const payload = isTransfer
        ? { para_atendente_id: selectedAtendente, motivo }
        : { atendente_id: selectedAtendente, motivo };

      await api.post(endpoint, payload);

      toast({
        title: isTransfer ? "Conversa transferida" : "Conversa atribuída",
        description: "A ação foi realizada com sucesso",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status: string) => {
    if (status === "online") return "bg-green-500";
    if (status === "ausente") return "bg-yellow-500";
    return "bg-gray-400";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isTransfer ? "Transferir Conversa" : "Atribuir Conversa"}
          </DialogTitle>
          <DialogDescription>
            {isTransfer
              ? `Transferir de ${currentAtendente?.nome} para outro atendente`
              : "Selecione um atendente para atribuir esta conversa"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loadingAtendentes ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Atendente</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {atendentes
                    .filter(
                      (a) => !currentAtendente || a.id !== currentAtendente.id,
                    )
                    .map((atendente) => (
                      <div
                        key={atendente.id}
                        onClick={() => setSelectedAtendente(atendente.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedAtendente === atendente.id
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <div className="relative">
                          <Avatar>
                            <AvatarFallback>
                              {atendente.nome.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-background ${statusColor(atendente.status)}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {atendente.nome}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {atendente.email}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="outline" className="capitalize">
                            {atendente.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {atendente.conversas_ativas} conversas
                          </span>
                        </div>
                      </div>
                    ))}
                  {atendentes.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum atendente disponível
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  Motivo {isTransfer && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder={
                    isTransfer
                      ? "Informe o motivo da transferência"
                      : "Motivo (opcional)"
                  }
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isTransfer ? "Transferir" : "Atribuir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
