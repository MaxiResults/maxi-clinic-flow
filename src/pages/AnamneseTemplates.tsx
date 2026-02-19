import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/EmptyState';
import { 
  FileText, 
  Plus, 
  RefreshCw, 
  Eye, 
  Edit, 
  Copy, 
  Trash2, 
  Power,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAnamneseTemplates } from '@/hooks/useAnamneseTemplates';
import { ListSkeleton } from '@/components/skeletons/ListSkeleton';
import { 
  TIPOS_TEMPLATE_LABELS,
  AnamneseTemplate
} from '@/types/anamnese.types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AnamneseTemplates() {
  const navigate = useNavigate();
  const {
    templates,
    loading,
    refreshing,
    listar,
    criar,
    atualizar,
    excluir,
    toggleAtivo,
    duplicar
  } = useAnamneseTemplates();

  const [dialogCriar, setDialogCriar] = useState(false);
  const [dialogEditar, setDialogEditar] = useState(false);
  const [dialogExcluir, setDialogExcluir] = useState(false);
  const [templateSelecionado, setTemplateSelecionado] = useState<AnamneseTemplate | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tipo: 'geral' as AnamneseTemplate['tipo']
  });

  useEffect(() => {
    listar();
  }, [listar]);

  const handleCriar = async () => {
    if (!formData.nome.trim()) return;

    setSubmitting(true);
    const resultado = await criar(formData);
    setSubmitting(false);

    if (resultado) {
      setDialogCriar(false);
      setFormData({ nome: '', descricao: '', tipo: 'geral' });
    }
  };

  const handleEditar = async () => {
    if (!templateSelecionado || !formData.nome.trim()) return;

    setSubmitting(true);
    const resultado = await atualizar(templateSelecionado.id, formData);
    setSubmitting(false);

    if (resultado) {
      setDialogEditar(false);
      setTemplateSelecionado(null);
      setFormData({ nome: '', descricao: '', tipo: 'geral' });
    }
  };

  const handleExcluir = async () => {
    if (!templateSelecionado) return;

    setSubmitting(true);
    const resultado = await excluir(templateSelecionado.id);
    setSubmitting(false);

    if (resultado) {
      setDialogExcluir(false);
      setTemplateSelecionado(null);
    }
  };

  const handleToggleAtivo = async (template: AnamneseTemplate) => {
    await toggleAtivo(template.id, !template.ativo);
  };

  const handleDuplicar = async (template: AnamneseTemplate) => {
    await duplicar(template.id, `${template.nome} (Cópia)`);
  };

  const abrirDialogEditar = (template: AnamneseTemplate) => {
    setTemplateSelecionado(template);
    setFormData({
      nome: template.nome,
      descricao: template.descricao || '',
      tipo: template.tipo
    });
    setDialogEditar(true);
  };

  const abrirDialogExcluir = (template: AnamneseTemplate) => {
    setTemplateSelecionado(template);
    setDialogExcluir(true);
  };

  if (loading) {
    return (
      <DashboardLayout title="Templates de Anamnese">
        <ListSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Templates de Anamnese">
      <div className="p-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Templates de Anamnese</h2>
            <p className="text-muted-foreground mt-1">
              Crie e gerencie formulários personalizados para seus pacientes
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => listar()}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button size="sm" onClick={() => setDialogCriar(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </div>
        </div>

        {/* Lista de Templates */}
        {templates.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhum template criado"
            description="Crie seu primeiro template de anamnese para começar a coletar informações dos pacientes."
            action={{
              label: 'Criar Template',
              onClick: () => setDialogCriar(true)
            }}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                {/* Header do Card */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{template.nome}</h3>
                      {!template.ativo && (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                          Inativo
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {TIPOS_TEMPLATE_LABELS[template.tipo]}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleAtivo(template)}
                    className="h-8 w-8 p-0"
                  >
                    <Power className={`h-4 w-4 ${template.ativo ? 'text-green-500' : 'text-muted-foreground'}`} />
                  </Button>
                </div>

                {/* Descrição */}
                {template.descricao && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {template.descricao}
                  </p>
                )}

                {/* Informações */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                  <span>Versão {template.versao}</span>
                  <span>•</span>
                  <span>{template.secoes?.length || 0} seções</span>
                </div>

                {/* Ações */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/anamnese/templates/${template.id}`)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicar(template)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => abrirDialogExcluir(template)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dialog Criar Template */}
        <Dialog open={dialogCriar} onOpenChange={setDialogCriar}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Template de Anamnese</DialogTitle>
              <DialogDescription>
                Crie um novo formulário personalizado para coletar informações dos pacientes.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Template *</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Anamnese Estética Facial"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value: AnamneseTemplate['tipo']) =>
                    setFormData({ ...formData, tipo: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPOS_TEMPLATE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descreva o objetivo deste formulário..."
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDialogCriar(false);
                  setFormData({ nome: '', descricao: '', tipo: 'geral' });
                }}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button onClick={handleCriar} disabled={!formData.nome.trim() || submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Editar Template */}
        <Dialog open={dialogEditar} onOpenChange={setDialogEditar}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Template</DialogTitle>
              <DialogDescription>
                Atualize as informações básicas do template.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nome">Nome do Template *</Label>
                <Input
                  id="edit-nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-tipo">Tipo *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value: AnamneseTemplate['tipo']) =>
                    setFormData({ ...formData, tipo: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPOS_TEMPLATE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-descricao">Descrição</Label>
                <Textarea
                  id="edit-descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDialogEditar(false);
                  setTemplateSelecionado(null);
                  setFormData({ nome: '', descricao: '', tipo: 'geral' });
                }}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button onClick={handleEditar} disabled={!formData.nome.trim() || submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Confirmar Exclusão */}
        <AlertDialog open={dialogExcluir} onOpenChange={setDialogExcluir}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o template "{templateSelecionado?.nome}"?
                <br />
                <br />
                <strong className="text-destructive">Esta ação não pode ser desfeita.</strong>
                {' '}Se houver anamneses vinculadas a este template, você não poderá excluí-lo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleExcluir}
                disabled={submitting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Excluir Template
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}