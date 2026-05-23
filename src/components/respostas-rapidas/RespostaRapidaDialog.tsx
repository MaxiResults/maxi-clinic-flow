import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RespostaRapidaForm } from './RespostaRapidaForm';

interface RespostaRapidaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  respostaId?: string;
  onSuccess: () => void;
}

export function RespostaRapidaDialog({
  open,
  onOpenChange,
  mode,
  respostaId,
  onSuccess,
}: RespostaRapidaDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nova Resposta Rápida' : 'Editar Resposta Rápida'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Crie uma resposta rápida para agilizar o atendimento'
              : 'Edite as informações da resposta rápida'}
          </DialogDescription>
        </DialogHeader>
        <RespostaRapidaForm
          mode={mode}
          respostaId={respostaId}
          onSuccess={() => {
            onSuccess();
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}