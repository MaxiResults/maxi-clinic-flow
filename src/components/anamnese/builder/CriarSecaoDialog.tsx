import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

interface CriarSecaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCriar: (dados: {
    titulo: string;
    descricao?: string;
    obrigatorio: boolean;
  }) => Promise<void>;
  proximaOrdem: number;
}

export function CriarSecaoDialog({
  open,
  onOpenChange,
  onCriar,
  proximaOrdem
}: CriarSecaoDialogProps) {
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    obrigatorio: false
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.titulo.trim()) return;

    setSubmitting(true);
    await onCriar(formData);
    setSubmitting(false);
    
    // Resetar form
    setFormData({ titulo: '', descricao: '', obrigatorio: false });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Seção</DialogTitle>
          <DialogDescription>
            Crie uma seção para organizar os campos do formulário.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título da Seção *</Label>
            <Input
              id="titulo"
              placeholder="Ex: Dados Pessoais"
              value={formData.titulo}
              onChange={(e) =>
                setFormData({ ...formData, titulo: e.target.value })
              }
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Textarea
              id="descricao"
              placeholder="Descreva o objetivo desta seção..."
              value={formData.descricao}
              onChange={(e) =>
                setFormData({ ...formData, descricao: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="obrigatorio">Seção obrigatória</Label>
              <p className="text-sm text-muted-foreground">
                Todos os campos desta seção serão obrigatórios
              </p>
            </div>
            <Switch
              id="obrigatorio"
              checked={formData.obrigatorio}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, obrigatorio: checked })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setFormData({ titulo: '', descricao: '', obrigatorio: false });
            }}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.titulo.trim() || submitting}
          >
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Criar Seção
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}