import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LeadForm } from './LeadForm';

interface LeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  leadId?: string;
  onSuccess: () => void;
}

export function LeadDialog({ open, onOpenChange, mode, leadId, onSuccess }: LeadDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Novo Lead' : 'Editar Lead'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Preencha os dados do novo lead' 
              : 'Atualize as informações do lead'}
          </DialogDescription>
        </DialogHeader>
        
        <LeadForm
          mode={mode}
          leadId={leadId}
          onSuccess={() => {
            onOpenChange(false);
            onSuccess();
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
