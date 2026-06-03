import { Eye, Pencil, Trash2, Phone, Mail, MessageCircle, Tag as TagIcon, Megaphone } from 'lucide-react';
import { FormattedDate } from '@/components/ui/FormattedDate';
import type { Lead } from '@/hooks/useLeadsData';

interface LeadCardProps {
  lead: Lead;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  onTag?: (id: string) => void;
}

const STATUS_CONFIG = {
  novo:        { label: 'Novo',        cor: '#3B82F6', bg: '#EFF6FF', text: '#1D4ED8' },
  qualificado: { label: 'Qualificado', cor: '#F59E0B', bg: '#FFFBEB', text: '#B45309' },
  convertido:  { label: 'Convertido',  cor: '#10B981', bg: '#ECFDF5', text: '#065F46' },
};

const CANAL_ICON: Record<string, string> = {
  whatsapp:   '💬',
  site:       '🌐',
  indicacao:  '🤝',
  instagram:  '📸',
  facebook:   '📘',
  telefone:   '📞',
};

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const s = cleaned.startsWith('55') ? cleaned.slice(2) : cleaned;
  if (s.length === 11) return `(${s.slice(0,2)}) ${s.slice(2,7)}-${s.slice(7)}`;
  if (s.length === 10) return `(${s.slice(0,2)}) ${s.slice(2,6)}-${s.slice(6)}`;
  return phone;
}

function getInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function LeadCard({ lead, onEdit, onDelete, onView, onTag }: LeadCardProps) {
  const config = STATUS_CONFIG[lead.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.novo;
  const canalIcon = CANAL_ICON[lead.canal_origem?.toLowerCase() || ''] || '📋';

  return (
    <div
      className="group relative bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden cursor-pointer"
      onClick={() => onView(lead.id)}
    >
      {/* Borda lateral colorida por status */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ backgroundColor: config.cor }}
      />

      <div className="pl-4 pr-3 pt-3 pb-3">
        {/* Header: avatar + nome + status */}
        <div className="flex items-start gap-3 mb-3">
          {/* Avatar com iniciais */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
            style={{ backgroundColor: config.bg, color: config.cor }}
          >
            {getInitials(lead.nome)}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
              {lead.nome}
            </h3>
            <span
              className="inline-flex items-center mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ backgroundColor: config.bg, color: config.text }}
            >
              {config.label}
            </span>
          </div>

          {/* Canal */}
          <span className="text-base flex-shrink-0" title={lead.canal_origem}>
            {canalIcon}
          </span>
        </div>

        {/* Contato */}
        <div className="space-y-1 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Phone className="h-3 w-3 flex-shrink-0" />
            {lead.telefone ? (
              <span>{formatPhone(lead.telefone)}</span>
            ) : lead.whatsapp_id && lead.whatsapp_id.length > 13 && !lead.whatsapp_id.startsWith('55') ? (
              <span className="flex items-center gap-1 text-gray-400 italic">
                🔒 Número privado
              </span>
            ) : (
              <span className="text-gray-300">—</span>
            )}
          </div>
          {lead.email && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Mail className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
          {lead.campanha && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Megaphone className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{lead.campanha}</span>
            </div>
          )}
        </div>

        {/* Footer: data + quick actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          <FormattedDate
            value={lead.created_at}
            format="short"
            className="text-[10px] text-gray-400"
          />

          {/* Quick actions — aparecem no hover */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <button
              onClick={e => { e.stopPropagation(); onView(lead.id); }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Ver detalhes"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onEdit(lead.id); }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Editar"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            {onTag && (
              <button
                onClick={e => { e.stopPropagation(); onTag(lead.id); }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                title="Gerenciar tags"
              >
                <TagIcon className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={e => { e.stopPropagation(); onDelete(lead.id); }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Excluir"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
