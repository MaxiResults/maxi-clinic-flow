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
import { Plus, Search, FileText } from 'lucide-react';
import {
  useWhatsAppTemplates,
  WhatsAppTemplate,
} from '@/hooks/useWhatsAppTemplates';
import { TemplateCard } from '@/components/whatsapp-templates/TemplateCard';
import { TemplateDialog } from '@/components/whatsapp-templates/TemplateDialog';
import { TemplatePreview } from '@/components/whatsapp-templates/TemplatePreview';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function WhatsAppTemplates() {
  const { templates, loading, error, fetchTemplates, deleteTemplate } =
    useWhatsAppTemplates();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] =
    useState<WhatsAppTemplate | null>(null);

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');

  const templatesFiltrados = templates.filter((t) => {
    const matchBusca =
      !busca ||
      t.name.toLowerCase().includes(busca.toLowerCase()) ||
      t.body.toLowerCase().includes(busca.toLowerCase());

    const matchStatus = filtroStatus === 'todos' || t.status === filtroStatus;
    const matchCategoria =
      filtroCategoria === 'todos' || t.category === filtroCategoria;

    return matchBusca && matchStatus && matchCategoria;
  });

  const handleDelete = async () => {
    if (deleteId) {
      await deleteTemplate(deleteId);
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Templates WhatsApp">
        <ListSkeleton />
      </DashboardLayout>
    );
  }

  const hasFiltros =
    !!busca || filtroStatus !== 'todos' || filtroCategoria !== 'todos';

  return (
    <DashboardLayout title="Templates WhatsApp">
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
              placeholder="Buscar por nome ou conteúdo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Status</SelectItem>
                <SelectItem value="pending">Aguardando</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
                <SelectItem value="paused">Pausado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas Categorias</SelectItem>
                <SelectItem value="utility">Utilidade</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="authentication">Autenticação</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Template
            </Button>
          </div>
        </div>

        {templatesFiltrados.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={
              hasFiltros
                ? 'Nenhum template encontrado'
                : 'Nenhum template cadastrado'
            }
            description={
              hasFiltros
                ? 'Tente ajustar os filtros aplicados.'
                : 'Crie seu primeiro template WhatsApp.'
            }
            action={
              !hasFiltros
                ? { label: 'Novo Template', onClick: () => setDialogOpen(true) }
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templatesFiltrados.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onDelete={(id) => setDeleteId(id)}
                onPreview={(t) => setPreviewTemplate(t)}
              />
            ))}
          </div>
        )}

        <TemplateDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={() => fetchTemplates()}
        />

        <Dialog
          open={!!previewTemplate}
          onOpenChange={(open) => !open && setPreviewTemplate(null)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-mono text-base">
                {previewTemplate?.name}
              </DialogTitle>
            </DialogHeader>
            {previewTemplate && (
              <TemplatePreview
                headerType={previewTemplate.header_type}
                headerContent={previewTemplate.header_content}
                body={previewTemplate.body}
                footer={previewTemplate.footer}
                buttons={previewTemplate.buttons}
              />
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este template? Esta ação não pode
                ser desfeita.
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