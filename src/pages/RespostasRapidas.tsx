import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, MessageSquare } from 'lucide-react';
import { useRespostasRapidas } from '@/hooks/useRespostasRapidas';
import { RespostaRapidaCard } from '@/components/respostas-rapidas/RespostaRapidaCard';
import { RespostaRapidaDialog } from '@/components/respostas-rapidas/RespostaRapidaDialog';
import { ListSkeleton } from '@/components/skeletons/ListSkeleton';
import { EmptyState } from '@/components/EmptyState';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function RespostasRapidas() {
  const { respostas, loading, error, fetchRespostas, deleteResposta } =
    useRespostasRapidas();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [busca, setBusca] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState<'todos' | 'ativo' | 'inativo'>('todos');

  const respostasFiltradas = respostas.filter((r) => {
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

  const handleDelete = async () => {
    if (deleteId) {
      await deleteResposta(deleteId);
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Respostas Rápidas">
        <ListSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Respostas Rápidas">
      <div className="space-y-6">
        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por atalho, título ou conteúdo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={filtroAtivo}
              onValueChange={(v) => setFiltroAtivo(v as 'todos' | 'ativo' | 'inativo')}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => {
                setDialogMode('create');
                setSelectedId(undefined);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Resposta
            </Button>
          </div>
        </div>

        {respostasFiltradas.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title={
              busca || filtroAtivo !== 'todos'
                ? 'Nenhuma resposta encontrada'
                : 'Nenhuma resposta rápida cadastrada'
            }
            description={
              busca || filtroAtivo !== 'todos'
                ? 'Tente ajustar os filtros aplicados.'
                : 'Crie sua primeira resposta rápida para agilizar o atendimento.'
            }
            action={
              !busca && filtroAtivo === 'todos'
                ? {
                    label: 'Nova Resposta',
                    onClick: () => {
                      setDialogMode('create');
                      setSelectedId(undefined);
                      setDialogOpen(true);
                    },
                  }
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {respostasFiltradas.map((resposta) => (
              <RespostaRapidaCard
                key={resposta.id}
                resposta={resposta}
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

        <RespostaRapidaDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          mode={dialogMode}
          respostaId={selectedId}
          onSuccess={() => fetchRespostas()}
        />

        <AlertDialog
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta resposta rápida? Esta ação não
                pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}