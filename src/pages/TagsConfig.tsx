import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TagBadge } from '@/components/tags/TagBadge';
import { useTags, Tag } from '@/hooks/useTags';
import { Plus, Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const coresPresets = [
  '#EF4444',
  '#F59E0B',
  '#10B981',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#6B7280',
];

export default function TagsConfig() {
  const { tags, loading, criarTag, atualizarTag, deletarTag } = useTags();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState('#6B7280');

  const handleSalvar = async () => {
    if (!nome.trim()) return;
    try {
      if (editando) {
        await atualizarTag(editando, nome, cor, 'Tag');
      } else {
        await criarTag(nome, cor);
      }
      setDialogOpen(false);
      setNome('');
      setCor('#6B7280');
      setEditando(null);
    } catch {
      /* tratado no hook */
    }
  };

  const handleEditar = (tag: Tag) => {
    setEditando(tag.id);
    setNome(tag.nome);
    setCor(tag.cor);
    setDialogOpen(true);
  };

  const handleNovaTag = () => {
    setEditando(null);
    setNome('');
    setCor('#6B7280');
    setDialogOpen(true);
  };

  return (
    <DashboardLayout title="Tags">
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">🏷️ Tags e Categorias</h1>
            <p className="text-muted-foreground mt-2">
              Crie tags para organizar e categorizar suas conversas
            </p>
          </div>
          <Button onClick={handleNovaTag}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Tag
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : tags.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhuma tag criada ainda. Clique em "Nova Tag" para começar.
              </CardContent>
            </Card>
          ) : (
            tags.map((tag) => (
              <Card key={tag.id}>
                <CardContent className="py-4 flex items-center justify-between">
                  <TagBadge nome={tag.nome} cor={tag.cor} size="md" />
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEditar(tag)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deletarTag(tag.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Tag' : 'Nova Tag'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nome da Tag</Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Urgente, VIP, Orçamento"
                maxLength={50}
              />
            </div>

            <div>
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {coresPresets.map((presetCor) => (
                  <button
                    key={presetCor}
                    type="button"
                    onClick={() => setCor(presetCor)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      cor === presetCor ? 'border-foreground' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: presetCor }}
                  />
                ))}
              </div>
              <Input
                type="color"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                className="mt-2 h-10 w-20 p-1"
              />
            </div>

            <div>
              <Label>Preview</Label>
              <div className="mt-2">
                <TagBadge nome={nome || 'Tag'} cor={cor} size="md" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} disabled={!nome.trim()}>
              {editando ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}