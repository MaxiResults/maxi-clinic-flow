import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Bot, Building2, Loader2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface AtendenteHumano {
  id: string;
  nome: string;
  email?: string;
  status?: string;
  conversas_ativas?: number;
}

interface AgenteIA {
  id: string;
  nome: string;
  is_ai_agent: true;
  disponivel?: boolean;
}

interface AtendentePadrao {
  id: string;
  nome: string;
  is_default: true;
}

interface DisponiveisResponse {
  ia?: AgenteIA | null;
  humanos?: AtendenteHumano[];
  padrao?: AtendentePadrao | null;
}

interface AssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  currentAtendente?: {
    id: string;
    nome: string;
  };
  /** Pré-seleciona um profissional (ex: usuário logado ao clicar "Assumir"). */
  preSelectedId?: string;
  onSuccess: () => void;
}

export function AssignmentModal({
  open,
  onOpenChange,
  conversationId,
  currentAtendente,
  preSelectedId,
  onSuccess,
}: AssignmentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState("");
  const [motivo, setMotivo] = useState("");

  const isTransfer = !!currentAtendente;

  const {
    data: disponiveis,
    isLoading: loadingAtendentes,
  } = useQuery<DisponiveisResponse>({
    queryKey: ["assignment", "disponiveis"],
    queryFn: async () => {
      const res = await api.get("/atendentes/disponiveis");
      return (res.data ?? {}) as DisponiveisResponse;
    },
    enabled: open,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (open) {
      setSelectedId(preSelectedId ?? "");
      setMotivo("");
    }
  }, [open, preSelectedId]);

  const assignMutation = useMutation({
    mutationFn: async (payload: { profissional_id: string; motivo?: string }) => {
      const isReturnToQueue =
        padrao && payload.profissional_id === padrao.id;
      const endpoint =
        !isReturnToQueue && isTransfer
          ? `/conversas/${conversationId}/transfer`
          : `/conversas/${conversationId}/assign`;
      const res = await api.post(endpoint, payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast({
        title: isTransfer ? "Conversa transferida" : "Conversa atribuída",
        description: data?.message || "A ação foi realizada com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["ai-status"] });
      queryClient.invalidateQueries({ queryKey: ["assignment"] });
      queryClient.invalidateQueries({ queryKey: ["conversas"] });
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error?.response?.data?.message || error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (profissionalId?: string) => {
    const id = profissionalId ?? selectedId;
    if (!id) {
      toast({ title: "Selecione um atendente", variant: "destructive" });
      return;
    }
    const isReturnToQueue = padrao && id === padrao.id;
    const motivoTrim = motivo.trim();
    // Motivo obrigatório apenas em transferência (não em atribuição inicial nem devolução à fila)
    if (isTransfer && !isReturnToQueue && !motivoTrim) {
      toast({
        title: "Motivo obrigatório",
        description: "Informe o motivo da transferência",
        variant: "destructive",
      });
      return;
    }
    assignMutation.mutate({
      profissional_id: id,
      motivo: motivoTrim || undefined,
    });
  };

  const ia = disponiveis?.ia ?? null;
  const humanos = disponiveis?.humanos ?? [];
  const padrao = disponiveis?.padrao ?? null;
  const loading = assignMutation.isPending;
  const iaDisponivel = ia?.disponivel !== false;
  const humanosFiltrados = humanos.filter(
    (a) => !currentAtendente || a.id !== currentAtendente.id,
  );
  const isReturnToQueueSelected =
    !!padrao && selectedId === padrao.id;
  const motivoRequired = isTransfer && !isReturnToQueueSelected;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isTransfer ? "Transferir conversa" : "Atribuir conversa"}
          </DialogTitle>
          <DialogDescription>
            Escolha quem vai atender esta conversa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {loadingAtendentes ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {ia && (
                <section className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Bot className="h-3.5 w-3.5" />
                    Agente IA
                  </div>
                  <button
                    type="button"
                    disabled={!iaDisponivel}
                    onClick={() => iaDisponivel && setSelectedId(ia.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedId === ia.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="h-9 w-9 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-lg">
                      🤖
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{ia.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        Atendimento automático
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        iaDisponivel
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      }
                    >
                      {iaDisponivel ? "Disponível" : "Indisponível"}
                    </Badge>
                  </button>
                </section>
              )}

              <section className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  Atendentes
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {humanosFiltrados.map((a) => (
                      <button
                        type="button"
                        key={a.id}
                        onClick={() => setSelectedId(a.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                          selectedId === a.id
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>
                            {a.nome.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{a.nome}</p>
                          {a.email && (
                            <p className="text-xs text-muted-foreground truncate">
                              {a.email}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {a.conversas_ativas ?? 0}{" "}
                          {(a.conversas_ativas ?? 0) === 1
                            ? "conversa"
                            : "conversas"}
                        </span>
                      </button>
                    ))}
                  {humanosFiltrados.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum atendente habilitado para conversas ainda
                    </p>
                  )}
                </div>
              </section>

              {padrao && (
                <section className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setSelectedId(padrao.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                      selectedId === padrao.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="h-9 w-9 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        🏥 Devolver à fila
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        Atribui ao atendente padrão ({padrao.nome})
                      </p>
                    </div>
                  </button>
                </section>
              )}

              <div className="space-y-2">
                <Label>
                  Motivo{motivoRequired ? " *" : " (opcional)"}
                </Label>
                <Input
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder={
                    motivoRequired
                      ? "Informe o motivo da transferência"
                      : "Ex: especialista no assunto"
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
          <Button
            onClick={() => handleSubmit()}
            disabled={loading || !selectedId}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
