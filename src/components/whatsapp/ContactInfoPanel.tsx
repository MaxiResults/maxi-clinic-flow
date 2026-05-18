import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Phone, MessageCircle, Clock, User, CircleDot, Smartphone, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { LeadViewModal } from '@/components/leads/LeadViewModal';

interface ContactInfoPanelProps {
  open: boolean;
  onClose: () => void;
  lead: {
    id: string;
    nome: string;
    telefone: string;
    whatsapp_id: string;
    avatar_url?: string | null;
    status?: string;
    canal_origem?: string;
    total_mensagens?: number;
    ultima_interacao?: string;
    sessao_ativa?: {
      id: string;
      atendente?: { id: string; nome: string } | null;
    } | null;
  };
}

const formatPhone = (phone: string) => {
  if (!phone) return '-';
  const n = phone.replace(/\D/g, '');
  if (n.length === 13) {
    return `+${n.slice(0, 2)} (${n.slice(2, 4)}) ${n.slice(4, 9)}-${n.slice(9)}`;
  }
  return phone;
};

const formatDateBR = (iso?: string) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  if (sameDay) return `Hoje às ${hh}:${mm}`;
  if (isYesterday) return `Ontem às ${hh}:${mm}`;
  const dd = String(d.getDate()).padStart(2, '0');
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mo}/${d.getFullYear()} às ${hh}:${mm}`;
};

const getInitials = (nome: string) =>
  (nome || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join('');

const getAvatarColor = (nome: string) => {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
    'bg-indigo-500', 'bg-red-500', 'bg-yellow-500', 'bg-teal-500',
  ];
  const hash = (nome || '').split('').reduce(
    (acc, char) => char.charCodeAt(0) + ((acc << 5) - acc),
    0
  );
  return colors[Math.abs(hash) % colors.length];
};

const InfoRow = ({
  icon: Icon,
  label,
  value,
  italic,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  italic?: boolean;
}) => (
  <div className="flex items-start gap-3 px-6 py-4 border-b border-gray-100">
    <Icon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-sm text-gray-800 break-words ${italic ? 'italic text-gray-400' : ''}`}>
        {value}
      </p>
    </div>
  </div>
);

export const ContactInfoPanel: React.FC<ContactInfoPanelProps> = ({ open, onClose, lead }) => {
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(lead.avatar_url || null);
  const [imgError, setImgError] = useState(false);
  const [loadingAvatar, setLoadingAvatar] = useState(false);

  const [photoLightboxOpen, setPhotoLightboxOpen] = useState(false);
  const [photoLightboxUrl, setPhotoLightboxUrl] = useState<string | null>(null);
  const [loadingLightbox, setLoadingLightbox] = useState(false);
  const [leadModalOpen, setLeadModalOpen] = useState(false);

  useEffect(() => {
    setAvatarUrl(lead.avatar_url || null);
    setImgError(false);
  }, [lead.id, lead.avatar_url]);

  useEffect(() => {
    if (!open || !lead.id) return;

    const buscarFoto = async () => {
      try {
        setLoadingAvatar(true);
        const response = await api.get(
          `/evolution/profile-picture/${lead.whatsapp_id || 'placeholder'}`,
          { params: { leadId: lead.id } }
        );
        const novaUrl = (response.data as any)?.url;
        if (novaUrl && novaUrl !== avatarUrl) {
          setAvatarUrl(novaUrl);
          setImgError(false);
        }
      } catch (err) {
        console.log('[ContactInfoPanel] Foto não encontrada');
      } finally {
        setLoadingAvatar(false);
      }
    };

    buscarFoto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lead.id]);

  const statusFmt = lead.status
    ? lead.status.charAt(0).toUpperCase() + lead.status.slice(1).toLowerCase()
    : '-';

  const telefoneIgualWpp =
    (lead.telefone || '').replace(/\D/g, '') === (lead.whatsapp_id || '').replace(/\D/g, '');

  const handleAvatarClick = async () => {
    setPhotoLightboxOpen(true);
    setPhotoLightboxUrl(avatarUrl);

    try {
      setLoadingLightbox(true);
      const response = await api.get(
        `/evolution/profile-picture/${lead.whatsapp_id || 'placeholder'}`,
        { params: { leadId: lead.id } }
      );
      const novaUrl = response.data?.url;
      if (novaUrl) {
        setPhotoLightboxUrl(novaUrl);
        setAvatarUrl(novaUrl);
        setImgError(false);
      } else {
        setPhotoLightboxUrl(null);
      }
    } catch {
      setPhotoLightboxUrl(avatarUrl);
    } finally {
      setLoadingLightbox(false);
    }
  };

  const leadParaModal = {
    id: lead.id,
    nome: lead.nome,
    telefone: lead.telefone || '',
    email: undefined,
    cpf: undefined,
    canal_origem: lead.canal_origem || '—',
    status: lead.status || 'novo',
    interesse: undefined,
    observacoes: undefined,
    whatsapp_id: lead.whatsapp_id || null,
    whatsapp_nome: null,
    primeira_mensagem_em: null,
    avatar_url: avatarUrl || lead.avatar_url || null,
    created_at: '',
    updated_at: '',
  } as any;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="absolute inset-0 z-40 bg-black/20"
          onClick={onClose}
          aria-hidden
        />
      )}

      {/* Panel */}
      <aside
        className={`absolute top-0 right-0 h-full w-full md:w-[320px] bg-white shadow-xl z-50 flex flex-col transform transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="bg-[#075E54] text-white flex items-center gap-4 px-4 py-4">
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:opacity-80"
            aria-label="Fechar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-medium">Informações do contato</span>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Avatar section */}
          <div className="bg-[#F0F2F5] flex flex-col items-center py-6 px-4">
            <button
              onClick={handleAvatarClick}
              className="relative cursor-pointer group focus:outline-none"
              title="Ver foto do contato"
            >
              <div className="relative w-24 h-24">
                <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center shadow-md bg-gray-200">
                  {loadingAvatar && !avatarUrl ? (
                    <div className="w-full h-full animate-pulse bg-gray-300" />
                  ) : avatarUrl && !imgError ? (
                    <img
                      src={avatarUrl}
                      alt={lead.nome}
                      className="w-full h-full object-cover"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div
                      className={`${getAvatarColor(lead.nome)} w-full h-full flex items-center justify-center text-white text-3xl font-semibold`}
                    >
                      {getInitials(lead.nome)}
                    </div>
                  )}
                </div>
                {loadingAvatar && (
                  <div className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow">
                    <div className="w-3 h-3 border-2 border-gray-300 border-t-[#075E54] rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium transition-opacity">
                  Ver foto
                </span>
              </div>
            </button>
            <h3 className="text-xl font-semibold mt-4 text-center text-gray-900">
              {lead.nome}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {formatPhone(lead.whatsapp_id || lead.telefone)}
            </p>
          </div>

          {/* Details */}
          <div className="bg-white">
            <InfoRow
              icon={Smartphone}
              label="WhatsApp"
              value={formatPhone(lead.whatsapp_id)}
            />
            {!telefoneIgualWpp && lead.telefone && (
              <InfoRow icon={Phone} label="Telefone" value={formatPhone(lead.telefone)} />
            )}
            <InfoRow icon={CircleDot} label="Status no sistema" value={statusFmt} />
            <InfoRow
              icon={MessageCircle}
              label="Mensagens trocadas"
              value={`${lead.total_mensagens ?? 0} mensagens`}
            />
            <InfoRow
              icon={Clock}
              label="Última interação"
              value={formatDateBR(lead.ultima_interacao)}
            />
            <InfoRow
              icon={User}
              label="Responsável"
              value={lead.sessao_ativa?.atendente?.nome || 'Não atribuído'}
              italic={!lead.sessao_ativa?.atendente}
            />
          </div>

          {/* Footer button */}
          <div className="mx-6 mb-6 mt-2">
            <Button
              variant="outline"
              className="w-full border-[#075E54] text-[#075E54] hover:bg-[#075E54]/10 hover:text-[#075E54]"
              onClick={() => setLeadModalOpen(true)}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver perfil completo
            </Button>
          </div>
        </div>
      </aside>

      {/* Lightbox */}
      {photoLightboxOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center animate-fade-in"
          onClick={() => setPhotoLightboxOpen(false)}
        >
          {/* Botão fechar */}
          <button
            onClick={() => setPhotoLightboxOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Conteúdo */}
          <div
            className="flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {loadingLightbox ? (
              <div className="w-48 h-48 rounded-full bg-gray-700 animate-pulse flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            ) : photoLightboxUrl ? (
              <img
                src={photoLightboxUrl}
                alt={lead.nome}
                className="w-64 h-64 rounded-full object-cover shadow-2xl ring-4 ring-white/20"
                onError={() => setPhotoLightboxUrl(null)}
              />
            ) : (
              <div
                className={`w-64 h-64 rounded-full flex items-center justify-center text-white text-7xl font-bold shadow-2xl ring-4 ring-white/20 ${getAvatarColor(lead.nome)}`}
              >
                {getInitials(lead.nome)}
              </div>
            )}

            <div className="text-center">
              <p className="text-white text-xl font-semibold">{lead.nome}</p>
              <p className="text-white/60 text-sm mt-1">
                {lead.telefone || lead.whatsapp_id}
              </p>
              {!loadingLightbox && !photoLightboxUrl && (
                <p className="text-white/40 text-xs mt-2 italic">Foto não disponível</p>
              )}
            </div>

            {photoLightboxUrl && !loadingLightbox && (
              <a
                href={photoLightboxUrl}
                download={`foto-${lead.nome}.jpg`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-full transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-4 h-4" />
                Salvar foto
              </a>
            )}
          </div>

          <p className="absolute bottom-6 text-white/30 text-xs">Clique fora para fechar</p>
        </div>
      )}

      <LeadViewModal
        open={leadModalOpen}
        onClose={() => setLeadModalOpen(false)}
        lead={leadParaModal}
        onEdit={() => {
          setLeadModalOpen(false);
          onClose();
          navigate(`/leads?leadId=${lead.id}`);
        }}
      />
    </>
  );
};

export default ContactInfoPanel;
