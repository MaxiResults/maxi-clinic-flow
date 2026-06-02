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
import { useLeadTags } from '@/hooks/useLeadTags';
import { Check, Loader2 } from 'lucide-react';

interface LeadTagManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  onTagsChange?: () => void;
}

export function LeadTagManager({
  open,
  onOpenChange,
  leadId,
  onTagsChange,
}: LeadTagManagerProps) {
  const { tags: todasTags, loading: loadingTodas } = useTags();
  const { tags: tagsAtribuidas, atribuirTag, removerTag, loading } = useLeadTags(
    open ? leadId : null
  );

  const isTagAtribuida = (tagId: string) =>
    tagsAtribuidas.some(t => t.id === tagId);

  const handleToggleTag = async (tagId: string) => {
    if (isTagAtribuida(tagId)) {
      await removerTag(tagId);
    } else {
      await atribuirTag(tagId);
    }
    onTagsChange?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Gerenciar Tags do Lead</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {loadingTodas || loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : todasTags.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma tag disponível. Crie tags em Configurações → Tags.
            </p>
          ) : (
            todasTags.map(tag => {
              const atribuida = isTagAtribuida(tag.id);
              return (
                <div
                  key={tag.id}
                  className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                    atribuida ? 'bg-accent' : 'hover:bg-accent/50'
                  }`}
                  onClick={() => handleToggleTag(tag.id)}
                >
                  <TagBadge nome={tag.nome} cor={tag.cor} size="md" />
                  {atribuida && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
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
