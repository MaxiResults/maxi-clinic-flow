import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, MessageSquare, Zap, CheckCircle, XCircle } from 'lucide-react';
import { useRespostasRapidas } from '@/hooks/useRespostasRapidas';
import { RespostaRapidaCard } from '@/components/respostas-rapidas/RespostaRapidaCard';
import { RespostaRapidaDialog } from '@/components/respostas-rapidas/RespostaRapidaDialog';
import { Skeleton } from '@/components/ui/skeleton';

export default function RespostasRapidas() {
  const { respostas, loading, error, fetchRespostas, deleteResposta } =
    useRespostasRapidas();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState<'todos' | 'ativo' | 'inativo'>('todos');

  const respostasFiltradas = useMemo(() => {
    return respostas.filter((r) => {
      const matchBusca =
        !busca ||
        r.atalho.toLowerCase().includes(busca.toLowerCase()) ||
        r.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        r.conteudo.toLowerCase().includes(busca.toLowerCase());
      const matchAtivo =
        filtroAtivo === 'todos' ||
        (filtroAtivo === 'ativo' && r.ativo) ||
        (filtroAtivo === 'inativo' && !r.ativo);
      return matchBusca && matchAtivo;
    });
  }, [respostas, busca, filtroAtivo]);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteResposta(deleteId);
      setDeleteId(null);
    }
  };

  const handleAbrirCriar = () => {
    setDialogMode('create');
    setSelectedId(undefined);
    setDialogOpen(true);
  };

  const stats = useMemo(() => ({
    total: respostas.length,
    ativas: respostas.filter(r => r.ativo).length,
    inativas: respostas.filter(r => !r.ativo).length,
  }), [respostas]);

  return (
    <DashboardLayout title="Respostas Rápidas">
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Respostas Rápidas
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Digite <span className="font-mono font-bold text-primary">/atalho</span> no
              chat para usar. Agilize o atendimento com mensagens pré-definidas.
            </p>
          </div>
          <Button onClick={handleAbrirCriar} className="rounded-lg shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Resposta
          </Button>
        </div>

        {/* Stats cards */}
        {!loading && respostas.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total', value: stats.total, icon: MessageSquare, color: '#6366F1' },
              { label: 'Ativas', value: stats.ativas, icon: CheckCircle, color: '#10B981' },
              { label: 'Inativas', value: stats.inativas, icon: XCircle, color: '#6B7280' },
            ].map(({ label, value, icon: Icon, color }, idx) => (
              <div
                key={label}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
                style={{ animation: 'fadeSlideIn 0.35s ease both', animationDelay: `${idx * 60}ms` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-500">{label}</p>
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${color}18` }}>
                    <Icon className="h-3.5 w-3.5" style={{ color }} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Erro */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por atalho, título ou conteúdo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9 bg-white border-gray-200 rounded-lg"
            />
          </div>
          <Select
            value={filtroAtivo}
            onValueChange={(v) => setFiltroAtivo(v as 'todos' | 'ativo' | 'inativo')}
          >
            <SelectTrigger className="w-full sm:w-40 bg-white border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="ativo">✅ Ativos</SelectItem>
              <SelectItem value="inativo">⭕ Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-44 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && respostasFiltradas.length === 0 && (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Zap className="h-7 w-7 text-primary" />
            </div>
            <h3 className="font-semibold text-gray-800 text-lg">
              {busca || filtroAtivo !== 'todos'
                ? 'Nenhuma resposta encontrada'
                : 'Nenhuma resposta rápida cadastrada'}
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
              {busca || filtroAtivo !== 'todos'
                ? 'Tente ajustar os filtros aplicados.'
                : 'Crie sua primeira resposta para agilizar o atendimento via chat.'}
            </p>
            {!busca && filtroAtivo === 'todos' && (
              <Button onClick={handleAbrirCriar} className="mt-4 rounded-lg">
                <Plus className="h-4 w-4 mr-2" />
                Nova Resposta
              </Button>
            )}
          </div>
        )}

        {/* Grid */}
        {!loading && respostasFiltradas.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {respostasFiltradas.map((resposta, idx) => (
              <RespostaRapidaCard
                key={resposta.id}
                resposta={resposta}
                animationDelay={idx * 40}
                onEdit={(id) => {
                  setDialogMode('edit');
                  setSelectedId(id);
                  setDialogOpen(true);
                }}
                onDelete={(id) => setDeleteId(id)}
              />
            ))}
          </div>
        )}

      </div>

      {/* Dialog criar/editar */}
      <RespostaRapidaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        respostaId={selectedId}
        onSuccess={() => fetchRespostas()}
      />

      {/* AlertDialog excluir */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir resposta rápida?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </DashboardLayout>
  );
}
