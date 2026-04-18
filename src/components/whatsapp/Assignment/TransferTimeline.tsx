import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowRight, Loader2 } from "lucide-react";
import api from "@/lib/api";

interface Atribuicao {
  id: string;
  tipo_acao: string;
  motivo?: string;
  data_acao: string;
  de_atendente?: { nome: string };
  para_atendente: { nome: string };
  criador?: { nome: string };
}

interface TransferTimelineProps {
  conversationId: string;
}

export function TransferTimeline({ conversationId }: TransferTimelineProps) {
  const [historico, setHistorico] = useState<Atribuicao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistorico();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const fetchHistorico = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/conversas/${conversationId}/historico-atribuicoes`,
      );
      setHistorico(response.data || []);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (historico.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Nenhuma atribuição registrada
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {historico.map((item) => (
        <div key={item.id} className="rounded-lg border p-3 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            {item.de_atendente && (
              <>
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {item.de_atendente.nome.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{item.de_atendente.nome}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </>
            )}
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {item.para_atendente.nome.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">
              {item.para_atendente.nome}
            </span>
          </div>
          {item.motivo && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Motivo:</span> {item.motivo}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {new Date(item.data_acao).toLocaleString("pt-BR")}
            {item.criador && ` • Por ${item.criador.nome}`}
          </p>
        </div>
      ))}
    </div>
  );
}
