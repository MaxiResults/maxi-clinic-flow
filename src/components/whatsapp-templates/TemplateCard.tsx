import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Trash2, Copy, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { TemplateStatusBadge } from './TemplateStatusBadge';
import { WhatsAppTemplate } from '@/hooks/useWhatsAppTemplates';

interface TemplateCardProps {
  template: WhatsAppTemplate;
  onDelete: (id: string) => void;
  onPreview: (template: WhatsAppTemplate) => void;
}

const categoryLabels: Record<WhatsAppTemplate['category'], string> = {
  utility: 'Utilidade',
  marketing: 'Marketing',
  authentication: 'Autenticação',
};

export function TemplateCard({ template, onDelete, onPreview }: TemplateCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0 space-y-1">
            <h3 className="font-semibold truncate font-mono text-sm">
              {template.name}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{categoryLabels[template.category]}</Badge>
              <TemplateStatusBadge status={template.status} />
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onPreview(template)}>
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(template.body);
                  toast.success('Corpo copiado');
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copiar corpo
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(template.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
          {template.body}
        </p>
        {template.status === 'rejected' && template.rejection_reason && (
          <div className="rounded border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">
            <strong>Motivo da rejeição:</strong> {template.rejection_reason}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Criado em {new Date(template.created_at).toLocaleDateString('pt-BR')}
          {template.approved_at && (
            <> • Aprovado em {new Date(template.approved_at).toLocaleDateString('pt-BR')}</>
          )}
        </p>
      </CardContent>
    </Card>
  );
}