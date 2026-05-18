import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Pencil } from 'lucide-react';
import { useState } from 'react';
import type { Lead } from '@/hooks/useLeadsData';

interface LeadViewModalProps {
  open: boolean;
  onClose: () => void;
  lead: Lead;
  onEdit: () => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  novo: { label: 'Novo', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  qualificado: { label: 'Qualificado', className: 'bg-green-100 text-green-800 border-green-200' },
  convertido: { label: 'Convertido', className: 'bg-purple-100 text-purple-800 border-purple-200' },
  perdido: { label: 'Perdido', className: 'bg-red-100 text-red-800 border-red-200' },
};

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

const formatDateOnly = (dateStr?: string | null) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};

const formatPhone = (phone?: string) => {
  if (!phone) return '—';
  const cleaned = phone.replace(/\D/g, '');
  const withoutCountry = cleaned.startsWith('55') ? cleaned.slice(2) : cleaned;
  if (withoutCountry.length === 11) {
    return `(${withoutCountry.slice(0, 2)}) ${withoutCountry.slice(2, 7)}-${withoutCountry.slice(7)}`;
  } else if (withoutCountry.length === 10) {
    return `(${withoutCountry.slice(0, 2)}) ${withoutCountry.slice(2, 6)}-${withoutCountry.slice(6)}`;
  }
  return phone;
};

const formatCPF = (cpf?: string) => {
  if (!cpf) return '—';
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
  }
  return cpf;
};

function Field({ label, value, className = '' }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm text-foreground break-words">{value || '—'}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="text-sm font-medium text-muted-foreground mb-3">{children}</h4>;
}

export function LeadViewModal({ open, onClose, lead, onEdit }: LeadViewModalProps) {
  const [marketingOpen, setMarketingOpen] = useState(false);

  if (!lead) return null;

  const statusCfg = statusConfig[lead.status] || { label: lead.status, className: 'bg-gray-100 text-gray-800 border-gray-200' };
  const wa = lead as Lead & { whatsapp_id?: string; whatsapp_nome?: string; primeira_mensagem_em?: string | null };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Informações do Lead</DialogTitle>
          <DialogDescription>Dados completos do cadastro</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Dados Pessoais */}
          <section>
            <SectionTitle>Dados Pessoais</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nome completo" value={lead.nome} />
              <Field label="Telefone" value={formatPhone(lead.telefone)} />
              <Field label="Email" value={lead.email} />
              <Field label="CPF" value={formatCPF(lead.cpf)} />
              <Field label="Canal de Origem" value={lead.canal_origem} />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Badge variant="outline" className={statusCfg.className}>{statusCfg.label}</Badge>
              </div>
            </div>
          </section>

          {/* WhatsApp */}
          {wa.whatsapp_id && (
            <>
              <Separator />
              <section>
                <SectionTitle>WhatsApp</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="WhatsApp ID" value={wa.whatsapp_id} />
                  <Field label="Nome no WhatsApp" value={wa.whatsapp_nome} />
                  <Field label="Primeira mensagem" value={formatDateOnly(wa.primeira_mensagem_em)} className="md:col-span-2" />
                </div>
              </section>
            </>
          )}

          {/* Interesse e Observações */}
          <Separator />
          <section>
            <SectionTitle>Interesse e Observações</SectionTitle>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Interesse</p>
                <p className="text-sm text-foreground whitespace-pre-wrap min-h-[2rem] break-words">{lead.interesse || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Observações</p>
                <p className="text-sm text-foreground whitespace-pre-wrap min-h-[2rem] break-words">{lead.observacoes || '—'}</p>
              </div>
            </div>
          </section>

          {/* Dados de Marketing - Collapsible */}
          <Separator />
          <Collapsible open={marketingOpen} onOpenChange={setMarketingOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <span>Dados de Marketing</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${marketingOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="UTM Source" value={lead.utm_source} />
                <Field label="UTM Medium" value={lead.utm_medium} />
                <Field label="UTM Campaign" value={lead.utm_campaign} />
                <Field label="UTM Content" value={lead.utm_content} />
                <Field label="Campanha" value={lead.campanha} />
                <Field label="URL de Origem" value={lead.origem_url} className="md:col-span-2" />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Datas */}
          <Separator />
          <div className="flex flex-col sm:flex-row justify-between gap-2 text-xs text-muted-foreground">
            <span>Criado em: {formatDate(lead.created_at)}</span>
            <span>Atualizado em: {formatDate(lead.updated_at)}</span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          <Button onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            Editar Lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
