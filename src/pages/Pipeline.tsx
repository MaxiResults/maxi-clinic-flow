import { useState, useEffect, useCallback, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  ArrowLeft, ArrowRight, Check, ChevronRight, MessageCircle,
  Pencil, Phone, Plus, Search, Trash2, TrendingUp, X, Eye,
  DollarSign, Users, Trophy, Loader2, Clock,
} from 'lucide-react';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';

import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

import * as svc from '@/services/oportunidade.service';
import type { Oportunidade, WorkflowEtapa, LeadAtividade } from '@/types/oportunidade';

// ─────────────────────────────────────────
// Tipos locais
// ─────────────────────────────────────────

interface Lead {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
}

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return '—';
  }
}

function formatWhatsApp(telefone: string): string {
  const digits = telefone.replace(/\D/g, '');
  if (digits.startsWith('55')) return digits;
  return `55${digits}`;
}

// ─────────────────────────────────────────
// Sub-componente: Skeleton de card
// ─────────────────────────────────────────

function CardSkeleton() {
  return (
    <Card className="mb-3">
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-8 w-full mt-2" />
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────
// Sub-componente: Card de Oportunidade
// ─────────────────────────────────────────

interface OportunidadeCardProps {
  oportunidade: Oportunidade;
  etapas: WorkflowEtapa[];
  etapaAtual: WorkflowEtapa;
  loadingId: string | null;
  onMover: (oportunidade: Oportunidade, direcao: 'anterior' | 'proxima') => void;
  onGanhar: (oportunidade: Oportunidade) => void;
  onPerder: (oportunidade: Oportunidade) => void;
  onDeletar: (oportunidade: Oportunidade) => void;
  onEditar: (oportunidade: Oportunidade) => void;
  onVerDetalhes: (oportunidade: Oportunidade) => void;
}

function OportunidadeCard({
  oportunidade,
  etapas,
  etapaAtual,
  loadingId,
  onMover,
  onGanhar,
  onPerder,
  onDeletar,
  onEditar,
  onVerDetalhes,
}: OportunidadeCardProps) {
  const isPrimeira = etapaAtual.ordem === Math.min(...etapas.map((e) => e.ordem));
  const isUltima = etapaAtual.ordem === Math.max(...etapas.map((e) => e.ordem));
  const isLoading = loadingId === oportunidade.id;

  return (
    <Card className="mb-3 border border-border/60 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="font-semibold text-sm leading-tight line-clamp-2">
            {oportunidade.titulo}
          </p>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin shrink-0 text-muted-foreground" />}
        </div>

        {/* Dados do paciente */}
        <div className="space-y-1 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3 w-3 shrink-0" />
            <span className="truncate">{oportunidade.lead_nome || '—'}</span>
          </div>
          {oportunidade.lead_telefone && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="h-3 w-3 shrink-0" />
              <span>{oportunidade.lead_telefone}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <DollarSign className="h-3 w-3 shrink-0" />
            <span>{formatBRL(oportunidade.valor_estimado)}</span>
          </div>
          {oportunidade.data_previsao_fechamento && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3 shrink-0" />
              <span>{formatDate(oportunidade.data_previsao_fechamento)}</span>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex flex-wrap gap-1">
          {/* Mover */}
          {!isPrimeira && (
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={isLoading}
              onClick={() => onMover(oportunidade, 'anterior')}
              title="Voltar etapa"
            >
              <ArrowLeft className="h-3 w-3" />
            </Button>
          )}
          {!isUltima && (
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={isLoading}
              onClick={() => onMover(oportunidade, 'proxima')}
              title="Avançar etapa"
            >
              <ArrowRight className="h-3 w-3" />
            </Button>
          )}

          {/* WhatsApp */}
          {oportunidade.lead_telefone && (
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 text-green-600 hover:text-green-700"
              title="WhatsApp"
              onClick={() =>
                window.open(`https://wa.me/${formatWhatsApp(oportunidade.lead_telefone!)}`, '_blank')
              }
            >
              <MessageCircle className="h-3 w-3" />
            </Button>
          )}

          {/* Detalhes */}
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            title="Ver detalhes"
            onClick={() => onVerDetalhes(oportunidade)}
          >
            <Eye className="h-3 w-3" />
          </Button>

          {/* Editar */}
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            title="Editar"
            onClick={() => onEditar(oportunidade)}
          >
            <Pencil className="h-3 w-3" />
          </Button>

          {/* Ganhar */}
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:border-emerald-300"
            title="Marcar como ganha"
            disabled={isLoading}
            onClick={() => onGanhar(oportunidade)}
          >
            <Check className="h-3 w-3" />
          </Button>

          {/* Perder */}
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 text-orange-500 hover:text-orange-600 hover:border-orange-300"
            title="Marcar como perdida"
            disabled={isLoading}
            onClick={() => onPerder(oportunidade)}
          >
            <X className="h-3 w-3" />
          </Button>

          {/* Deletar */}
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive hover:border-destructive/30"
            title="Deletar"
            disabled={isLoading}
            onClick={() => onDeletar(oportunidade)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────
// Modal: Criar Oportunidade
// ─────────────────────────────────────────

interface ModalCriarProps {
  open: boolean;
  etapas: WorkflowEtapa[];
  onClose: () => void;
  onSalvo: () => void;
}

function ModalCriar({ open, etapas, onClose, onSalvo }: ModalCriarProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadSearch, setLeadSearch] = useState('');
  const [leadSelecionado, setLeadSelecionado] = useState<Lead | null>(null);
  const [comboOpen, setComboOpen] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [valor, setValor] = useState('');
  const [etapaId, setEtapaId] = useState<number | ''>('');
  const [dataPrevisao, setDataPrevisao] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);

  // Buscar leads ao abrir
  useEffect(() => {
    if (!open) return;
    api.get('/leads', { params: { limit: 100 } })
      .then((r) => setLeads(Array.isArray(r.data) ? r.data : []))
      .catch(() => setLeads([]));
  }, [open]);

  const leadsFiltrados = useMemo(
    () =>
      leads.filter(
        (l) =>
          l.nome?.toLowerCase().includes(leadSearch.toLowerCase()) ||
          l.telefone?.includes(leadSearch)
      ),
    [leads, leadSearch]
  );

  function resetForm() {
    setLeadSelecionado(null);
    setLeadSearch('');
    setTitulo('');
    setValor('');
    setEtapaId('');
    setDataPrevisao('');
    setObservacoes('');
  }

  async function handleSalvar() {
    if (!leadSelecionado) return toast.error('Selecione um paciente');
    if (!titulo.trim()) return toast.error('Informe o título');

    setSaving(true);
    const result = await svc.criarOportunidade({
      lead_id: leadSelecionado.id,
      titulo: titulo.trim(),
      valor_estimado: valor ? parseFloat(valor.replace(',', '.')) : undefined,
      etapa_id: etapaId !== '' ? Number(etapaId) : undefined,
      data_previsao_fechamento: dataPrevisao || undefined,
      observacoes: observacoes || undefined,
    });
    setSaving(false);

    if (result.success) {
      toast.success('Oportunidade criada!');
      resetForm();
      onSalvo();
    } else {
      toast.error(result.error || 'Erro ao criar oportunidade');
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { resetForm(); onClose(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Oportunidade</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Combobox pacientes */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Paciente *</label>
            <Popover open={comboOpen} onOpenChange={setComboOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between font-normal">
                  {leadSelecionado ? (
                    <span>{leadSelecionado.nome}</span>
                  ) : (
                    <span className="text-muted-foreground">Buscar paciente...</span>
                  )}
                  <ChevronRight className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Nome ou telefone..."
                    value={leadSearch}
                    onValueChange={setLeadSearch}
                  />
                  <CommandList>
                    <CommandEmpty>Nenhum paciente encontrado</CommandEmpty>
                    <CommandGroup>
                      {leadsFiltrados.slice(0, 30).map((l) => (
                        <CommandItem
                          key={l.id}
                          value={l.id}
                          onSelect={() => {
                            setLeadSelecionado(l);
                            setComboOpen(false);
                          }}
                        >
                          <div>
                            <p className="text-sm font-medium">{l.nome}</p>
                            <p className="text-xs text-muted-foreground">{l.telefone}</p>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Título */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Título *</label>
            <Input
              placeholder="Ex: Implante dentário + clareamento"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Valor */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Valor estimado (R$)</label>
              <Input
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                type="number"
                min="0"
                step="0.01"
              />
            </div>

            {/* Etapa */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Etapa inicial</label>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                value={etapaId}
                onChange={(e) => setEtapaId(e.target.value === '' ? '' : Number(e.target.value))}
              >
                <option value="">Primeira etapa</option>
                {etapas.map((e) => (
                  <option key={e.id} value={e.id}>{e.nome}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Data previsão */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Previsão de fechamento</label>
            <Input
              type="date"
              value={dataPrevisao}
              onChange={(e) => setDataPrevisao(e.target.value)}
            />
          </div>

          {/* Observações */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Observações</label>
            <Textarea
              placeholder="Notas sobre a oportunidade..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onClose(); }}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Criar Oportunidade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────
// Modal: Editar Oportunidade
// ─────────────────────────────────────────

interface ModalEditarProps {
  oportunidade: Oportunidade | null;
  onClose: () => void;
  onSalvo: () => void;
}

function ModalEditar({ oportunidade, onClose, onSalvo }: ModalEditarProps) {
  const [titulo, setTitulo] = useState('');
  const [valor, setValor] = useState('');
  const [dataPrevisao, setDataPrevisao] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (oportunidade) {
      setTitulo(oportunidade.titulo);
      setValor(oportunidade.valor_estimado ? String(oportunidade.valor_estimado) : '');
      setDataPrevisao(oportunidade.data_previsao_fechamento?.split('T')[0] ?? '');
      setObservacoes(oportunidade.observacoes ?? '');
    }
  }, [oportunidade]);

  async function handleSalvar() {
    if (!oportunidade) return;
    if (!titulo.trim()) return toast.error('Informe o título');

    setSaving(true);
    const result = await svc.atualizarOportunidade(oportunidade.id, {
      titulo: titulo.trim(),
      valor_estimado: valor ? parseFloat(valor.replace(',', '.')) : undefined,
      data_previsao_fechamento: dataPrevisao || undefined,
      observacoes: observacoes || undefined,
    });
    setSaving(false);

    if (result.success) {
      toast.success('Oportunidade atualizada!');
      onSalvo();
    } else {
      toast.error(result.error || 'Erro ao atualizar');
    }
  }

  return (
    <Dialog open={!!oportunidade} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Oportunidade</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Título *</label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Valor estimado (R$)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Previsão de fechamento</label>
              <Input
                type="date"
                value={dataPrevisao}
                onChange={(e) => setDataPrevisao(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Observações</label>
            <Textarea
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSalvar} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────
// Modal: Marcar como Perdida
// ─────────────────────────────────────────

interface ModalPerderProps {
  oportunidade: Oportunidade | null;
  onClose: () => void;
  onConfirmado: (motivo: string) => void;
  loading: boolean;
}

function ModalPerder({ oportunidade, onClose, onConfirmado, loading }: ModalPerderProps) {
  const [motivo, setMotivo] = useState('');

  useEffect(() => { if (!oportunidade) setMotivo(''); }, [oportunidade]);

  return (
    <Dialog open={!!oportunidade} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Marcar como Perdida</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Informe o motivo pelo qual a oportunidade <strong>{oportunidade?.titulo}</strong> foi perdida.
        </p>
        <Textarea
          placeholder="Motivo da perda (opcional)..."
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          rows={3}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            variant="destructive"
            onClick={() => onConfirmado(motivo)}
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirmar Perda
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────
// Modal: Detalhes + Timeline
// ─────────────────────────────────────────

interface ModalDetalhesProps {
  oportunidade: Oportunidade | null;
  onClose: () => void;
  onEditar: (o: Oportunidade) => void;
}

const ACAO_LABELS: Record<string, string> = {
  oportunidade_criada: 'Criada',
  etapa_alterada: 'Etapa alterada',
  oportunidade_ganha: 'Ganha 🎉',
  oportunidade_perdida: 'Perdida',
  oportunidade_cancelada: 'Cancelada',
};

function ModalDetalhes({ oportunidade, onClose, onEditar }: ModalDetalhesProps) {
  const [atividades, setAtividades] = useState<LeadAtividade[]>([]);
  const [loadingAtv, setLoadingAtv] = useState(false);

  useEffect(() => {
    if (!oportunidade) return;
    setLoadingAtv(true);
    svc.buscarAtividades({ oportunidade_id: oportunidade.id, limit: 20 })
      .then(setAtividades)
      .finally(() => setLoadingAtv(false));
  }, [oportunidade]);

  if (!oportunidade) return null;

  return (
    <Dialog open={!!oportunidade} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="pr-8 leading-snug">{oportunidade.titulo}</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 space-y-5 pr-1">
          {/* Dados principais */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <span className="text-muted-foreground block text-xs">Paciente</span>
              <span className="font-medium">{oportunidade.lead_nome || '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Telefone</span>
              <span>{oportunidade.lead_telefone || '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Valor estimado</span>
              <span className="font-semibold text-emerald-600">
                {formatBRL(oportunidade.valor_estimado)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Etapa atual</span>
              <Badge
                variant="outline"
                style={{ borderColor: oportunidade.etapa_cor, color: oportunidade.etapa_cor }}
              >
                {oportunidade.etapa_nome || '—'}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Previsão de fechamento</span>
              <span>{formatDate(oportunidade.data_previsao_fechamento)}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Criada em</span>
              <span>{formatDate(oportunidade.created_at)}</span>
            </div>
            {oportunidade.observacoes && (
              <div className="col-span-2">
                <span className="text-muted-foreground block text-xs">Observações</span>
                <p className="text-sm mt-0.5">{oportunidade.observacoes}</p>
              </div>
            )}
          </div>

          {/* Timeline de atividades */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Timeline de atividades</h4>
            {loadingAtv ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : atividades.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma atividade registrada.</p>
            ) : (
              <ol className="relative border-l border-border ml-2 space-y-4">
                {atividades.map((atv) => (
                  <li key={atv.id} className="pl-4">
                    <div
                      className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary"
                    />
                    <p className="text-xs font-medium">
                      {ACAO_LABELS[atv.tipo_acao] ?? atv.tipo_acao}
                    </p>
                    <p className="text-sm text-muted-foreground">{atv.descricao}</p>
                    <time className="text-xs text-muted-foreground/70">
                      {formatDate(atv.created_at)}
                    </time>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          <Button onClick={() => { onClose(); onEditar(oportunidade); }}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────
// Página principal: Pipeline
// ─────────────────────────────────────────

export default function Pipeline() {
  const { user } = useAuth();

  // Dados
  const [etapas, setEtapas] = useState<WorkflowEtapa[]>([]);
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [loadingEtapas, setLoadingEtapas] = useState(true);
  const [loadingOportunidades, setLoadingOportunidades] = useState(true);

  // UI
  const [busca, setBusca] = useState('');
  const [tabAtiva, setTabAtiva] = useState<string>('');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Modais
  const [modalCriarOpen, setModalCriarOpen] = useState(false);
  const [oportunidadeEditar, setOportunidadeEditar] = useState<Oportunidade | null>(null);
  const [oportunidadeDetalhes, setOportunidadeDetalhes] = useState<Oportunidade | null>(null);
  const [oportunidadePerder, setOportunidadePerder] = useState<Oportunidade | null>(null);
  const [loadingPerder, setLoadingPerder] = useState(false);

  // ── Carregamento ──────────────────────

  const carregarEtapas = useCallback(async () => {
    setLoadingEtapas(true);
    const data = await svc.buscarEtapasWorkflow();
    setEtapas(data);
    if (data.length > 0 && !tabAtiva) {
      setTabAtiva(String(data[0].id));
    }
    setLoadingEtapas(false);
  }, [tabAtiva]);

  const carregarOportunidades = useCallback(async () => {
    setLoadingOportunidades(true);
    const data = await svc.buscarOportunidades({ status: 'aberta' });
    setOportunidades(data);
    setLoadingOportunidades(false);
  }, []);

  useEffect(() => { carregarEtapas(); }, []);
  useEffect(() => { carregarOportunidades(); }, []);

  // ── Filtro de busca ───────────────────

  const oportunidadesFiltradas = useMemo(() => {
    if (!busca.trim()) return oportunidades;
    const q = busca.toLowerCase();
    return oportunidades.filter(
      (o) =>
        o.titulo.toLowerCase().includes(q) ||
        (o.lead_nome ?? '').toLowerCase().includes(q) ||
        (o.lead_telefone ?? '').includes(q)
    );
  }, [oportunidades, busca]);

  // Oportunidades por etapa
  const porEtapa = useCallback(
    (etapaId: number) =>
      oportunidadesFiltradas.filter((o) => o.etapa_id === etapaId),
    [oportunidadesFiltradas]
  );

  // ── Stats globais ─────────────────────

  const stats = useMemo(() => {
    const abertas = oportunidades.filter((o) => o.status === 'aberta');
    const ganhas = oportunidades.filter((o) => o.status === 'ganha');
    const totalAbertas = abertas.length;
    const valorTotal = abertas.reduce((s, o) => s + (o.valor_estimado || 0), 0);
    const totalGanhas = ganhas.length;
    const taxa =
      oportunidades.length > 0
        ? Math.round((totalGanhas / oportunidades.length) * 100)
        : 0;
    return { totalAbertas, valorTotal, totalGanhas, taxa };
  }, [oportunidades]);

  // ── Ações de cards ────────────────────

  async function handleMover(oportunidade: Oportunidade, direcao: 'anterior' | 'proxima') {
    const ordemAtual = etapas.find((e) => e.id === oportunidade.etapa_id)?.ordem ?? 0;
    const alvo =
      direcao === 'proxima'
        ? etapas.find((e) => e.ordem === ordemAtual + 1)
        : etapas.find((e) => e.ordem === ordemAtual - 1);

    if (!alvo) return;

    setLoadingId(oportunidade.id);
    const result = await svc.moverEtapa(oportunidade.id, alvo.id, alvo.nome);
    setLoadingId(null);

    if (result.success) {
      toast(`Movida para ${alvo.nome}`);
      setOportunidades((prev) =>
        prev.map((o) =>
          o.id === oportunidade.id
            ? { ...o, etapa_id: alvo.id, etapa_nome: alvo.nome, etapa_cor: alvo.cor }
            : o
        )
      );
    } else {
      toast.error(result.error || 'Erro ao mover etapa');
    }
  }

  async function handleGanhar(oportunidade: Oportunidade) {
    if (!window.confirm(`Marcar "${oportunidade.titulo}" como GANHA?`)) return;

    setLoadingId(oportunidade.id);
    const result = await svc.atualizarStatus(oportunidade.id, 'ganha');
    setLoadingId(null);

    if (result.success) {
      toast.success('Oportunidade ganha! 🎉');
      setOportunidades((prev) => prev.filter((o) => o.id !== oportunidade.id));
    } else {
      toast.error(result.error || 'Erro ao atualizar status');
    }
  }

  async function handleConfirmarPerda(motivo: string) {
    if (!oportunidadePerder) return;

    setLoadingPerder(true);
    const result = await svc.atualizarStatus(oportunidadePerder.id, 'perdida', motivo);
    setLoadingPerder(false);

    if (result.success) {
      toast('Oportunidade marcada como perdida');
      setOportunidades((prev) => prev.filter((o) => o.id !== oportunidadePerder.id));
      setOportunidadePerder(null);
    } else {
      toast.error(result.error || 'Erro ao atualizar status');
    }
  }

  async function handleDeletar(oportunidade: Oportunidade) {
    if (!window.confirm(`Deletar "${oportunidade.titulo}"? Esta ação não pode ser desfeita.`)) return;

    setLoadingId(oportunidade.id);
    const result = await svc.deletarOportunidade(oportunidade.id);
    setLoadingId(null);

    if (result.success) {
      toast.success('Oportunidade deletada');
      setOportunidades((prev) => prev.filter((o) => o.id !== oportunidade.id));
    } else {
      toast.error(result.error || 'Erro ao deletar');
    }
  }

  // ── Render ────────────────────────────

  return (
    <DashboardLayout title="Pipeline CRM">
      <div className="space-y-5">

        {/* ── Cabeçalho ── */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pipeline CRM</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie o funil de vendas da clínica
            </p>
          </div>
          <Button onClick={() => setModalCriarOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Oportunidade
          </Button>
        </div>

        {/* ── Busca ── */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por título ou paciente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {/* ── Stats globais ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Em aberto</p>
                <p className="text-xl font-bold">{stats.totalAbertas}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 p-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor total</p>
                <p className="text-lg font-bold leading-tight">{formatBRL(stats.valorTotal)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-yellow-100 dark:bg-yellow-900/30 p-2">
                <Trophy className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ganhas</p>
                <p className="text-xl font-bold">{stats.totalGanhas}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 dark:bg-purple-900/30 p-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Conversão</p>
                <p className="text-xl font-bold">{stats.taxa}%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Kanban por abas ── */}
        {loadingEtapas ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
            </div>
          </div>
        ) : etapas.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <p className="font-medium">Nenhuma etapa de workflow configurada.</p>
              <p className="text-sm mt-1">
                Execute o seed de workflow-etapas ou configure as etapas pelo painel.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={tabAtiva} onValueChange={setTabAtiva}>
            {/* Tab triggers com cor da etapa */}
            <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0 mb-4">
              {etapas.map((etapa) => {
                const count = porEtapa(etapa.id).length;
                return (
                  <TabsTrigger
                    key={etapa.id}
                    value={String(etapa.id)}
                    className="data-[state=active]:text-white data-[state=active]:shadow-sm transition-colors"
                    style={
                      tabAtiva === String(etapa.id)
                        ? { backgroundColor: etapa.cor, borderColor: etapa.cor }
                        : { borderColor: etapa.cor, color: etapa.cor }
                    }
                  >
                    {etapa.nome}
                    {count > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-2 h-5 min-w-5 px-1 text-xs"
                      >
                        {count}
                      </Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Conteúdo de cada aba */}
            {etapas.map((etapa) => {
              const cards = porEtapa(etapa.id);
              const valorEtapa = cards.reduce((s, o) => s + (o.valor_estimado || 0), 0);

              return (
                <TabsContent key={etapa.id} value={String(etapa.id)}>
                  {/* Stats da etapa */}
                  <div
                    className="flex items-center gap-4 text-sm mb-4 pb-3 border-b"
                    style={{ borderColor: `${etapa.cor}40` }}
                  >
                    <span className="font-medium" style={{ color: etapa.cor }}>
                      {etapa.nome}
                    </span>
                    <span className="text-muted-foreground">
                      {cards.length} {cards.length === 1 ? 'oportunidade' : 'oportunidades'}
                    </span>
                    <span className="font-semibold text-emerald-600">
                      {formatBRL(valorEtapa)}
                    </span>
                  </div>

                  {/* Cards */}
                  {loadingOportunidades ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
                    </div>
                  ) : cards.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p className="font-medium">Nenhuma oportunidade nesta etapa</p>
                      {busca && (
                        <p className="text-sm mt-1">
                          Tente limpar a busca ou{' '}
                          <button
                            className="underline"
                            onClick={() => setBusca('')}
                          >
                            ver todas
                          </button>
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {cards.map((oportunidade) => (
                        <OportunidadeCard
                          key={oportunidade.id}
                          oportunidade={oportunidade}
                          etapas={etapas}
                          etapaAtual={etapa}
                          loadingId={loadingId}
                          onMover={handleMover}
                          onGanhar={handleGanhar}
                          onPerder={setOportunidadePerder}
                          onDeletar={handleDeletar}
                          onEditar={setOportunidadeEditar}
                          onVerDetalhes={setOportunidadeDetalhes}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </div>

      {/* ── Modais ── */}

      <ModalCriar
        open={modalCriarOpen}
        etapas={etapas}
        onClose={() => setModalCriarOpen(false)}
        onSalvo={() => { setModalCriarOpen(false); carregarOportunidades(); }}
      />

      <ModalEditar
        oportunidade={oportunidadeEditar}
        onClose={() => setOportunidadeEditar(null)}
        onSalvo={() => { setOportunidadeEditar(null); carregarOportunidades(); }}
      />

      <ModalDetalhes
        oportunidade={oportunidadeDetalhes}
        onClose={() => setOportunidadeDetalhes(null)}
        onEditar={(o) => { setOportunidadeDetalhes(null); setOportunidadeEditar(o); }}
      />

      <ModalPerder
        oportunidade={oportunidadePerder}
        onClose={() => setOportunidadePerder(null)}
        onConfirmado={handleConfirmarPerda}
        loading={loadingPerder}
      />
    </DashboardLayout>
  );
}
