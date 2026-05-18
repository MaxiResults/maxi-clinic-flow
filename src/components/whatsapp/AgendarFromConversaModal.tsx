import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { localToUTC, getUserTimezone } from "@/utils/timezone";

interface Profissional {
  id: number | string;
  nome: string;
  duracao_padrao_consulta?: string | null;
}
interface Produto {
  id: number | string;
  nome: string;
  valor?: number | string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: { id: number | string; nome: string; telefone?: string | null; whatsapp_id?: string | null } | null;
  onCreated?: () => void;
}

function parseDuracao(d?: string | null): number {
  if (!d) return 30;
  // formato HH:MM:SS
  const parts = d.split(":").map((n) => parseInt(n, 10));
  if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }
  const n = parseInt(d, 10);
  return isNaN(n) ? 30 : n;
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map((n) => parseInt(n, 10));
  if (isNaN(h) || isNaN(m)) return time;
  const total = h * 60 + m + minutes;
  const hh = Math.floor((total % (24 * 60)) / 60).toString().padStart(2, "0");
  const mm = (total % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

export const AgendarFromConversaModal: React.FC<Props> = ({ open, onOpenChange, lead, onCreated }) => {
  const { toast } = useToast();
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loadingDados, setLoadingDados] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [profissionalId, setProfissionalId] = useState<string>("");
  const [produtoId, setProdutoId] = useState<string>("");
  const [data, setData] = useState<string>("");
  const [horaInicio, setHoraInicio] = useState<string>("");
  const [horaFim, setHoraFim] = useState<string>("");
  const [observacoes, setObservacoes] = useState<string>("");
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [horariosIndisponivelEndpoint, setHorariosIndisponivelEndpoint] = useState(false);

  const profissionalSelecionado = useMemo(
    () => profissionais.find((p) => String(p.id) === profissionalId),
    [profissionais, profissionalId]
  );
  const duracaoMinutos = parseDuracao(profissionalSelecionado?.duracao_padrao_consulta);

  // Reset ao abrir
  useEffect(() => {
    if (!open) return;
    setProfissionalId("");
    setProdutoId("");
    setData("");
    setHoraInicio("");
    setHoraFim("");
    setObservacoes("");
    setHorariosDisponiveis([]);
    setHorariosIndisponivelEndpoint(false);
  }, [open]);

  // Carrega profissionais e produtos
  useEffect(() => {
    if (!open) return;
    setLoadingDados(true);
    Promise.all([api.get("/profissionais"), api.get("/produtos")])
      .then(([rProf, rProd]) => {
        setProfissionais(Array.isArray(rProf.data) ? rProf.data : rProf.data?.data || []);
        setProdutos(Array.isArray(rProd.data) ? rProd.data : rProd.data?.data || []);
      })
      .catch(() => {
        toast({ title: "Erro", description: "Não foi possível carregar profissionais/produtos.", variant: "destructive" });
      })
      .finally(() => setLoadingDados(false));
  }, [open, toast]);

  // Busca horários disponíveis
  useEffect(() => {
    if (!open || !profissionalId || !data) {
      setHorariosDisponiveis([]);
      return;
    }
    if (horariosIndisponivelEndpoint) return;
    setLoadingHorarios(true);
    api
      .get("/agendamentos/horarios-disponiveis", {
        params: {
          profissional_id: profissionalId,
          data,
          duracao_minutos: duracaoMinutos,
        },
      })
      .then((r) => {
        const lista = Array.isArray(r.data?.horarios) ? r.data.horarios : Array.isArray(r.data) ? r.data : [];
        setHorariosDisponiveis(lista);
      })
      .catch(() => {
        setHorariosDisponiveis([]);
        setHorariosIndisponivelEndpoint(true);
      })
      .finally(() => setLoadingHorarios(false));
  }, [open, profissionalId, data, duracaoMinutos, horariosIndisponivelEndpoint]);

  // Auto-calcula hora fim quando hora início ou duração mudam
  useEffect(() => {
    if (horaInicio) {
      setHoraFim(addMinutesToTime(horaInicio, duracaoMinutos));
    }
  }, [horaInicio, duracaoMinutos]);

  const produtoSelecionado = produtos.find((p) => String(p.id) === produtoId);
  const valor = produtoSelecionado?.valor ? Number(produtoSelecionado.valor) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;
    if (!profissionalId || !produtoId || !data || !horaInicio) {
      toast({ title: "Campos obrigatórios", description: "Preencha profissional, serviço, data e horário.", variant: "destructive" });
      return;
    }
    setSalvando(true);
    try {
      const data_hora_inicio = localToUTC(data, horaInicio);
      const data_hora_fim = horaFim ? localToUTC(data, horaFim) : undefined;

      const payload: Record<string, unknown> = {
        lead_id: typeof lead.id === "string" ? parseInt(lead.id, 10) : lead.id,
        profissional_id: parseInt(profissionalId, 10),
        produto_id: parseInt(produtoId, 10),
        data_hora_inicio,
        data_hora_fim,
        valor,
        status: "agendado",
        observacoes: observacoes || undefined,
        user_timezone: getUserTimezone(),
      };

      const r = await api.post("/agendamentos", payload);
      const novoId = r.data?.id || r.data?.agendamento?.id;

      // Confirmação via WhatsApp (não bloqueia em caso de erro)
      try {
        const telefone = lead.whatsapp_id || lead.telefone;
        if (telefone) {
          const [yyyy, mm, dd] = data.split("-");
          const msg = `Olá ${lead.nome}! Seu agendamento foi confirmado para ${dd}/${mm}/${yyyy} às ${horaInicio}. Qualquer dúvida estamos à disposição.`;
          await api.post("/evolution/send-text", { number: telefone, text: msg });
        }
      } catch {}

      toast({ title: "Agendamento criado", description: "O paciente foi notificado pelo WhatsApp." });
      onOpenChange(false);
      onCreated?.();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; error?: string } } };
      const msg = e?.response?.data?.message || e?.response?.data?.error || "Não foi possível criar o agendamento.";
      toast({ title: "Erro ao agendar", description: msg, variant: "destructive" });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agendar para {lead?.nome || "paciente"}</DialogTitle>
        </DialogHeader>

        {loadingDados ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profissional">Profissional *</Label>
              <select
                id="profissional"
                value={profissionalId}
                onChange={(e) => {
                  setProfissionalId(e.target.value);
                  setHorariosIndisponivelEndpoint(false);
                  setHoraInicio("");
                  setHoraFim("");
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Selecione...</option>
                {profissionais.map((p) => (
                  <option key={p.id} value={String(p.id)}>{p.nome}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="produto">Serviço *</Label>
              <select
                id="produto"
                value={produtoId}
                onChange={(e) => setProdutoId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Selecione...</option>
                {produtos.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.nome}{p.valor ? ` — R$ ${Number(p.valor).toFixed(2)}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data">Data *</Label>
              <Input
                id="data"
                type="date"
                value={data}
                onChange={(e) => {
                  setData(e.target.value);
                  setHoraInicio("");
                  setHoraFim("");
                  setHorariosIndisponivelEndpoint(false);
                }}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="hora-inicio">Início *</Label>
                {!horariosIndisponivelEndpoint && profissionalId && data ? (
                  <select
                    id="hora-inicio"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                    disabled={loadingHorarios}
                  >
                    <option value="">
                      {loadingHorarios
                        ? "Carregando..."
                        : horariosDisponiveis.length === 0
                        ? "Sem horários disponíveis"
                        : "Selecione..."}
                    </option>
                    {horariosDisponiveis.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id="hora-inicio"
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    required
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="hora-fim">Término</Label>
                <Input
                  id="hora-fim"
                  type="time"
                  value={horaFim}
                  onChange={(e) => setHoraFim(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="obs">Observações</Label>
              <Textarea
                id="obs"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
                placeholder="Opcional"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={salvando}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvando}>
                {salvando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Agendar
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AgendarFromConversaModal;