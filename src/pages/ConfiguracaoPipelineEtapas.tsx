import { useState, useEffect, useCallback } from 'react';
import {
  DndContext, DragEndEvent, PointerSensor,
  useSensor, useSensors, closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable,
  verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  GripVertical, Plus, Pencil, Trash2, Check,
  X, Loader2, ArrowLeft, Settings2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import type { WorkflowEtapa } from '@/types/oportunidade';

// ─────────────────────────────────────────
// Cores disponíveis
// ─────────────────────────────────────────

const CORES_ETAPA = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444',
  '#F59E0B', '#10B981', '#3B82F6', '#06B6D4',
  '#84CC16', '#F97316',
];

// ─────────────────────────────────────────
// Componente: SortableEtapa (card arrastável)
// ─────────────────────────────────────────

function SortableEtapa({
  etapa,
  editandoId,
  salvando,
  excluindoId,
  onEditar,
  onCancelarEdicao,
  onSalvarEdicao,
  onExcluir,
  formEtapa,
  setFormEtapa,
}: {
  etapa: WorkflowEtapa;
  editandoId: number | null;
  salvando: boolean;
  excluindoId: number | null;
  onEditar: (etapa: WorkflowEtapa) => void;
  onCancelarEdicao: () => void;
  onSalvarEdicao: () => void;
  onExcluir: (id: number) => void;
  formEtapa: { nome: string; cor: string; probabilidade: number };
  setFormEtapa: (f: any) => void;
}) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: etapa.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isEditando = editandoId === etapa.id;

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`
          relative bg-white rounded-xl border transition-all duration-200
          ${isDragging ? 'shadow-2xl border-primary/30 scale-[1.02]' : 'shadow-sm border-gray-100 hover:shadow-md'}
          ${isEditando ? 'border-primary/40 ring-2 ring-primary/10' : ''}
          overflow-hidden
        `}
      >
        {/* Borda lateral colorida */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
          style={{ backgroundColor: etapa.cor }}
        />

        {!isEditando ? (
          // ── Modo visualização ──
          <div className="pl-5 pr-4 py-4 flex items-center gap-4">
            {/* Drag handle */}
            <button
              {...attributes}
              {...listeners}
              className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
            >
              <GripVertical className="h-5 w-5" />
            </button>

            {/* Cor */}
            <div
              className="w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-white shadow-sm"
              style={{ backgroundColor: etapa.cor }}
            />

            {/* Nome e ordem */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 text-sm truncate">
                  {etapa.nome}
                </span>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  #{etapa.ordem}
                </span>
              </div>
              {/* Barra de probabilidade */}
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[120px]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${etapa.probabilidade ?? 50}%`,
                      backgroundColor: etapa.cor,
                    }}
                  />
                </div>
                <span className="text-xs text-gray-400 font-medium">
                  {etapa.probabilidade ?? 50}%
                </span>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => onEditar(etapa)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title="Editar"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => onExcluir(etapa.id)}
                disabled={excluindoId === etapa.id}
                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                title="Excluir"
              >
                {excluindoId === etapa.id
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Trash2 className="h-4 w-4" />
                }
              </button>
            </div>
          </div>
        ) : (
          // ── Modo edição expandido ──
          <div className="pl-5 pr-4 py-4 space-y-3">
            <div className="flex items-center gap-2">
              <GripVertical className="h-5 w-5 text-gray-200 flex-shrink-0" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                Editando etapa
              </span>
            </div>

            <div className="space-y-3 ml-7">
              {/* Nome */}
              <div className="space-y-1.5">
                <Label className="text-xs">Nome da etapa</Label>
                <Input
                  value={formEtapa.nome}
                  onChange={e => setFormEtapa((p: any) => ({ ...p, nome: e.target.value }))}
                  placeholder="Ex: Negociação"
                  className="h-8 text-sm"
                  autoFocus
                />
              </div>

              {/* Cor */}
              <div className="space-y-1.5">
                <Label className="text-xs">Cor</Label>
                <div className="flex gap-2 flex-wrap">
                  {CORES_ETAPA.map(cor => (
                    <button
                      key={cor}
                      type="button"
                      onClick={() => setFormEtapa((p: any) => ({ ...p, cor }))}
                      className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${
                        formEtapa.cor === cor
                          ? 'ring-2 ring-offset-2 ring-primary scale-110'
                          : ''
                      }`}
                      style={{ backgroundColor: cor }}
                    />
                  ))}
                </div>
              </div>

              {/* Probabilidade */}
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Probabilidade de fechamento: <span className="font-bold text-primary">{formEtapa.probabilidade}%</span>
                </Label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={formEtapa.probabilidade}
                  onChange={e => setFormEtapa((p: any) => ({
                    ...p, probabilidade: Number(e.target.value)
                  }))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={onSalvarEdicao}
                  disabled={salvando || !formEtapa.nome.trim()}
                  className="h-8"
                >
                  {salvando
                    ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    : <Check className="h-3.5 w-3.5 mr-1.5" />
                  }
                  Salvar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onCancelarEdicao}
                  disabled={salvando}
                  className="h-8"
                >
                  <X className="h-3.5 w-3.5 mr-1.5" />
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Componente Principal
// ─────────────────────────────────────────

export default function ConfiguracaoPipelineEtapas() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirecionar se não for admin ou gestor
  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'gestor') {
      navigate('/configuracoes');
    }
  }, [user, navigate]);

  const [etapas, setEtapas] = useState<WorkflowEtapa[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Form edição
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [formEtapa, setFormEtapa] = useState({
    nome: '', cor: '#6366F1', probabilidade: 50
  });

  // Form nova etapa
  const [novoNome, setNovoNome] = useState('');
  const [novaCor, setNovaCor] = useState('#6366F1');
  const [novaProbabilidade, setNovaProbabilidade] = useState(50);
  const [criando, setCriando] = useState(false);
  const [mostrarFormNovo, setMostrarFormNovo] = useState(false);

  // DnD
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const fetchEtapas = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/workflow-etapas');
      const data = res.data?.data ?? res.data;
      const sorted = [...(Array.isArray(data) ? data : [])]
        .sort((a, b) => a.ordem - b.ordem);
      setEtapas(sorted);
    } catch {
      toast.error('Erro ao carregar etapas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEtapas(); }, [fetchEtapas]);

  // Drag end — reordenar localmente e salvar no backend
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = etapas.findIndex(e => e.id === active.id);
    const newIndex = etapas.findIndex(e => e.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordenadas = arrayMove(etapas, oldIndex, newIndex).map(
      (e, idx) => ({ ...e, ordem: idx + 1 })
    );
    setEtapas(reordenadas);

    // Salvar nova ordem no backend
    try {
      await Promise.all(
        reordenadas.map(e =>
          api.patch(`/workflow-etapas/${e.id}`, { ordem: e.ordem, nome: e.nome })
        )
      );
      toast.success('Ordem atualizada!');
    } catch {
      toast.error('Erro ao salvar ordem');
      fetchEtapas(); // Reverter
    }
  }

  function handleEditar(etapa: WorkflowEtapa) {
    setEditandoId(etapa.id);
    setFormEtapa({
      nome: etapa.nome,
      cor: etapa.cor,
      probabilidade: etapa.probabilidade ?? 50,
    });
  }

  async function handleSalvarEdicao() {
    if (!editandoId || !formEtapa.nome.trim()) return;
    setSalvando(true);
    try {
      await api.patch(`/workflow-etapas/${editandoId}`, {
        nome: formEtapa.nome.trim(),
        cor: formEtapa.cor,
        probabilidade: formEtapa.probabilidade,
      });
      toast.success('Etapa atualizada!');
      setEditandoId(null);
      await fetchEtapas();
    } catch {
      toast.error('Erro ao atualizar etapa');
    } finally {
      setSalvando(false);
    }
  }

  async function handleCriar() {
    if (!novoNome.trim()) return;
    setCriando(true);
    try {
      await api.post('/workflow-etapas', {
        nome: novoNome.trim(),
        cor: novaCor,
        ordem: etapas.length + 1,
        probabilidade: novaProbabilidade,
      });
      toast.success('Etapa criada!');
      setNovoNome('');
      setNovaCor('#6366F1');
      setNovaProbabilidade(50);
      setMostrarFormNovo(false);
      await fetchEtapas();
    } catch {
      toast.error('Erro ao criar etapa');
    } finally {
      setCriando(false);
    }
  }

  async function handleExcluir(id: number) {
    setDeleteConfirmId(id);
  }

  async function confirmarExclusao() {
    if (!deleteConfirmId) return;
    setExcluindoId(deleteConfirmId);
    setDeleteConfirmId(null);
    try {
      await api.delete(`/workflow-etapas/${deleteConfirmId}`);
      toast.success('Etapa excluída!');
      await fetchEtapas();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao excluir etapa');
    } finally {
      setExcluindoId(null);
    }
  }

  const etapaParaDeletar = etapas.find(e => e.id === deleteConfirmId);

  return (
    <DashboardLayout title="Etapas do Pipeline">
      <div className="max-w-2xl mx-auto space-y-6 p-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/configuracoes')}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Etapas do Pipeline
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Arraste para reordenar. Cada etapa representa uma fase do funil de vendas.
              </p>
            </div>
          </div>
          <Button
            onClick={() => setMostrarFormNovo(v => !v)}
            className="rounded-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Etapa
          </Button>
        </div>

        {/* Form nova etapa */}
        {mostrarFormNovo && (
          <div className="bg-white rounded-xl border border-primary/20 shadow-sm p-5 space-y-4 ring-2 ring-primary/10">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Nova Etapa</span>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nome *</Label>
              <Input
                value={novoNome}
                onChange={e => setNovoNome(e.target.value)}
                placeholder="Ex: Avaliação Agendada"
                onKeyDown={e => { if (e.key === 'Enter') handleCriar(); }}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cor</Label>
              <div className="flex gap-2 flex-wrap">
                {CORES_ETAPA.map(cor => (
                  <button
                    key={cor}
                    type="button"
                    onClick={() => setNovaCor(cor)}
                    className={`w-7 h-7 rounded-full transition-all hover:scale-110 ${
                      novaCor === cor
                        ? 'ring-2 ring-offset-2 ring-primary scale-110'
                        : ''
                    }`}
                    style={{ backgroundColor: cor }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">
                Probabilidade de fechamento:{' '}
                <span className="font-bold text-primary">{novaProbabilidade}%</span>
              </Label>
              <input
                type="range" min={0} max={100} step={5}
                value={novaProbabilidade}
                onChange={e => setNovaProbabilidade(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>Improvável</span>
                <span>Moderado</span>
                <span>Certo</span>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                onClick={handleCriar}
                disabled={criando || !novoNome.trim()}
                className="h-9"
              >
                {criando
                  ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  : <Plus className="h-4 w-4 mr-2" />
                }
                Criar Etapa
              </Button>
              <Button
                variant="outline"
                onClick={() => setMostrarFormNovo(false)}
                className="h-9"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Lista de etapas com DnD */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : etapas.length === 0 ? (
          <div className="text-center py-16">
            <Settings2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhuma etapa configurada</p>
            <p className="text-sm text-gray-400 mt-1">
              Crie a primeira etapa do seu pipeline
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={etapas.map(e => e.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2 relative">
                {etapas.map(etapa => (
                  <SortableEtapa
                    key={etapa.id}
                    etapa={etapa}
                    editandoId={editandoId}
                    salvando={salvando}
                    excluindoId={excluindoId}
                    onEditar={handleEditar}
                    onCancelarEdicao={() => setEditandoId(null)}
                    onSalvarEdicao={handleSalvarEdicao}
                    onExcluir={handleExcluir}
                    formEtapa={formEtapa}
                    setFormEtapa={setFormEtapa}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Dica de arrastar */}
        {etapas.length > 1 && !loading && (
          <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1.5">
            <GripVertical className="h-3.5 w-3.5" />
            Arraste pelo ícone para reordenar as etapas
          </p>
        )}

      </div>

      {/* AlertDialog confirmação exclusão */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={open => { if (!open) setDeleteConfirmId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir etapa?</AlertDialogTitle>
            <AlertDialogDescription>
              A etapa <strong>{etapaParaDeletar?.nome}</strong> será excluída permanentemente.
              Só é possível excluir etapas sem oportunidades em aberto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={confirmarExclusao}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </DashboardLayout>
  );
}
