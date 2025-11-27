import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormattedDate } from '@/components/ui/FormattedDate';
import { Edit, Trash2, Mail, Phone } from 'lucide-react';
import type { Lead } from '@/hooks/useLeadsData';

interface LeadCardProps {
  lead: Lead;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const statusConfig = {
  novo: { label: "Novo", className: "bg-blue-100 text-blue-800 border-blue-200" },
  qualificado: { label: "Qualificado", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  convertido: { label: "Convertido", className: "bg-green-100 text-green-800 border-green-200" },
};

const formatPhone = (phone: string) => {
  const cleaned = phone.replace(/\D/g, '');
  const withoutCountry = cleaned.startsWith('55') ? cleaned.slice(2) : cleaned;
  
  if (withoutCountry.length === 11) {
    return `(${withoutCountry.slice(0, 2)}) ${withoutCountry.slice(2, 7)}-${withoutCountry.slice(7)}`;
  } else if (withoutCountry.length === 10) {
    return `(${withoutCountry.slice(0, 2)}) ${withoutCountry.slice(2, 6)}-${withoutCountry.slice(6)}`;
  }
  return phone;
};

export function LeadCard({ lead, onEdit, onDelete }: LeadCardProps) {
  const config = statusConfig[lead.status] || statusConfig.novo;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-foreground">{lead.nome}</h3>
            <Badge variant="outline" className={config.className}>
              {config.label}
            </Badge>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(lead.id)}
              className="h-8 w-8"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(lead.id)}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-4 w-4" />
          <span>{formatPhone(lead.telefone)}</span>
        </div>
        {lead.email && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{lead.canal_origem}</span>
            <FormattedDate value={lead.created_at} format="short" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
