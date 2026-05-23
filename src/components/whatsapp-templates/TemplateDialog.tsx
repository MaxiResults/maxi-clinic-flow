import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TemplateForm } from './TemplateForm';

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TemplateDialog({ open, onOpenChange, onSuccess }: TemplateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Template WhatsApp</DialogTitle>
          <DialogDescription>
            Crie um template para ser aprovado pela Meta.
          </DialogDescription>
        </DialogHeader>
        <TemplateForm
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