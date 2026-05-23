import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TagBadge } from './TagBadge';
import { useTags } from '@/hooks/useTags';
import { useConversaTags } from '@/hooks/useConversaTags';
import { Check } from 'lucide-react';

interface TagManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessaoId: string;
}

export function TagManager({ open, onOpenChange, sessaoId }: TagManagerProps) {
  const { tags: todasTags, loading: loadingTodas } = useTags();
  const { tags: tagsAtribuidas, atribuirTag, removerTag } = useConversaTags(sessaoId);

  const isTagAtribuida = (tagId: string) => tagsAtribuidas.some((t) => t.id === tagId);

  const handleToggleTag = async (tagId: string) => {
    if (isTagAtribuida(tagId)) {
      await removerTag(tagId);
    } else {
      await atribuirTag(tagId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar Tags</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {loadingTodas ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : todasTags.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma tag disponível. Crie tags em Configurações.
            </p>
          ) : (
            todasTags.map((tag) => {
              const atribuida = isTagAtribuida(tag.id);
              return (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer"
                  onClick={() => handleToggleTag(tag.id)}
                >
                  <TagBadge nome={tag.nome} cor={tag.cor} size="md" />
                  {atribuida && <Check className="h-4 w-4 text-primary" />}
                </div>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}