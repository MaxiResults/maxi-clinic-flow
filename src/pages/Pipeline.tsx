import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  DndContext, DragEndEvent, DragOverEvent, DragStartEvent,
  DragOverlay, PointerSensor, useSensor, useSensors,
  closestCorners, useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Check, MessageCircle, Pencil, Phone, Plus, Search,
  Trash2, TrendingUp, X, Eye, DollarSign, Users, Trophy,
  Loader2, Clock, Settings2, AlertTriangle, GripVertical,
  ChevronRight, ArrowRight, ArrowLeft, Palette,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
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

function getDaysStale(updatedAt: string): number {
  try {
    return differenceInDays(new Date(), parseISO(updatedAt));
  } catch {
    return 0;
  }
}

// ─────────────────────────────────────────
// Sub-componente: Skeleton de card
// ─────────────────────────────────────────

function CardSkeleton() {
  return (
    <Card className="rounded-xl">
      <CardContent className="p-5 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-8 w-full mt-2" />
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────
// Sub-componente: Botão com Tooltip
// ─────────────────────────────────────────

function ActionButton({
  tooltip, children, ...props
}: React.ComponentProps<typeof Button> & { tooltip: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button {...props}>{children}</Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="text-xs">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// ─────────────────────────────────────────
// Sub-componente: SortableCard (Kanban)
// ─────────────────────────────────────────

function SortableCard({
  oportunidade,
  etapaAtual,
  etapas,
  loadingId,
  onGanhar,
  onPerder,
  onDeletar,
  onEditar,
  onVerDetalhes,
}: {
  oportunidade: Oportunidade;
  etapaAtual: WorkflowEtapa;
  etapas: WorkflowEtapa[];
  loadingId: string | null;
  onGanhar: (o: Oportunidade) => void;
  onPerder: (o: Oportunidade) => void;
  onDeletar: (o: Oportunidade) => void;
  onEditar: (o: Oportunidade) => void;
  onVerDetalhes: (o: Oportunidade) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: oportunidade.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const daysStale = getDaysStale(oportunidade.updated_at);
  const isStale = daysStale >= 7;
  const isOverdue = oportunidade.data_previsao_fechamento
    ? new Date(oportunidade.data_previsao_fechamento) < new Date()
    : false;
  const isLoading = loadingId === oportunidade.id;

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`
          group relative bg-white rounded-xl border border-gray-100
          shadow-sm hover:shadow-md hover:-translate-y-0.5
          transition-all duration-200 overflow-hidden
          ${isDragging ? 'shadow-xl scale-[1.02] rotate-1' : ''}
        `}
      >
        {/* Borda lateral colorida por etapa */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
          style={{ backgroundColor: etapaAtual.cor }}
        />

        <div className="pl-4 pr-3 py-3">
          {/* Header do card: título + drag handle */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4
              className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2 cursor-pointer hover:text-primary transition-colors flex-1"
              onClick={() => onVerDetalhes(oportunidade)}
            >
              {oportunidade.titulo}
            </h4>
            <button
              {...attributes}
              {...listeners}
              className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0 mt-0.5 touch-none"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          </div>

          {/* Lead name */}
          <p className="text-xs text-gray-500 mb-2.5 flex items-center gap-1.5">
            <Users className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{oportunidade.lead_nome || '—'}</span>
          </p>

          {/* Valor + data */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-gray-900">
              {oportunidade.valor_estimado
                ? formatBRL(oportunidade.valor_estimado)
                : '—'}
            </span>
            {oportunidade.data_previsao_fechamento && (
              <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                <Clock className="h-3 w-3" />
                {formatDate(oportunidade.data_previsao_fechamento)}
              </span>
            )}
          </div>

          {/* Indicadores de deal rotting + overdue */}
          {(isStale || isOverdue) && (
            <div className="flex items-center gap-2 mb-2.5">
              {isStale && (
                <span className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-100">
                  <Clock className="h-2.5 w-2.5" />
                  {daysStale}d parado
                </span>
              )}
              {isOverdue && (
                <span className="flex items-center gap-1 text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-100">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  Atrasado
                </span>
              )}
            </div>
          )}

          {/* Quick actions — aparecem no hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <button
              onClick={() => onVerDetalhes(oportunidade)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Ver detalhes"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onEditar(oportunidade)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Editar"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            {oportunidade.lead_telefone && (
              <button
                onClick={() => window.open(`https://wa.me/${formatWhatsApp(oportunidade.lead_telefone!)}`, '_blank')}
                className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                title="WhatsApp"
              >
                <MessageCircle className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => onGanhar(oportunidade)}
              disabled={isLoading}
              className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              title="Marcar como ganha"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onPerder(oportunidade)}
              disabled={isLoading}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Marcar como perdida"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDeletar(oportunidade)}
              disabled={isLoading}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors ml-auto"
              title="Deletar"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Sub-componente: KanbanColumn
// ─────────────────────────────────────────

function KanbanColumn({
  etapa,
  oportunidades,
  loadingId,
  animationDelay,
  onGanhar,
  onPerder,
  onDeletar,
  onEditar,
  onVerDetalhes,
  etapas,
}: {
  etapa: WorkflowEtapa;
  oportunidades: Oportunidade[];
  loadingId: string | null;
  animationDelay: number;
  etapas: WorkflowEtapa[];
  onGanhar: (o: Oportunidade) => void;
  onPerder: (o: Oportunidade) => void;
  onDeletar: (o: Oportunidade) => void;
  onEditar: (o: Oportunidade) => void;
  onVerDetalhes: (o: Oportunidade) => void;
}) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `etapa-${etapa.id}`,
  });
  const valorTotal = oportunidades.reduce((s, o) => s + (o.valor_estimado || 0), 0);
  const ids = oportunidades.map(o => o.id);

  return (
    <div
      className="flex-shrink-0 w-72 flex flex-col"
      style={{
        animation: `fadeSlideIn 0.4s ease both`,
        animationDelay: `${animationDelay}ms`,
      }}
    >
      {/* Header da coluna */}
      <div
        className="rounded-xl px-3 py-2.5 mb-3 flex items-center justify-between"
        style={{ backgroundColor: `${etapa.cor}12`, border: `1px solid ${etapa.cor}25` }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: etapa.cor }}
          />
          <span className="text-sm font-semibold text-gray-800 truncate max-w-[120px]">
            {etapa.nome}
          </span>
          {etapa.probabilidade !== undefined && (
            <span className="text-[10px] text-gray-400 font-medium">
              {etapa.probabilidade}%
            </span>
          )}
          <span
            className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white"
            style={{ backgroundColor: etapa.cor }}
          >
            {oportunidades.length}
          </span>
        </div>
        <span className="text-xs font-semibold text-gray-600">
          {valorTotal > 0 ? formatBRL(valorTotal) : '—'}
        </span>
      </div>

      {/* Drop zone + cards */}
      <div
        ref={setDropRef}
        className={`flex-1 min-h-[200px] space-y-2 rounded-xl transition-colors duration-150 ${
          isOver ? 'bg-primary/5 ring-2 ring-primary/20' : ''
        }`}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {oportunidades.length === 0 ? (
            <div
              className="h-24 rounded-xl border-2 border-dashed flex items-center justify-center text-xs text-gray-400 transition-colors"
              style={{ borderColor: `${etapa.cor}30` }}
            >
              Arraste cards aqui
            </div>
          ) : (
            oportunidades.map(oportunidade => (
              <SortableCard
                key={oportunidade.id}
                oportunidade={oportunidade}
                etapaAtual={etapa}
                etapas={etapas}
                loadingId={loadingId}
                onGanhar={onGanhar}
                onPerder={onPerder}
                onDeletar={onDeletar}
                onEditar={onEditar}
                onVerDetalhes={onVerDetalhes}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
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
      <DialogContent className="max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-lg">Nova Oportunidade</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block text-foreground">Paciente *</label>
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

          <div>
            <label className="text-sm font-medium mb-1.5 block text-foreground">Título *</label>
            <Input
              placeholder="Ex: Implante dentário + clareamento"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">Valor estimado (R$)</label>
              <Input
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                type="number"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">Etapa inicial</label>
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

          <div>
            <label className="text-sm font-medium mb-1.5 block text-foreground">Previsão de fechamento</label>
            <Input
              type="date"
              value={dataPrevisao}
              onChange={(e) => setDataPrevisao(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block text-foreground">Observações</label>
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
      <DialogContent className="max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-lg">Editar Oportunidade</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block text-foreground">Título *</label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">Valor estimado (R$)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">Previsão de fechamento</label>
              <Input
                type="date"
                value={dataPrevisao}
                onChange={(e) => setDataPrevisao(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block text-foreground">Observações</label>
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
  onConfirmar: (motivo: string) => void;
  loading: boolean;
}

function ModalPerder({ oportunidade, onClose, onConfirmar, loading }: ModalPerderProps) {
  const [motivo, setMotivo] = useState('');

  useEffect(() => { if (!oportunidade) setMotivo(''); }, [oportunidade]);

  return (
    <Dialog open={!!oportunidade} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-lg">Marcar como Perdida</DialogTitle>
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
            onClick={() => onConfirmar(motivo)}
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
// Modal: Marcar como Ganha
// ─────────────────────────────────────────

interface ModalGanharProps {
  oportunidade: Oportunidade | null;
  onClose: () => void;
  onConfirmar: () => void;
  loading: boolean;
}

function ModalGanhar({ oportunidade, onClose, onConfirmar, loading }: ModalGanharProps) {
  return (
    <Dialog open={!!oportunidade} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-lg">🎉 Oportunidade Ganha!</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Tem certeza que deseja marcar <strong>{oportunidade?.titulo}</strong> como ganha?
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={onConfirmar}
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirmar
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
  etapas: WorkflowEtapa[];
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

function ModalDetalhes({ oportunidade, etapas, onClose, onEditar }: ModalDetalhesProps) {
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
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col rounded-xl">
        <DialogHeader>
          <DialogTitle className="pr-8 leading-snug text-lg">{oportunidade.titulo}</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 space-y-5 pr-1">
          {/* Dados principais */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <span className="text-muted-foreground block text-xs mb-0.5">Paciente</span>
              <span className="font-medium text-foreground">{oportunidade.lead_nome || '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs mb-0.5">Telefone</span>
              <span className="text-foreground">{oportunidade.lead_telefone || '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs mb-0.5">Valor estimado</span>
              <span className="font-semibold" style={{ color: 'hsl(var(--pipeline-green))' }}>
                {formatBRL(oportunidade.valor_estimado)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs mb-0.5">Etapa atual</span>
              <Badge
                variant="outline"
                className="rounded-full"
                style={{ borderColor: oportunidade.etapa_cor, color: oportunidade.etapa_cor }}
              >
                {oportunidade.etapa_nome || '—'}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs mb-0.5">Previsão de fechamento</span>
              <span className="text-foreground">{formatDate(oportunidade.data_previsao_fechamento)}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs mb-0.5">Criada em</span>
              <span className="text-foreground">{formatDate(oportunidade.created_at)}</span>
            </div>
            {oportunidade.observacoes && (
              <div className="col-span-2">
                <span className="text-muted-foreground block text-xs mb-0.5">Observações</span>
                <p className="text-sm mt-0.5 text-foreground">{oportunidade.observacoes}</p>
              </div>
            )}
          </div>

          {/* Timeline de atividades */}
          <div>
            <h4 className="text-sm font-semibold mb-3 text-foreground">Timeline de atividades</h4>
            {loadingAtv ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
              </div>
            ) : atividades.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma atividade registrada.</p>
            ) : (
              <ol className="relative border-l-2 border-border/60 ml-2 space-y-4">
                {atividades.map((atv) => (
                  <li key={atv.id} className="pl-5">
                    <div className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                    <p className="text-xs font-medium text-foreground">
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
// Modal: Gerenciar Etapas
// ─────────────────────────────────────────

const CORES_ETAPA = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F97316',
  '#EAB308', '#22C55E', '#14B8A6', '#3B82F6', '#64748B',
];

interface ModalEtapasProps {
  open: boolean;
  etapas: WorkflowEtapa[];
  onClose: () => void;
  onSalvo: () => void;
  porEtapa: (id: number) => Oportunidade[];
}

function ModalEtapas({ open, etapas, onClose, onSalvo, porEtapa }: ModalEtapasProps) {
  const [etapaEditando, setEtapaEditando] = useState<WorkflowEtapa | null>(null);
  const [novaEtapaNome, setNovaEtapaNome] = useState('');
  const [novaEtapaCor, setNovaEtapaCor] = useState('#6366F1');
  const [formProbabilidade, setFormProbabilidade] = useState(50);
  const [salvandoEtapa, setSalvandoEtapa] = useState(false);
  const [excluindoEtapaId, setExcluindoEtapaId] = useState<number | null>(null);

  async function handleCriarEtapa() {
    if (!novaEtapaNome.trim()) {
      return toast.error('Informe o nome da etapa');
    }
    setSalvandoEtapa(true);
    try {
      await api.post('/workflow-etapas', {
        nome: novaEtapaNome.trim(),
        cor: novaEtapaCor,
        ordem: etapas.length + 1,
        probabilidade: formProbabilidade,
      });
      toast.success('Etapa criada!');
      setNovaEtapaNome('');
      setNovaEtapaCor('#6366F1');
      setFormProbabilidade(50);
      onSalvo();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar etapa');
    } finally {
      setSalvandoEtapa(false);
    }
  }

  async function handleAtualizarEtapa() {
    if (!etapaEditando) return;
    setSalvandoEtapa(true);
    try {
      await api.patch(`/workflow-etapas/${etapaEditando.id}`, {
        nome: etapaEditando.nome,
        cor: etapaEditando.cor,
        probabilidade: formProbabilidade,
      });
      toast.success('Etapa atualizada!');
      setEtapaEditando(null);
      onSalvo();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar');
    } finally {
      setSalvandoEtapa(false);
    }
  }

  async function handleExcluirEtapa(id: number) {
    if (!window.confirm(
      'Excluir esta etapa? Só é possível se não houver oportunidades em aberto nela.'
    )) return;

    setExcluindoEtapaId(id);
    try {
      await api.delete(`/workflow-etapas/${id}`);
      toast.success('Etapa excluída!');
      onSalvo();
    } catch (err: any) {
      toast.error(
        err.response?.data?.error ||
        err.message ||
        'Erro ao excluir etapa'
      );
    } finally {
      setExcluindoEtapaId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-lg">Etapas do Pipeline</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div className="space-y-2">
            {etapas.map((etapa) => (
              <div
                key={etapa.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card"
              >
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: etapa.cor }}
                />
                {etapaEditando?.id === etapa.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      className="flex-1 text-sm border rounded px-2 py-1 bg-background"
                      value={etapaEditando.nome}
                      onChange={(e) => setEtapaEditando({
                        ...etapaEditando,
                        nome: e.target.value,
                      })}
                      autoFocus
                    />
                    <div className="flex gap-1 flex-wrap max-w-[120px]">
                      {CORES_ETAPA.map((cor) => (
                        <button
                          key={cor}
                          className={`w-4 h-4 rounded-full transition-transform hover:scale-110 ${
                            etapaEditando.cor === cor
                              ? 'ring-2 ring-offset-1 ring-primary'
                              : ''
                          }`}
                          style={{ backgroundColor: cor }}
                          onClick={() => setEtapaEditando({
                            ...etapaEditando,
                            cor,
                          })}
                        />
                      ))}
                    </div>
                    <button
                      onClick={handleAtualizarEtapa}
                      disabled={salvandoEtapa}
                      className="text-green-600 hover:text-green-700 p-1"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEtapaEditando(null)}
                      className="text-muted-foreground hover:text-foreground p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium">{etapa.nome}</span>
                    <span className="text-xs text-muted-foreground">
                      #{porEtapa(etapa.id).length} ops
                    </span>
                    <button
                      onClick={() => {
                        setEtapaEditando(etapa);
                        setFormProbabilidade(etapa.probabilidade ?? 50);
                      }}
                      className="text-muted-foreground hover:text-foreground p-1 transition-colors"
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleExcluirEtapa(etapa.id)}
                      disabled={excluindoEtapaId === etapa.id}
                      className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                      title="Excluir"
                    >
                      {excluindoEtapaId === etapa.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">Nova Etapa</p>
            <div className="space-y-3">
              <input
                className="w-full text-sm border rounded-lg px-3 py-2 bg-background"
                placeholder="Nome da etapa..."
                value={novaEtapaNome}
                onChange={(e) => setNovaEtapaNome(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCriarEtapa();
                }}
              />
              <div>
                <p className="text-xs text-muted-foreground mb-2">Cor</p>
                <div className="flex gap-2 flex-wrap">
                  {CORES_ETAPA.map((cor) => (
                    <button
                      key={cor}
                      className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${
                        novaEtapaCor === cor
                          ? 'ring-2 ring-offset-2 ring-primary'
                          : ''
                      }`}
                      style={{ backgroundColor: cor }}
                      onClick={() => setNovaEtapaCor(cor)}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Probabilidade de fechamento (%)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={formProbabilidade}
                    onChange={e => setFormProbabilidade(Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <span className="text-sm font-bold w-10 text-right">{formProbabilidade}%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Chance média de fechar deals nesta etapa
                </p>
              </div>
              <Button
                onClick={handleCriarEtapa}
                disabled={salvandoEtapa || !novaEtapaNome.trim()}
                className="w-full rounded-lg"
              >
                {salvandoEtapa
                  ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  : <Plus className="h-4 w-4 mr-2" />}
                Adicionar Etapa
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
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
  const navigate = useNavigate();

  // State
  const [etapas, setEtapas] = useState<WorkflowEtapa[]>([]);
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [loadingEtapas, setLoadingEtapas] = useState(true);
  const [loadingOportunidades, setLoadingOportunidades] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroAtrasados, setFiltroAtrasados] = useState(false);

  // Modais
  const [modalCriarOpen, setModalCriarOpen] = useState(false);
  const [oportunidadeEditando, setOportunidadeEditando] = useState<Oportunidade | null>(null);
  const [oportunidadeDetalhes, setOportunidadeDetalhes] = useState<Oportunidade | null>(null);
  const [oportunidadeGanhar, setOportunidadeGanhar] = useState<Oportunidade | null>(null);
  const [oportunidadePerder, setOportunidadePerder] = useState<Oportunidade | null>(null);
  const [oportunidadeDeletar, setOportunidadeDeletar] = useState<Oportunidade | null>(null);
  const [modalEtapasOpen, setModalEtapasOpen] = useState(false);

  // DnD state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Data fetching
  const carregarEtapas = useCallback(async () => {
    setLoadingEtapas(true);
    const data = await svc.buscarEtapasWorkflow();
    setEtapas(data);
    setLoadingEtapas(false);
  }, []);

  const carregarOportunidades = useCallback(async () => {
    setLoadingOportunidades(true);
    const data = await svc.buscarOportunidades({ status: 'aberta' });
    setOportunidades(data);
    setLoadingOportunidades(false);
  }, []);

  useEffect(() => {
    carregarEtapas();
    carregarOportunidades();
  }, [carregarEtapas, carregarOportunidades]);

  // Computed
  const oportunidadesFiltradas = useMemo(() => {
    let result = oportunidades;
    if (busca.trim()) {
      const b = busca.toLowerCase();
      result = result.filter(o =>
        o.titulo?.toLowerCase().includes(b) ||
        o.lead_nome?.toLowerCase().includes(b)
      );
    }
    if (filtroAtrasados) {
      result = result.filter(o =>
        o.data_previsao_fechamento &&
        new Date(o.data_previsao_fechamento) < new Date()
      );
    }
    return result;
  }, [oportunidades, busca, filtroAtrasados]);

  const porEtapa = useCallback((etapaId: number) =>
    oportunidadesFiltradas.filter(o => o.etapa_id === etapaId),
    [oportunidadesFiltradas]
  );

  const stats = useMemo(() => {
    const abertas = oportunidades.filter(o => o.status === 'aberta');
    const ganhas = oportunidades.filter(o => o.status === 'ganha');
    const todas = oportunidades.filter(o => o.status !== 'aberta');
    const valorTotal = abertas.reduce((s, o) => s + (o.valor_estimado || 0), 0);
    const valorPonderado = abertas.reduce((s, o) => {
      const etapa = etapas.find(e => e.id === o.etapa_id);
      const prob = etapa?.probabilidade ?? 50;
      return s + (o.valor_estimado || 0) * (prob / 100);
    }, 0);
    const totalFechadas = ganhas.length + oportunidades.filter(o => o.status === 'perdida').length;
    const taxa = totalFechadas > 0 ? Math.round((ganhas.length / totalFechadas) * 100) : 0;
    return {
      totalAbertas: abertas.length,
      valorTotal,
      valorPonderado,
      totalGanhas: ganhas.length,
      taxa,
    };
  }, [oportunidades, etapas]);

  // Oportunidade ativa no drag
  const oportunidadeAtiva = useMemo(() =>
    activeId ? oportunidades.find(o => o.id === activeId) ?? null : null,
    [activeId, oportunidades]
  );

  const etapaAtiva = useMemo(() => {
    if (!oportunidadeAtiva) return null;
    return etapas.find(e => e.id === oportunidadeAtiva.etapa_id) ?? null;
  }, [oportunidadeAtiva, etapas]);

  // DnD handlers
  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragOver(event: DragOverEvent) {
    const { over } = event;
    setOverId(over ? String(over.id) : null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over || active.id === over.id) return;

    const overId = String(over.id);
    let novaEtapaId: number | null = null;

    // 1. Verificar se o drop foi em uma zona de etapa (useDroppable)
    if (overId.startsWith('etapa-')) {
      const etapaId = Number(overId.replace('etapa-', ''));
      const etapaDestino = etapas.find(e => e.id === etapaId);
      if (etapaDestino) novaEtapaId = etapaDestino.id;
    }
    // 2. Verificar se o drop foi em cima de outro card
    else {
      const oportunidadeDestino = oportunidades.find(o => o.id === overId);
      if (oportunidadeDestino) novaEtapaId = oportunidadeDestino.etapa_id;
    }

    if (!novaEtapaId) return;

    const oportunidade = oportunidades.find(o => o.id === String(active.id));
    if (!oportunidade || oportunidade.etapa_id === novaEtapaId) return;

    // Optimistic update
    setOportunidades(prev =>
      prev.map(o =>
        o.id === String(active.id)
          ? { ...o, etapa_id: novaEtapaId! }
          : o
      )
    );

    const result = await svc.moverEtapa(String(active.id), novaEtapaId);
    if (!result.success) {
      toast.error('Erro ao mover oportunidade');
      // Reverter
      setOportunidades(prev =>
        prev.map(o =>
          o.id === String(active.id)
            ? { ...o, etapa_id: oportunidade.etapa_id }
            : o
        )
      );
    } else {
      toast.success('Oportunidade movida!');
    }
  }

  // Ações nos cards
  async function handleGanhar(oportunidade: Oportunidade) {
    setOportunidadeGanhar(oportunidade);
  }

  async function handlePerder(oportunidade: Oportunidade) {
    setOportunidadePerder(oportunidade);
  }

  async function handleDeletar(oportunidade: Oportunidade) {
    setOportunidadeDeletar(oportunidade);
  }

  function handleEditar(oportunidade: Oportunidade) {
    setOportunidadeEditando(oportunidade);
  }

  function handleVerDetalhes(oportunidade: Oportunidade) {
    setOportunidadeDetalhes(oportunidade);
  }

  async function confirmarDeletar() {
    if (!oportunidadeDeletar) return;
    setLoadingId(oportunidadeDeletar.id);
    const result = await svc.deletarOportunidade(oportunidadeDeletar.id);
    setLoadingId(null);
    if (result.success) {
      toast.success('Oportunidade deletada');
      setOportunidades(prev => prev.filter(o => o.id !== oportunidadeDeletar.id));
    } else {
      toast.error(result.error || 'Erro ao deletar');
    }
    setOportunidadeDeletar(null);
  }

  // Render
  return (
    <DashboardLayout title="Pipeline CRM">
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="flex flex-col h-full space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Pipeline CRM</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Gerencie o funil de vendas da clínica
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setModalCriarOpen(true)}
              className="rounded-lg shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Oportunidade
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-shrink-0">
          {[
            { label: 'Em aberto', value: stats.totalAbertas, icon: Users, color: '#3B82F6', suffix: '' },
            { label: 'Valor total', value: formatBRL(stats.valorTotal), icon: DollarSign, color: '#10B981', isStr: true },
            { label: 'Forecast', value: formatBRL(stats.valorPonderado), icon: TrendingUp, color: '#6366F1', isStr: true },
            { label: 'Ganhas', value: stats.totalGanhas, icon: Trophy, color: '#F59E0B', suffix: '' },
          ].map(({ label, value, icon: Icon, color, isStr, suffix }) => (
            <Card key={label} className="rounded-xl border-0 shadow-sm overflow-hidden">
              <CardContent className="p-4 flex items-center gap-3">
                <div
                  className="rounded-xl p-2.5 flex-shrink-0"
                  style={{ backgroundColor: `${color}18` }}
                >
                  <Icon className="h-4 w-4" style={{ color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 font-medium truncate">{label}</p>
                  <p className="text-xl font-bold text-gray-900 tabular-nums leading-tight">
                    {isStr ? value : `${value}${suffix ?? ''}`}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Barra de progresso do funil */}
        {!loadingEtapas && etapas.length > 0 && (
          <div className="flex-shrink-0">
            <div className="flex h-2 rounded-full overflow-hidden bg-gray-100 gap-px">
              {etapas.map(etapa => {
                const count = porEtapa(etapa.id).length;
                const total = oportunidadesFiltradas.length;
                const pct = total > 0 ? (count / total) * 100 : 0;
                return pct > 0 ? (
                  <div
                    key={etapa.id}
                    className="h-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: etapa.cor }}
                    title={`${etapa.nome}: ${count}`}
                  />
                ) : null;
              })}
            </div>
            <div className="flex items-center gap-4 mt-1.5 flex-wrap">
              {etapas.map(etapa => {
                const count = porEtapa(etapa.id).length;
                return count > 0 ? (
                  <span key={etapa.id} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: etapa.cor }} />
                    {etapa.nome} ({count})
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-9 rounded-lg bg-white border-gray-200"
              placeholder="Buscar oportunidade..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>
          <button
            onClick={() => setFiltroAtrasados(v => !v)}
            className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-colors ${
              filtroAtrasados
                ? 'bg-red-50 border-red-200 text-red-700 font-medium'
                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Atrasados
          </button>
        </div>

        {/* Kanban Board */}
        {loadingEtapas ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex-shrink-0 w-72 space-y-3">
                <Skeleton className="h-10 rounded-xl" />
                {[1, 2].map(j => <Skeleton key={j} className="h-28 rounded-xl" />)}
              </div>
            ))}
          </div>
        ) : etapas.length === 0 ? (
          <Card className="rounded-xl border-0 shadow-sm">
            <CardContent className="p-10 text-center text-gray-500">
              <p className="font-medium text-gray-800">Nenhuma etapa configurada.</p>
              <p className="text-sm mt-1">Configure as etapas do pipeline clicando em "Etapas".</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate('/configuracoes/pipeline/etapas')}
              >
                <Settings2 className="h-4 w-4 mr-2" />
                Configurar Etapas
              </Button>
            </CardContent>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-6 flex-1">
              {etapas.map((etapa, idx) => (
                <KanbanColumn
                  key={etapa.id}
                  etapa={etapa}
                  oportunidades={porEtapa(etapa.id)}
                  etapas={etapas}
                  loadingId={loadingId}
                  animationDelay={idx * 80}
                  onGanhar={handleGanhar}
                  onPerder={handlePerder}
                  onDeletar={handleDeletar}
                  onEditar={handleEditar}
                  onVerDetalhes={handleVerDetalhes}
                />
              ))}
            </div>

            {/* DragOverlay — card fantasma durante drag */}
            <DragOverlay>
              {oportunidadeAtiva && etapaAtiva ? (
                <div className="bg-white rounded-xl border border-gray-200 shadow-2xl p-3 w-72 rotate-2 opacity-95">
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                    style={{ backgroundColor: etapaAtiva.cor }}
                  />
                  <p className="text-sm font-semibold text-gray-900 pl-2 truncate">
                    {oportunidadeAtiva.titulo}
                  </p>
                  <p className="text-xs text-gray-500 pl-2 mt-1">
                    {oportunidadeAtiva.lead_nome}
                  </p>
                  {oportunidadeAtiva.valor_estimado && (
                    <p className="text-sm font-bold text-gray-900 pl-2 mt-1">
                      {formatBRL(oportunidadeAtiva.valor_estimado)}
                    </p>
                  )}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* Link de configuração para admin/gestor */}
        {(user?.role === 'admin' || user?.role === 'gestor') && (
          <div className="flex justify-end flex-shrink-0 pt-2 border-t border-gray-100">
            <button
              onClick={() => navigate('/configuracoes/pipeline/etapas')}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Settings2 className="h-3.5 w-3.5" />
              Configurar etapas do pipeline
            </button>
          </div>
        )}

        {/* Modais */}
        <ModalCriar
          open={modalCriarOpen}
          etapas={etapas}
          onClose={() => setModalCriarOpen(false)}
          onSalvo={() => { setModalCriarOpen(false); carregarOportunidades(); }}
        />

        {oportunidadeEditando && (
          <ModalEditar
            oportunidade={oportunidadeEditando}
            onClose={() => setOportunidadeEditando(null)}
            onSalvo={() => { setOportunidadeEditando(null); carregarOportunidades(); }}
          />
        )}

        {oportunidadeDetalhes && (
          <ModalDetalhes
            oportunidade={oportunidadeDetalhes}
            etapas={etapas}
            onClose={() => setOportunidadeDetalhes(null)}
            onEditar={o => { setOportunidadeDetalhes(null); setOportunidadeEditando(o); }}
          />
        )}

        {oportunidadeGanhar && (
          <ModalGanhar
            oportunidade={oportunidadeGanhar}
            loading={loadingId === oportunidadeGanhar.id}
            onClose={() => setOportunidadeGanhar(null)}
            onConfirmar={async () => {
              setLoadingId(oportunidadeGanhar.id);
              const result = await svc.atualizarStatus(oportunidadeGanhar.id, 'ganha');
              setLoadingId(null);
              if (result.success) {
                toast.success('🎉 Oportunidade ganha!');
                setOportunidades(prev => prev.filter(o => o.id !== oportunidadeGanhar.id));
              } else {
                toast.error(result.error || 'Erro');
              }
              setOportunidadeGanhar(null);
            }}
          />
        )}

        {oportunidadePerder && (
          <ModalPerder
            oportunidade={oportunidadePerder}
            loading={loadingId === oportunidadePerder.id}
            onClose={() => setOportunidadePerder(null)}
            onConfirmar={async (motivo?: string) => {
              setLoadingId(oportunidadePerder.id);
              const result = await svc.atualizarStatus(oportunidadePerder.id, 'perdida', motivo);
              setLoadingId(null);
              if (result.success) {
                toast.success('Oportunidade marcada como perdida');
                setOportunidades(prev => prev.filter(o => o.id !== oportunidadePerder.id));
              } else {
                toast.error(result.error || 'Erro');
              }
              setOportunidadePerder(null);
            }}
          />
        )}

        {oportunidadeDeletar && (
          <Dialog
            open={!!oportunidadeDeletar}
            onOpenChange={v => { if (!v) setOportunidadeDeletar(null); }}
          >
            <DialogContent className="max-w-sm rounded-xl">
              <DialogHeader>
                <DialogTitle>Deletar oportunidade?</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-gray-500">
                Tem certeza? Esta ação não pode ser desfeita.
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOportunidadeDeletar(null)}>
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmarDeletar}
                  disabled={loadingId === oportunidadeDeletar.id}
                >
                  {loadingId === oportunidadeDeletar.id && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Deletar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <ModalEtapas
          open={modalEtapasOpen}
          etapas={etapas}
          onClose={() => setModalEtapasOpen(false)}
          onSalvo={() => { setModalEtapasOpen(false); carregarEtapas(); }}
          porEtapa={porEtapa}
        />

      </div>
    </DashboardLayout>
  );
}
