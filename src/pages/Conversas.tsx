import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MessageSquare, Send, Mic, Paperclip, Camera, FileText, X, ChevronLeft, ChevronRight, Download, Maximize2, RotateCcw, CheckCheck, StickyNote, CalendarPlus, Search, ChevronUp, ChevronDown, Pin, Tag as TagIcon, CheckSquare, Forward, UserCheck, Bot, RefreshCw, Sparkles, Trash2, Reply, MapPin, Plus } from "lucide-react";
import { renderWhatsAppMarkdown } from "@/lib/whatsappMarkdown";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import api from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AssignmentModal } from "@/components/whatsapp/Assignment/AssignmentModal";
import { AttendantBadge } from "@/components/whatsapp/Assignment/AttendantBadge";
import { ConversationFilters } from "@/components/whatsapp/Assignment/ConversationFilters";
import { AudioRecorder } from "@/components/whatsapp/AudioRecorder";
import { AudioPlayer } from "@/components/whatsapp/AudioPlayer";
import EmojiPicker, { EmojiClickData, Theme, EmojiStyle } from "emoji-picker-react";
import { useUnread } from "@/contexts/UnreadContext";
import { useSocket } from "@/contexts/SocketContext";
import { ContactInfoPanel } from "@/components/whatsapp/ContactInfoPanel";
import { AgendarFromConversaModal } from "@/components/whatsapp/AgendarFromConversaModal";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useHotkeys } from "react-hotkeys-hook";
import { AtendentesOnlinePanel } from "@/components/chat/AtendentesOnlinePanel";
import { useConversasStats } from "@/hooks/useConversasStats";
import { TagManager } from "@/components/tags/TagManager";
import { TagBadge } from "@/components/tags/TagBadge";
import { useTags, type Tag } from "@/hooks/useTags";
import { EncaminharDialog } from "@/components/chat/EncaminharDialog";
import { Checkbox } from "@/components/ui/checkbox";
const AIHandoffBadge = React.lazy(() =>
  import('@/components/ai/AIHandoffBadge').then(m => ({ default: m.AIHandoffBadge }))
);
import { useAIStatus } from "@/hooks/useAIStatus";
import { NovaConversaModal } from "@/components/conversas/NovaConversaModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Componente de Avatar com foto do contato ou iniciais coloridas
const ContactAvatar = ({
  nome,
  avatarUrl,
  size = 'md',
  className = '',
}: {
  nome: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const safeNome = nome || 'Usuário';
  const iniciais = safeNome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join('');

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-teal-500',
  ];
  const hash = safeNome.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const bgColor = colors[Math.abs(hash) % colors.length];

  const [imgError, setImgError] = React.useState(false);
  const showImage = !!avatarUrl && !imgError;

  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${className}`}
    >
      {showImage ? (
        <img
          src={avatarUrl!}
          alt={safeNome}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className={`${bgColor} w-full h-full flex items-center justify-center text-white font-semibold`}>
          {iniciais || '?'}
        </div>
      )}
    </div>
  );
};

// Hook para tocar som de notificação ao receber mensagens
const useNotificationSound = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/sounds/notification.mp3');
    audioRef.current.volume = 0.5;
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.log('Autoplay bloqueado pelo navegador:', err);
      });
    }
  }, []);
};

const whatsappStyles = {
  headerBg: 'bg-[#075E54]',
  sentBubble: 'bg-[#DCF8C6] text-[#303030]',
  receivedBubble: 'bg-white text-[#303030] border border-gray-200',
  chatBg: 'bg-[#ECE5DD]',
  actionGreen: 'text-[#25D366]',
  textSecondary: 'text-[#667781]',
};

const chatBgPattern = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d9d9d9' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

// Returns the most relevant session id for a lead, falling back to the
// last message's session when there is no active session.
const getSessionId = (lead: any): string | null => {
  return lead?.sessao_ativa?.id
    || lead?.sessao_recente?.id
    || lead?.ultima_mensagem?.sessao_id
    || lead?.ultima_sessao_id
    || lead?.sessoes?.[0]?.id
    || null;
};

interface Atendente {
  id: string;
  nome: string;
  email?: string;
}

interface JanelaInfo {
  ativa: boolean;
  expira_em: string | null;
  minutos_restantes: number;
  horas_restantes: number;
}

interface Lead {
  id: string;
  nome: string;
  telefone: string;
  whatsapp_id: string;
  status: string;
  canal_origem: string;
  avatar_url?: string | null;
  sessao_ativa: {
    id: string;
    status_sessao: string;
    ultima_interacao: string;
    total_mensagens: number;
    atendente?: Atendente | null;
    fixada?: boolean;
  } | null;
  sessao_recente: {
    id: string;
    status_sessao: string;
    ultima_interacao: string;
    total_mensagens: number;
    fixada?: boolean;
  } | null;
  ultima_sessao_id?: string | null;
  sessoes?: Array<{ id: string }> | null;
  ultima_mensagem: {
    mensagem: string;
    data_envio: string;
    tipo_mensagem: string;
  } | null;
  total_mensagens: number;
  ultima_interacao: string;
  tags?: Tag[];
}

interface Mensagem {
  id: string;
  sessao_id: string;
  remetente: 'cliente' | 'atendente' | 'bot';
  tipo_mensagem: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location';
  mensagem: string;
  message_id?: string;
  data_envio: string;
  status_entrega: string;
  midia_url?: string;
  midia_tipo?: string;
  duracao_audio_segundos?: number;
  is_from_me?: boolean;
  is_nota_interna?: boolean;
  nota_autor_nome?: string;
  quoted_message_id?: string;
  quoted_content?: string;
  quoted_type?: string;
  quoted_remetente?: string;
  metadata?: { lat?: number; lng?: number; name?: string; address?: string } | null;
  reaction_emoji?: string | null;
}

interface RespostaRapida {
  id: string;
  titulo: string;
  atalho: string;
  conteudo: string;
}

interface JanelaBadgeProps {
  janela: JanelaInfo | null;
  loadingJanela: boolean;
}

const JanelaBadge = ({ janela, loadingJanela }: JanelaBadgeProps) => {
  if (loadingJanela) return null;
  if (!janela) return null;

  if (!janela.ativa) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        🔒 Janela expirada — use templates
      </div>
    );
  }

  const minutos = janela.minutos_restantes;
  const horas = janela.horas_restantes;
  const critico = minutos <= 60;
  const atencao = horas < 6;
  const texto = horas >= 1
    ? `⏰ Expira em ${horas}h ${minutos % 60}min`
    : `⚠️ Expira em ${minutos}min`;

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border transition-all ${
      critico
        ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
        : atencao
          ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
          : 'bg-green-50 text-green-700 border-green-200'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        critico ? 'bg-red-500' : atencao ? 'bg-yellow-500' : 'bg-green-500'
      }`} />
      {texto}
    </div>
  );
};

export default function Conversas() {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const { setTotalUnread } = useUnread();
  const { socket, lastNovaConversa, lastConversaAtualizada, lastMensagemReagida } = useSocket();
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const { totalNaoLidas: statsNaoLidas } = useConversasStats();

  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth < 768
  );
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMensagens, setLoadingMensagens] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Soft delete de conversas
  const [conversaParaExcluir, setConversaParaExcluir] = useState<{
    sessaoId: string;
    nomeLead: string;
  } | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const [novaMsg, setNovaMsg] = useState("");
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [contactInfoOpen, setContactInfoOpen] = useState(false);
  const [agendarOpen, setAgendarOpen] = useState(false);
  // Busca dentro da conversa
  const [buscaMensagem, setBuscaMensagem] = useState('');
  const [buscaAtiva, setBuscaAtiva] = useState(false);
  const [resultadosBusca, setResultadosBusca] = useState<number[]>([]);
  const [resultadoAtual, setResultadoAtual] = useState(0);
  const filtroInicial = user?.role === 'atendente' ? 'minhas' : 'todas';
  const [conversationFilter, setConversationFilter] = useState<'todas' | 'minhas' | 'fila' | 'resolvidas'>(filtroInicial);
  const [modalFecharOpen, setModalFecharOpen] = useState(false);
  const [motivoFechamento, setMotivoFechamento] = useState('');
  const [fechandoConversa, setFechandoConversa] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [menuAnexoAberto, setMenuAnexoAberto] = useState(false);
  const [usuarioDigitando, setUsuarioDigitando] = useState(false);
  const timeoutDigitando = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [contatoDigitando, setContatoDigitando] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const [emojiPickerAberto, setEmojiPickerAberto] = useState(false);
  const [lightboxAberto, setLightboxAberto] = useState(false);
  const [todasImagens, setTodasImagens] = useState<string[]>([]);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [zoomLightbox, setZoomLightbox] = useState(1);
  const [janela, setJanela] = useState<JanelaInfo | null>(null);
  const [loadingJanela, setLoadingJanela] = useState(false);
  const [modoNota, setModoNota] = useState(false);
  const [enviandoNota, setEnviandoNota] = useState(false);
  const [respondendoMensagem, setRespondendoMensagem] = useState<Mensagem | null>(null);

  // Respostas rápidas
  const [respostasRapidas, setRespostasRapidas] = useState<RespostaRapida[]>([]);
  const [showRespostas, setShowRespostas] = useState(false);
  const [respostasFiltradas, setRespostasFiltradas] = useState<RespostaRapida[]>([]);
  const [respostaSelecionada, setRespostaSelecionada] = useState(0);

  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadando, setUploadando] = useState(false);
  const [progressoUpload, setProgressoUpload] = useState(0);

  // Tags
  const [tagManagerOpen, setTagManagerOpen] = useState(false);
  const [conversaIdParaTags, setConversaIdParaTags] = useState<string | null>(null);
  const [filtroTagId, setFiltroTagId] = useState<string>('todas');
  const [buscaLead, setBuscaLead] = useState<string>('');
  const { tags: todasTags } = useTags();

  // Encaminhamento de mensagens
  const [modoSelecao, setModoSelecao] = useState(false);
  const [mensagensSelecionadas, setMensagensSelecionadas] = useState<string[]>([]);
  // chave: message_id da mensagem que recebeu a reação, valor: emoji
  const [reacoesMap, setReacoesMap] = useState<Record<string, string>>({});
  const [reacaoVersion, setReacaoVersion] = useState(0);
  const [reacaoPickerMsgId, setReacaoPickerMsgId] = useState<string | null>(null);
  const [encaminharDialogOpen, setEncaminharDialogOpen] = useState(false);

  // Sugestões IA
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [iaDigitando, setIaDigitando] = useState(false);
  const [feedbacksDados, setFeedbacksDados] = useState<Record<string, 'positive' | 'negative'>>({});


  // Status IA / Responsável da conversa
  const { isAIActive } = useAIStatus({
    sessaoId: selectedLead?.sessao_ativa?.id || selectedLead?.sessao_recente?.id || '',
    enabled: !!(selectedLead?.sessao_ativa?.id || selectedLead?.sessao_recente?.id),
  });

  // Usuário logado (para pré-selecionar no modal de "Assumir conversa")
  const { user } = useAuth();

  // Modal Nova Conversa
  const [novaConversaModalAberto, setNovaConversaModalAberto] = useState(false);

  const playNotification = useNotificationSound();

  // Refs to avoid re-running effects on selectedLead changes
  const selectedLeadRef = useRef<Lead | null>(null);
  const processedEvents = useRef<Set<number>>(new Set());

  useEffect(() => {
    selectedLeadRef.current = selectedLead;
    // Remarcar como lidas ao mudar de conversa ou retornar à aba
    if (selectedLead) {
      const sessaoId = selectedLead.sessao_ativa?.id || selectedLead.sessao_recente?.id;
      if (sessaoId) {
        api.patch(`/conversas/${sessaoId}/marcar-lidas`).catch(() => {});
      }
    }
  }, [selectedLead]);

  // Carrega respostas rápidas ao montar
  useEffect(() => {
    api.get('/respostas-rapidas')
      .then(r => setRespostasRapidas(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});
  }, []);

  // Fecha menu de respostas ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest('[data-respostas-menu]') &&
        !target.closest('[data-chat-input]')
      ) {
        setShowRespostas(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fecha painel de sugestões IA ao pressionar Esc
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAISuggestions(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const aplicarResposta = (r: RespostaRapida) => {
    setNovaMsg(r.conteudo);
    setShowRespostas(false);
    setRespostaSelecionada(0);
    setTimeout(() => {
      const el = textInputRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(r.conteudo.length, r.conteudo.length);
      }
    }, 0);
  };

  const fetchAISuggestions = async () => {
    const sessaoId = selectedLead?.sessao_ativa?.id || selectedLead?.sessao_recente?.id;
    if (!sessaoId) return;
    setLoadingSuggestions(true);
    setShowAISuggestions(true);
    try {
      const res = await api.post('/ai/suggest-replies', {
        conversationId: sessaoId,
        count: 3,
      });
      setAiSuggestions(res.data.suggestions || []);
    } catch (err) {
      setAiSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const aplicarSugestaoIA = (texto: string) => {
    setNovaMsg(texto);
    setShowAISuggestions(false);
    setTimeout(() => textInputRef.current?.focus(), 50);
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setNovaMsg((prev) => prev + emojiData.emoji);
  };

  const isImagemUrl = (url?: string) => {
    if (!url) return false;
    return /\.(jpg|jpeg|png|gif|webp|bmp)(\?.*)?$/i.test(url);
  };

  const abrirLightbox = (urlImagem: string) => {
    const imagens = mensagens
      .filter((m) => (m.tipo_mensagem === 'image' || isImagemUrl(m.midia_url)) && m.midia_url)
      .map((m) => m.midia_url as string);
    const indice = imagens.indexOf(urlImagem);
    setTodasImagens(imagens.length ? imagens : [urlImagem]);
    setIndiceAtual(indice >= 0 ? indice : 0);
    setZoomLightbox(1);
    setLightboxAberto(true);
  };

  const fecharLightbox = useCallback(() => {
    setLightboxAberto(false);
    setTodasImagens([]);
    setIndiceAtual(0);
    setZoomLightbox(1);
  }, []);

  const proximaImagem = useCallback(() => {
    setZoomLightbox(1);
    setIndiceAtual((i) => (i + 1) % Math.max(todasImagens.length, 1));
  }, [todasImagens.length]);

  const imagemAnterior = useCallback(() => {
    setZoomLightbox(1);
    setIndiceAtual((i) => (i - 1 + todasImagens.length) % Math.max(todasImagens.length, 1));
  }, [todasImagens.length]);

  const downloadImagem = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `imagem-${Date.now()}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (!lightboxAberto) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fecharLightbox();
      else if (e.key === 'ArrowRight') proximaImagem();
      else if (e.key === 'ArrowLeft') imagemAnterior();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [lightboxAberto, fecharLightbox, proximaImagem, imagemAnterior]);

  useEffect(() => {
    if (!emojiPickerAberto) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEmojiPickerAberto(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [emojiPickerAberto]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Scroll suave quando o tamanho da lista muda (nova mensagem)
  useEffect(() => {
    scrollToBottom("smooth");
  }, [mensagens.length]);

  // Scroll imediato ao abrir uma conversa
  useEffect(() => {
    if (!selectedLead?.id) return;
    const t = setTimeout(() => scrollToBottom("auto"), 50);
    return () => clearTimeout(t);
  }, [selectedLead?.id]);

  // Atalhos de teclado globais da página
  useHotkeys(
    "ctrl+f, meta+f",
    (e) => {
      if (!selectedLead) return;
      e.preventDefault();
      setBuscaAtiva(true);
    },
    { enableOnFormTags: true },
    [selectedLead]
  );
  useHotkeys(
    "escape",
    () => {
      if (buscaAtiva) {
        setBuscaAtiva(false);
        return;
      }
      if (emojiPickerAberto || showRespostas) return;
      setSelectedLead(null);
    },
    { enableOnFormTags: false },
    [buscaAtiva, emojiPickerAberto, showRespostas]
  );
  useHotkeys(
    "ctrl+enter, meta+enter",
    (e) => {
      if (!selectedLead || !novaMsg.trim() || enviando) return;
      e.preventDefault();
      handleEnviarMensagem(e as any);
    },
    { enableOnFormTags: true },
    [selectedLead, novaMsg, enviando]
  );

  // Copiar texto da mensagem (menu de contexto)
  const copiarMensagem = useCallback(
    (texto?: string) => {
      if (!texto) return;
      navigator.clipboard
        .writeText(texto)
        .then(() => sonnerToast.success("Mensagem copiada"))
        .catch(() => sonnerToast.error("Não foi possível copiar"));
    },
    []
  );

  // ============================================================
  // FIXAR CONVERSA - reorder helper + memos (MUST be before effects)
  // ============================================================
  const reordenarFixadas = (lista: Lead[]) => [
    ...lista.filter(l => l.sessao_ativa?.fixada),
    ...lista.filter(l => !l.sessao_ativa?.fixada),
  ];

  const leadsOrdenados = useMemo(() => reordenarFixadas(leads), [leads]);
  const leadsFiltrados = useMemo(() => {
    if (filtroTagId === 'todas') return leadsOrdenados;
    return leadsOrdenados.filter(l => l.tags?.some(t => t.id === filtroTagId));
  }, [leadsOrdenados, filtroTagId]);

  const leadsExibidos = useMemo(() => {
    if (!buscaLead.trim()) return leadsFiltrados;
    const termo = buscaLead.trim().toLowerCase();
    return leadsFiltrados.filter(l => {
      const nome = (l.nome || '').toLowerCase();
      const telefone = (l.telefone || '').replace(/\D/g, '');
      const termoBusca = termo.replace(/\D/g, '');
      return (
        nome.includes(termo) ||
        (termoBusca.length >= 3 && telefone.includes(termoBusca))
      );
    });
  }, [leadsFiltrados, buscaLead]);

  const indexPrimeiraNaoFixada = useMemo(
    () => leadsFiltrados.findIndex(l => !l.sessao_ativa?.fixada),
    [leadsFiltrados]
  );
  const temFixadas = useMemo(
    () => leadsFiltrados.some(l => l.sessao_ativa?.fixada),
    [leadsFiltrados]
  );

  const conversaIdAtivo = useMemo(
    () => selectedLead?.sessao_ativa?.id || selectedLead?.sessao_recente?.id || null,
    [selectedLead?.sessao_ativa?.id, selectedLead?.sessao_recente?.id]
  );

  // ============================================================
  // EXCLUIR CONVERSA (soft delete)
  // ============================================================
  const handleExcluirConversa = useCallback((
    e: React.MouseEvent,
    sessaoId: string,
    nomeLead: string
  ) => {
    e.stopPropagation();
    setConversaParaExcluir({ sessaoId, nomeLead });
  }, []);

  const confirmarExclusao = async () => {
    if (!conversaParaExcluir) return;
    setExcluindo(true);

    try {
      await api.delete(`/conversas/sessoes/${conversaParaExcluir.sessaoId}`);

      setLeads(prev => prev.filter(lead =>
        lead.sessao_ativa?.id !== conversaParaExcluir.sessaoId &&
        lead.sessao_recente?.id !== conversaParaExcluir.sessaoId
      ));

      if (
        selectedLead?.sessao_ativa?.id === conversaParaExcluir.sessaoId ||
        selectedLead?.sessao_recente?.id === conversaParaExcluir.sessaoId
      ) {
        setSelectedLead(null);
      }

      setConversaParaExcluir(null);
      sonnerToast.success('Conversa excluída');

      // Recarregar lista para garantir dados atualizados
      setTimeout(() => {
        fetchLeads(true);
      }, 500);
    } catch (error: any) {
      console.error('Erro ao excluir conversa:', error);
      sonnerToast.error('Erro ao excluir conversa');
    } finally {
      setExcluindo(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationFilter]);

  // Sync totalUnread + browser title
  useEffect(() => {
    const total = Object.values(unreadCounts).reduce((sum, n) => sum + n, 0);
    setTotalUnread(total);
    document.title = total > 0
      ? `(${total}) Conversas — MaxiClínicas`
      : 'MaxiClínicas';
    return () => {
      document.title = 'MaxiClínicas';
    };
  }, [unreadCounts, statsNaoLidas, setTotalUnread]);

  // Nova conversa (via SocketContext global)
  useEffect(() => {
    if (!lastNovaConversa) return;
    if (processedEvents.current.has(lastNovaConversa.timestamp)) return;
    processedEvents.current.add(lastNovaConversa.timestamp);
    const { lead } = lastNovaConversa;
    setLeads((prev) => {
      const existe = prev.some((l) => l.id === lead.id);
      if (existe) {
        // Lead j� existe: atualiza dados (nova sess�o/mensagem) e move para o topo
        const atualizado = { ...prev.find((l) => l.id === lead.id)!, ...lead };
        return [atualizado, ...prev.filter((l) => l.id !== lead.id)];
      }
      // Lead novo: adiciona no topo
      return [lead, ...prev];
    });
    setUnreadCounts((prev) => ({
      ...prev,
      [lead.id]: (prev[lead.id] || 0) + 1,
    }));
  }, [lastNovaConversa]);

  // Conversa atualizada (via SocketContext global)
  useEffect(() => {
    if (!lastConversaAtualizada) return;
    if (processedEvents.current.has(lastConversaAtualizada.timestamp)) return;
    processedEvents.current.add(lastConversaAtualizada.timestamp);
    const data = lastConversaAtualizada;
    setLeads((prev) => {
      const updated = prev.map((lead) => {
        if (lead.id !== data.leadId) return lead;
        return {
          ...lead,
          ultima_mensagem: data.ultima_mensagem,
          ultima_interacao: data.ultima_interacao,
        };
      });
      const alvo = updated.find((l) => l.id === data.leadId);
      if (!alvo) return updated;
      return [alvo, ...updated.filter((l) => l.id !== data.leadId)];
    });
    if (data.leadId !== selectedLeadRef.current?.id) {
      setUnreadCounts((prev) => ({
        ...prev,
        [data.leadId]: (prev[data.leadId] || 0) + 1,
      }));
    }
  }, [lastConversaAtualizada]);

  // Reage à mensagem reagida (listener global no SocketContext)
  useEffect(() => {
    if (!lastMensagemReagida?.messageId || !lastMensagemReagida?.timestamp) return;
    setReacoesMap(prev => ({
      ...prev,
      [lastMensagemReagida.messageId]: lastMensagemReagida.emoji,
    }));
    setMensagens(prev => prev.map(m =>
      m.message_id === lastMensagemReagida.messageId
        ? { ...m, reaction_emoji: lastMensagemReagida.emoji }
        : m
    ));
    setReacaoVersion(v => v + 1);
  }, [lastMensagemReagida?.timestamp]);

  // Join/Leave conversation rooms
  useEffect(() => {
    if (!socket || !conversaIdAtivo) return;
    socket.emit('join_conversation', conversaIdAtivo);
    console.log('[Socket.io] Entrou na sala:', conversaIdAtivo);
    return () => {
      socket.emit('leave_conversation', conversaIdAtivo);
      console.log('[Socket.io] Saiu da sala:', conversaIdAtivo);
    };
  }, [socket, conversaIdAtivo]);

  // Listen to nova_mensagem event
  useEffect(() => {
    if (!socket) return;

    const handleNovaMensagem = (data: any) => {
      const current = selectedLeadRef.current;
      const conversaId = current?.sessao_ativa?.id || current?.sessao_recente?.id;
      console.log('[Socket.io] Nova mensagem recebida:', data);
      if (data.conversaId === conversaId) {
        setMensagens((prev) => {
          const existe = prev.some((m) =>
            m.id === data.mensagem.id ||
            (data.mensagem.message_id &&
              m.message_id &&
              m.message_id === data.mensagem.message_id)
          );
          if (existe) return prev;
          return [...prev, data.mensagem];
        });
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        // Tocar som apenas para mensagens recebidas (não enviadas por mim)
        if (data.mensagem?.is_from_me === false) {
          playNotification();

          // Atualiza janela 24h ao receber mensagem do cliente
          const sessaoId = selectedLeadRef.current?.sessao_ativa?.id
            || selectedLeadRef.current?.sessao_recente?.id;
          if (sessaoId) {
            api.get(`/conversas/sessoes/${sessaoId}/janela`)
              .then(r => setJanela(r.data))
              .catch(() => {});
            // Marcar como lidas automaticamente pois conversa está aberta
            api.patch(`/conversas/${sessaoId}/marcar-lidas`).catch(() => {});
          }
        }

        // Atualiza preview da última mensagem na sidebar
        setLeads(prev => prev.map(lead => {
          if ((lead.sessao_ativa?.id ?? lead.sessao_recente?.id) !== data.conversaId) return lead;
          return {
            ...lead,
            ultima_mensagem: {
              mensagem: data.mensagem.mensagem || '',
              data_envio: data.mensagem.data_envio,
              tipo_mensagem: data.mensagem.tipo_mensagem || 'text',
            },
            ultima_interacao: data.mensagem.data_envio,
            total_mensagens: (lead.total_mensagens || 0) + 1,
          };
        }));

        // Reordena a lista para o lead com nova mensagem aparecer primeiro
        setLeads(prev => {
          const atualizado = prev.find(l => (l.sessao_ativa?.id ?? l.sessao_recente?.id) === data.conversaId);
          if (!atualizado) return prev;
          return [
            atualizado,
            ...prev.filter(l => (l.sessao_ativa?.id ?? l.sessao_recente?.id) !== data.conversaId)
          ];
        });

        // Atualiza avatar do lead se vier no evento
        if (data.lead_id && data.avatar_url) {
          setLeads(prev => prev.map(lead =>
            lead.id === data.lead_id && !lead.avatar_url
              ? { ...lead, avatar_url: data.avatar_url }
              : lead
          ));
          // Atualiza selectedLead se for o mesmo
          setSelectedLead(prev =>
            prev?.id === data.lead_id && !prev.avatar_url
              ? { ...prev, avatar_url: data.avatar_url }
              : prev
          );
        }

        // Incrementa não lidas se não for a conversa ativa
        if (data.mensagem?.is_from_me === false &&
            data.conversaId !== (current?.sessao_ativa?.id ?? current?.sessao_recente?.id)) {
          setUnreadCounts(prev => ({
            ...prev,
            [current?.id || '']:
              (prev[current?.id || ''] || 0) + 1,
          }));
        }
      }
    };

    const handleNovaConversa = (_data: any) => {
      // Gerenciado pelo SocketContext global (lastNovaConversa)
      // fetchLeads(true) removido pois sobrescrevia o lead
      // adicionado otimisticamente pelo SocketContext
    };

    const handleConversaAtualizada = (data: any) => {
      setLeads(prev => {
        const existe = prev.some(l =>
          l.sessao_ativa?.id === data.sessaoId ||
          l.sessao_recente?.id === data.sessaoId
        );
        if (!existe) {
          fetchLeads(true);
        }
        return prev;
      });
    };

    socket.on('nova_mensagem', handleNovaMensagem);
    socket.on('nova_conversa', handleNovaConversa);
    socket.on('conversa_atualizada', handleConversaAtualizada);

    return () => {
      socket.off('nova_mensagem', handleNovaMensagem);
      socket.off('nova_conversa', handleNovaConversa);
      socket.off('conversa_atualizada', handleConversaAtualizada);
    };
  }, [socket, playNotification]);

  // Listen conversa_fixada
  useEffect(() => {
    if (!socket) return;
    const handler = (data: { sessaoId: string; leadId: string; fixada: boolean }) => {
      setLeads(prev => {
        const atualizado = prev.map(l =>
          l.id === data.leadId
            ? { ...l, sessao_ativa: l.sessao_ativa ? { ...l.sessao_ativa, fixada: data.fixada } : null }
            : l
        );
        return [
          ...atualizado.filter(l => l.sessao_ativa?.fixada),
          ...atualizado.filter(l => !l.sessao_ativa?.fixada),
        ];
      });
    };
    socket.on('conversa_fixada', handler);
    return () => { socket.off('conversa_fixada', handler); };
  }, [socket]);

  // Listen conversa_excluida (soft delete em tempo real)
  useEffect(() => {
    if (!socket) return;
    const handler = ({ sessaoId }: { sessaoId: string }) => {
      setLeads(prev => prev.filter(lead =>
        lead.sessao_ativa?.id !== sessaoId &&
        lead.sessao_recente?.id !== sessaoId
      ));
      if (
        selectedLeadRef.current?.sessao_ativa?.id === sessaoId ||
        selectedLeadRef.current?.sessao_recente?.id === sessaoId
      ) {
        setSelectedLead(null);
      }
    };
    socket.on('conversa_excluida', handler);
    return () => {
      socket.off('conversa_excluida', handler);
    };
  }, [socket]);

  // Listen lead_digitando
  useEffect(() => {
    if (!socket || !selectedLead?.sessao_ativa?.id) return;
    const handler = (data: { digitando: boolean }) => {
      setUsuarioDigitando(data.digitando);
    };
    socket.on('lead_digitando', handler);
    return () => {
      socket.off('lead_digitando', handler);
      setUsuarioDigitando(false);
    };
  }, [socket, selectedLead?.sessao_ativa?.id]);

  // Listen contato_digitando (Paciente → Atendente)
  useEffect(() => {
    if (!socket) return;
    let safetyTimeout: ReturnType<typeof setTimeout> | null = null;
    const handler = (data: { conversaId: string; typing: boolean }) => {
      if (data.conversaId !== selectedLeadRef.current?.sessao_ativa?.id) return;
      setContatoDigitando(data.typing);
      if (safetyTimeout) clearTimeout(safetyTimeout);
      if (data.typing) {
        safetyTimeout = setTimeout(() => setContatoDigitando(false), 5000);
      }
    };
    socket.on('contato_digitando', handler);
    return () => {
      socket.off('contato_digitando', handler);
      if (safetyTimeout) clearTimeout(safetyTimeout);
      setContatoDigitando(false);
    };
  }, [socket]);

  // Listen nova_nota_interna
  useEffect(() => {
    if (!socket) return;
    const handler = (data: any) => {
      if (data.conversaId !== selectedLeadRef.current?.sessao_ativa?.id) return;
      setMensagens((prev) => {
        const nota = { ...(data.nota || {}), is_nota_interna: true };
        if (nota.id && prev.some((m: any) => m.id === nota.id)) return prev;
        return [...prev, nota];
      });
    };
    socket.on('nova_nota_interna', handler);
    return () => {
      socket.off('nova_nota_interna', handler);
    };
  }, [socket]);

  // Listen ai_handoff
  useEffect(() => {
    if (!socket || !selectedLead?.sessao_ativa?.id) return;

    const handleAIHandoff = (data: {
      sessaoId: string;
      trigger: string;
      reason?: string;
    }) => {
      if (data.sessaoId !== selectedLead?.sessao_ativa?.id) return;

      sonnerToast('🤝 Handoff para humano', {
        description: data.reason || 'Conversa transferida para atendimento humano',
        duration: 5000,
        style: { background: '#1e40af', color: 'white', border: 'none' },
      });
    };

    socket.on('ai_handoff', handleAIHandoff);
    return () => { socket.off('ai_handoff', handleAIHandoff); };
  }, [socket, selectedLead?.sessao_ativa?.id]);

  // Listen ai_typing
  useEffect(() => {
    if (!socket || !selectedLead?.sessao_ativa?.id) return;

    const handleAITyping = (data: {
      sessaoId: string;
      typing: boolean;
    }) => {
      if (data.sessaoId !== selectedLead?.sessao_ativa?.id) return;
      setIaDigitando(data.typing);
    };

    socket.on('ai_typing', handleAITyping);
    return () => {
      socket.off('ai_typing', handleAITyping);
      setIaDigitando(false);
    };
  }, [socket, selectedLead?.sessao_ativa?.id]);

  // Fallback polling - leads (only if socket not connected)
  useEffect(() => {
    if (socket?.connected) return;
    const interval = setInterval(() => {
      fetchLeads(true);
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationFilter, socket?.connected]);

  // Fallback polling - mensagens (only if socket not connected)
  useEffect(() => {
    if (!selectedLead || socket?.connected) return;
    const interval = setInterval(() => {
      fetchMensagens(selectedLead.id, true);
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedLead, socket?.connected]);

  const fetchLeads = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }

      const endpoint = conversationFilter === 'minhas'
        ? '/conversas/minhas'
        : '/conversas/leads';

      const params: any = {
        t: Date.now(),
        ...(conversationFilter === 'resolvidas' ? { status: 'encerrada' } : {}),
        ...(conversationFilter === 'fila' ? { fila: true } : {}),
      };

      if (user?.role === 'atendente' && user?.profissional_id) {
        params.profissional_id = user.profissional_id;
      }
      params.role = user?.role;

      const response = await api.get(endpoint, {
        params,
      });

      const leadsArray = response.data || [];
      setLeads(leadsArray);

      // Inicializa contagem de n�o lidas do banco (restaura estado ap�s login)
      const countsFromDB: Record<string, number> = {};
      leadsArray.forEach((lead: any) => {
        if (lead.mensagens_nao_lidas > 0) {
          countsFromDB[lead.id] = lead.mensagens_nao_lidas;
        }
      });
      if (Object.keys(countsFromDB).length > 0) {
        setUnreadCounts(prev => ({ ...countsFromDB, ...prev }));
      }

      if (!silent && leadsArray.length > 0 && !selectedLead) {
        const primeiro = leadsArray[0];
        setSelectedLead(primeiro);
        fetchMensagens(primeiro.id);
      }
    } catch (err: any) {
      if (!silent) {
        setError(err.message);
        setLeads([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchMensagens = async (leadId: string, silent = false) => {
    try {
      if (!silent) setLoadingMensagens(true);

      const response = await api.get(`/conversas/leads/${leadId}/mensagens`, {
        params: { t: Date.now() }
      });

      const msgs = response.data || [];
      setMensagens(msgs);
      const mapaInicial: Record<string, string> = {};
      msgs.forEach((m: any) => {
        if (m.message_id && m.reaction_emoji) {
          mapaInicial[m.message_id] = m.reaction_emoji;
        }
      });
      setReacoesMap(mapaInicial);
    } catch (err: any) {
      if (!silent) setMensagens([]);
    } finally {
      if (!silent) setLoadingMensagens(false);
    }
  };

  const handleSelectLead = (lead: Lead) => {
    // Para indicador "digitando" da conversa anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      if (selectedLead?.sessao_ativa?.id) {
        api.post('/evolution/typing', {
          conversaId: selectedLead.sessao_ativa.id,
          typing: false,
        }).catch(() => {});
      }
    }
    setContatoDigitando(false);

    setJanela(null);
    setSelectedLead(lead);
    setMensagens([]);
    setRespondendoMensagem(null);
    fetchMensagens(lead.id);
    setUnreadCounts(prev => {
      const next = { ...prev, [lead.id]: 0 };
      const total = Object.values(next).reduce((sum, n) => sum + n, 0);
      setTotalUnread(total);
      return next;
    });

    // Persiste no banco: zera mensagens_nao_lidas e marca mensagens como lidas
    const sessaoId = lead.sessao_ativa?.id || lead.sessao_recente?.id;
    if (sessaoId) {
      api.patch(`/conversas/${sessaoId}/marcar-lidas`).catch(() => {});
    }

    // Busca info da janela 24h
    if (sessaoId) {
      setLoadingJanela(true);
      api.get(`/conversas/sessoes/${sessaoId}/janela`)
        .then(r => setJanela(r.data))
        .catch(() => setJanela(null))
        .finally(() => setLoadingJanela(false));
    } else {
      setJanela(null);
    }
  };

  const handleEnviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMsg.trim() || !selectedLead || enviando) return;

    if (modoNota) {
      handleEnviarNota();
      return;
    }

    // Garante parar indicador "digitando" no Evolution
    if (isTypingRef.current) {
      isTypingRef.current = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      api.post('/evolution/typing', {
        conversaId: selectedLead?.sessao_ativa?.id,
        typing: false,
      }).catch(() => {});
    }

    try {
      setEnviando(true);

      const textoEnvio = novaMsg;
      setNovaMsg("");

      const response = await api.post(
        `/conversas/leads/${selectedLead.id}/mensagens`,
        {
          texto: textoEnvio,
          ...(respondendoMensagem && {
            quotedMessageId: respondendoMensagem.message_id || null,
            quotedContent: respondendoMensagem.mensagem || null,
            quotedType: respondendoMensagem.tipo_mensagem || null,
          }),
        }
      );

      // Adiciona imediatamente ao estado local (fallback caso o socket não entregue)
      const msgRetornada: any = response?.data;
      if (msgRetornada?.id) {
        setMensagens(prev => {
          const existe = prev.some(m => m.id === msgRetornada.id);
          if (existe) return prev;
          return [...prev, {
            ...msgRetornada,
            is_from_me: true,
            remetente: 'atendente',
            tipo_mensagem: msgRetornada.tipo_mensagem || 'text',
            mensagem: textoEnvio,
            data_envio: msgRetornada.data_envio || new Date().toISOString(),
          }];
        });
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
      setRespondendoMensagem(null);

      // Se o backend criou uma nova sessão (lead sem sessao_ativa),
      // atualiza o estado para que join_conversation passe a funcionar
      const sessaoIdRetornado = msgRetornada?.sessao_id;
      if (sessaoIdRetornado && !selectedLead.sessao_ativa?.id) {
        const novaSessao = {
          id: sessaoIdRetornado,
          status_sessao: 'ativa' as const,
          ultima_interacao: new Date().toISOString(),
          total_mensagens: 1,
        };
        setSelectedLead(prev => prev ? { ...prev, sessao_ativa: novaSessao as any } : prev);
        setLeads(prev => prev.map(l =>
          l.id === selectedLead.id
            ? { ...l, sessao_ativa: novaSessao as any }
            : l
        ));
      }
    } catch (err: any) {
      setMensagens(prev => prev.filter(m => !m.id?.startsWith('temp-')));
      toast({
        title: "❌ Erro ao enviar",
        description: err.message || "Não foi possível enviar a mensagem",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setEnviando(false);
        // Aguarda o re-render (input deixa de estar disabled) antes de focar
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            textInputRef.current?.focus();
          });
        });
      }, 300);
    }
  };

  const handleEnviarNota = async () => {
    if (!novaMsg.trim()) return;
    if (!selectedLead?.sessao_ativa?.id) return;
    setEnviandoNota(true);
    try {
      const response = await api.post(
        `/conversas/sessoes/${selectedLead.sessao_ativa.id}/notas`,
        { conteudo: novaMsg.trim() }
      );
      const nota = {
        ...(response.data || {}),
        is_nota_interna: true,
      };
      setMensagens((prev) => [...prev, nota]);
      setNovaMsg('');
      setModoNota(false);
    } catch {
      toast({
        title: 'Erro ao salvar nota interna',
        variant: 'destructive',
      });
    } finally {
      setEnviandoNota(false);
    }
  };

  const handleMensagemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const texto = e.target.value;
    setNovaMsg(texto);

    // Detecta abertura do menu de respostas rápidas
    if (texto.startsWith('/')) {
      const busca = texto.slice(1).toLowerCase();
      const filtradas = respostasRapidas.filter(r =>
        busca === '' ||
        r.atalho.includes(busca) ||
        r.titulo.toLowerCase().includes(busca) ||
        r.conteudo.toLowerCase().includes(busca)
      );
      setRespostasFiltradas(filtradas);
      setShowRespostas(filtradas.length > 0);
      setRespostaSelecionada(0);
    } else if (showRespostas) {
      setShowRespostas(false);
    }

    if (socket && selectedLead?.sessao_ativa?.id && texto.length > 0) {
      socket.emit('usuario_digitando', {
        conversaId: selectedLead.sessao_ativa.id,
        digitando: true,
      });
      if (timeoutDigitando.current) clearTimeout(timeoutDigitando.current);
      timeoutDigitando.current = setTimeout(() => {
        socket.emit('usuario_digitando', {
          conversaId: selectedLead.sessao_ativa!.id,
          digitando: false,
        });
      }, 3000);
    }

    // Envia indicador "digitando" ao paciente via Evolution (Atendente → Paciente)
    const conversaIdEvo = selectedLead?.sessao_ativa?.id;
    if (conversaIdEvo) {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        api.post('/evolution/typing', {
          conversaId: conversaIdEvo,
          typing: true,
        }).catch(() => {});
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        api.post('/evolution/typing', {
          conversaId: conversaIdEvo,
          typing: false,
        }).catch(() => {});
      }, 3000);
    }
  };

  const validarArquivo = (
    file: File,
    tipo: 'foto' | 'documento'
  ): { valido: boolean; erro?: string } => {
    const limiteBytes = tipo === 'foto' ? 10 * 1024 * 1024 : 20 * 1024 * 1024;
    if (file.size > limiteBytes) {
      return { valido: false, erro: `Arquivo muito grande! Máximo ${tipo === 'foto' ? '10MB' : '20MB'}` };
    }
    const formatosPermitidos = tipo === 'foto'
      ? ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      : [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];
    if (!formatosPermitidos.includes(file.type)) {
      return {
        valido: false,
        erro: `Formato não permitido! Use ${tipo === 'foto' ? 'JPG, PNG, GIF ou WEBP' : 'PDF, DOC, DOCX, XLS ou XLSX'}`,
      };
    }
    return { valido: true };
  };

  const criarPreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleAnexarFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validacao = validarArquivo(file, 'foto');
    if (!validacao.valido) {
      sonnerToast.error(validacao.erro);
      e.target.value = '';
      return;
    }
    setArquivoSelecionado(file);
    criarPreview(file);
    setMenuAnexoAberto(false);
    e.target.value = '';
  };

  const handleAnexarDocumento = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validacao = validarArquivo(file, 'documento');
    if (!validacao.valido) {
      sonnerToast.error(validacao.erro);
      e.target.value = '';
      return;
    }
    setArquivoSelecionado(file);
    criarPreview(file);
    setMenuAnexoAberto(false);
    e.target.value = '';
  };

  const enviarArquivo = async () => {
    if (!arquivoSelecionado || !selectedLead) return;

    try {
      setUploadando(true);
      setProgressoUpload(0);

      const formData = new FormData();
      formData.append('arquivo', arquivoSelecionado);
      formData.append(
        'tipoArquivo',
        arquivoSelecionado.type.startsWith('image/') ? 'image' : 'document'
      );

      await api.post(
        `/conversas/leads/${selectedLead.id}/upload`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (evt) => {
            if (evt.total) {
              setProgressoUpload(Math.round((evt.loaded / evt.total) * 100));
            }
          },
        }
      );

      setArquivoSelecionado(null);
      setPreviewUrl(null);
      setProgressoUpload(0);
      
    } catch (error) {
      console.error('Erro ao enviar arquivo:', error);
      sonnerToast.error('Erro ao enviar arquivo');
    } finally {
      setUploadando(false);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleEnviarAudio = async (
    audioBlob: Blob,
    duracao: number
  ) => {
    if (!selectedLead?.sessao_ativa?.id) return;

    // URL temporária local para player imediato
    const localUrl = URL.createObjectURL(audioBlob);
    const tempId = `temp-audio-${Date.now()}`;

    // Adiciona mensagem temporária com player
    setMensagens(prev => [...prev, {
      id: tempId,
      sessao_id: selectedLead.sessao_ativa!.id,
      tipo_mensagem: 'audio',
      mensagem: '[Áudio]',
      midia_url: localUrl,
      midia_tipo: 'audio',
      duracao_audio_segundos: duracao,
      is_from_me: true,
      remetente: 'atendente',
      data_envio: new Date().toISOString(),
      status_entrega: 'enviando',
    }]);

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'smooth'
      });
    }, 100);

    try {
      const audioBase64 = await blobToBase64(audioBlob);
      const response = await api.post(
        '/evolution/send-audio',
        {
          conversaId: selectedLead.sessao_ativa!.id,
          audioBase64,
          duracao,
        }
      );

      const msgReal = response?.data;

      // Substitui mensagem temp pela real
      setMensagens(prev => {
        const filtered = prev.filter(
          m => m.id !== tempId
        );
        if (msgReal?.id) {
          return [...filtered, {
            ...msgReal,
            // Usa URL do Storage se disponível,
            // senão mantém URL local do blob
            midia_url: msgReal.midia_url || localUrl,
            is_from_me: true,
            tipo_mensagem: 'audio',
          }];
        }
        // Se não retornou id, mantém a temp
        return prev;
      });
    } catch (err: any) {
      // Remove mensagem temp em caso de erro
      setMensagens(prev =>
        prev.filter(m => m.id !== tempId)
      );
      URL.revokeObjectURL(localUrl);
      toast({
        title: 'Erro ao enviar áudio',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const formatPhone = (phone: string) => {
    if (!phone) return 'Sem telefone';
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length === 13) {
      return `+${numbers.slice(0, 2)} (${numbers.slice(2, 4)}) ${numbers.slice(4, 9)}-${numbers.slice(9)}`;
    }
    return phone;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    if (diffMinutes < 1) return 'Agora';
    if (diffMinutes < 60) return `${diffMinutes}min`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const handleAssignSuccess = () => {
    fetchLeads(true);
    if (selectedLead) {
      fetchMensagens(selectedLead.id, true);
    }
  };

  const handleFeedbackIA = async (
    mensagemId: string,
    rating: 'positive' | 'negative'
  ) => {
    if (!selectedLead?.sessao_ativa?.id) return;
    try {
      await api.post('/ai/feedback', {
        mensagemId,
        sessaoId: selectedLead.sessao_ativa.id,
        rating,
      });
      setFeedbacksDados(prev => ({ ...prev, [mensagemId]: rating }));
      sonnerToast(rating === 'positive' ? '👍 Feedback positivo!' : '👎 Feedback registrado', {
        duration: 2000,
      });
    } catch {
      sonnerToast.error('Erro ao registrar feedback');
    }
  };

  const handleEnviarReacao = async (mensagem: Mensagem, emoji: string) => {
    const sessaoId = selectedLead?.sessao_ativa?.id || selectedLead?.sessao_recente?.id;
    if (!mensagem.message_id || !sessaoId) return;
    try {
      await api.post('/evolution/send-reaction', {
        conversaId: sessaoId,
        messageId: mensagem.message_id,
        emoji,
      });
      setReacoesMap(prev => ({
        ...prev,
        [mensagem.message_id!]: emoji,
      }));
      setMensagens(prev => prev.map(m =>
        m.message_id === mensagem.message_id
          ? { ...m, reaction_emoji: emoji }
          : m
      ));
      setReacaoVersion(v => v + 1);
    } catch {
      sonnerToast.error('Erro ao enviar reação');
    }
  };

  // ============================================================
  // BUSCA NA CONVERSA (hooks devem ficar antes de returns condicionais)
  // ============================================================
  const scrollParaMensagem = (idx: number) => {
    const el = document.getElementById(`msg-${idx}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleBuscaChange = (termo: string) => {
    setBuscaMensagem(termo);
    if (!termo.trim()) {
      setResultadosBusca([]);
      setResultadoAtual(0);
      return;
    }
    const termoLower = termo.toLowerCase();
    const encontrados = mensagens
      .map((m: any, idx) => ({ m, idx }))
      .filter(({ m }: any) =>
        !m.is_nota_interna &&
        m.mensagem?.toLowerCase().includes(termoLower)
      )
      .map(({ idx }) => idx);
    setResultadosBusca(encontrados);
    setResultadoAtual(0);
    if (encontrados.length > 0) {
      scrollParaMensagem(encontrados[0]);
    }
  };

  // Recalcula resultados quando mensagens carregam com busca ativa
  useEffect(() => {
    if (buscaMensagem.trim() && mensagens.length > 0) {
      handleBuscaChange(buscaMensagem);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mensagens]);

  const irParaProximo = () => {
    if (resultadosBusca.length === 0) return;
    const next = (resultadoAtual + 1) % resultadosBusca.length;
    setResultadoAtual(next);
    scrollParaMensagem(resultadosBusca[next]);
  };

  const irParaAnterior = () => {
    if (resultadosBusca.length === 0) return;
    const prev = (resultadoAtual - 1 + resultadosBusca.length) % resultadosBusca.length;
    setResultadoAtual(prev);
    scrollParaMensagem(resultadosBusca[prev]);
  };

  const highlightTexto = (texto: string, termo: string): React.ReactNode => {
    if (!termo.trim() || !texto) return texto;
    const escaped = termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const partes = texto.split(regex);
    return partes.map((parte, i) =>
      regex.test(parte) ? (
        <mark key={i} className="bg-yellow-300 text-yellow-900 rounded px-0.5">
          {parte}
        </mark>
      ) : (
        <React.Fragment key={i}>{parte}</React.Fragment>
      )
    );
  };

  // Ctrl+F para ativar busca
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && selectedLead) {
        e.preventDefault();
        setBuscaAtiva(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [selectedLead]);

  // Limpa busca ao trocar de lead
  useEffect(() => {
    setBuscaAtiva(false);
    setBuscaMensagem('');
    setResultadosBusca([]);
    setResultadoAtual(0);
  }, [selectedLead?.id]);

  if (loading) {
    return (
      <DashboardLayout title="Conversas WhatsApp">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando conversas...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Conversas WhatsApp">
        <div className="p-8">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
            <h3 className="text-destructive font-bold mb-3">❌ Erro ao carregar</h3>
            <p className="text-destructive/80 mb-4">{error}</p>
            <Button onClick={() => fetchLeads()} variant="destructive">
              🔄 Tentar novamente
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const handleFecharConversa = async () => {
    if (!selectedLead?.sessao_ativa?.id) return;
    setFechandoConversa(true);
    try {
      await api.patch(
        `/conversas/sessoes/${selectedLead.sessao_ativa.id}/status`,
        {
          status: 'fechada',
          motivo_fechamento: motivoFechamento || undefined,
        }
      );
      sonnerToast.success('Conversa encerrada');
      setModalFecharOpen(false);
      setMotivoFechamento('');
      setLeads(prev => prev.map(l =>
        l.id === selectedLead.id
          ? {
              ...l,
              sessao_ativa: l.sessao_ativa
                ? { ...l.sessao_ativa, status_sessao: 'encerrada' }
                : null,
            }
          : l
      ));
      if (conversationFilter === 'todas' || (conversationFilter as string) === 'abertas') {
        setLeads(prev => prev.filter(l => l.id !== selectedLead.id));
        setSelectedLead(null);
      }
    } catch {
      sonnerToast.error('Erro ao encerrar conversa');
    } finally {
      setFechandoConversa(false);
    }
  };

  const handleReabrirConversa = async () => {
    if (!selectedLead?.sessao_ativa?.id) return;
    try {
      await api.patch(
        `/conversas/sessoes/${selectedLead.sessao_ativa.id}/status`,
        { status: 'ativa' }
      );
      sonnerToast.success('Conversa reaberta');
      setLeads(prev => prev.map(l =>
        l.id === selectedLead.id
          ? {
              ...l,
              sessao_ativa: l.sessao_ativa
                ? { ...l.sessao_ativa, status_sessao: 'ativa' }
                : null,
            }
          : l
      ));
    } catch {
      sonnerToast.error('Erro ao reabrir conversa');
    }
  };

  // ============================================================
  // FIXAR CONVERSA
  // ============================================================
  const handleToggleFixar = async (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation();
    const sessaoId = lead.sessao_ativa?.id;
    if (!sessaoId) return;
    try {
      const response = await api.patch(`/conversas/sessoes/${sessaoId}/fixar`);
      const fixada = response.data?.fixada;
      setLeads(prev => reordenarFixadas(prev.map(l =>
        l.id === lead.id
          ? { ...l, sessao_ativa: l.sessao_ativa ? { ...l.sessao_ativa, fixada } : null }
          : l
      )));
      sonnerToast.success(fixada ? 'Conversa fixada no topo' : 'Conversa desafixada');
    } catch {
      sonnerToast.error('Erro ao fixar conversa');
    }
  };

  return (
    <DashboardLayout title="Conversas WhatsApp">
      <div className="grid h-[calc(100vh-130px)] md:h-[calc(100vh-160px)] grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={`col-span-1 overflow-hidden ${isMobile && selectedLead ? 'hidden' : ''}`}>
          <div className="flex h-full flex-col">
            <div className="border-b p-4 space-y-3">
              <div className="flex items-center justify-between">
                 <h3 className="font-semibold">Conversas ({leadsExibidos.length})</h3>
                <div className="flex gap-2">
                  <Button onClick={() => setNovaConversaModalAberto(true)} variant="default" size="sm" className="gap-1">
                    <Plus className="w-4 h-4" />
                    Nova
                  </Button>
                  <Button onClick={() => fetchLeads()} variant="ghost" size="sm">🔄</Button>
                </div>
              </div>
              <ConversationFilters
                filter={conversationFilter}
                onFilterChange={(filter) => {
                  setConversationFilter(filter);
                  setBuscaLead('');
                }}
                hideTodas={user?.role === 'atendente'}
              />
              <Select value={filtroTagId} onValueChange={setFiltroTagId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Filtrar por tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as tags</SelectItem>
                  {todasTags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: tag.cor }}
                        />
                        {tag.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Campo de busca por nome ou telefone */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou telefone..."
                  value={buscaLead}
                  onChange={(e) => setBuscaLead(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
                {buscaLead && (
                  <button
                    onClick={() => setBuscaLead('')}
                    className="absolute right-2 top-2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Limpar busca"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <AtendentesOnlinePanel />
            <div className="flex-1 overflow-y-auto">
              {leadsExibidos.length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    icon={MessageSquare}
                    title="Nenhuma conversa ativa"
                    description={
                      conversationFilter === 'minhas'
                        ? 'Você ainda não tem conversas atribuídas. Use o filtro "Todas" para ver outras.'
                        : conversationFilter === 'resolvidas'
                          ? 'Nenhuma conversa resolvida no momento.'
                          : 'As conversas do WhatsApp aparecerão aqui. Aguarde uma mensagem ou inicie um atendimento.'
                    }
                  />
                </div>
              ) : (
                leadsExibidos.map((lead, index) => (
                  <React.Fragment key={lead.id}>
                  <div
                    className={`cursor-pointer border-b p-4 transition-colors hover:bg-muted/50 ${
                      selectedLead?.id === lead.id ? "bg-muted" : ""
                    }`}
                    onClick={() => handleSelectLead(lead)}
                  >
                    <div className="flex items-start gap-3">
                      <ContactAvatar
                        nome={lead.nome}
                        avatarUrl={lead.avatar_url}
                        size="md"
                      />
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`truncate ${(unreadCounts[lead.id] || 0) > 0 ? 'font-bold text-foreground' : 'font-medium'}`}>{lead.nome}</p>
                          <div className="flex items-center gap-1 shrink-0">
                            {(lead.sessao_ativa?.id || lead.sessao_recente?.id) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const sessaoId = lead.sessao_ativa?.id || lead.sessao_recente?.id;
                                  setConversaIdParaTags(sessaoId!);
                                  setTagManagerOpen(true);
                                }}
                                className="p-1 rounded text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                                title="Gerenciar tags"
                              >
                                <TagIcon className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              onClick={(e) => handleToggleFixar(lead, e)}
                              className={`p-1 rounded transition-colors ${
                                (lead.sessao_ativa?.fixada || lead.sessao_recente?.fixada)
                                  ? 'text-primary'
                                  : 'text-muted-foreground/40 hover:text-muted-foreground'
                              }`}
                              title={(lead.sessao_ativa?.fixada || lead.sessao_recente?.fixada) ? 'Desafixar conversa' : 'Fixar no topo'}
                            >
                              <Pin className={`h-3.5 w-3.5 ${(lead.sessao_ativa?.fixada || lead.sessao_recente?.fixada) ? 'fill-current' : ''}`} />
                            </button>
                            {(user?.role === 'admin' || user?.role === 'gestor') && (() => {
                              const sessaoIdParaExcluir = lead.sessao_ativa?.id || lead.sessao_recente?.id;
                              if (!sessaoIdParaExcluir) return null;
                              return (
                                <button
                                  onClick={(e) => handleExcluirConversa(
                                    e,
                                    sessaoIdParaExcluir,
                                    lead.nome
                                  )}
                                  className="p-1 rounded text-muted-foreground/40 hover:text-destructive transition-colors"
                                  title="Excluir conversa"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              );
                            })()}
                            <span className="text-xs text-muted-foreground">
                              {formatTime(lead.ultima_interacao)}
                            </span>
                          </div>
                        </div>
                        {lead.tags && lead.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1">
                            {lead.tags.map((tag) => (
                              <TagBadge key={tag.id} nome={tag.nome} cor={tag.cor} size="sm" />
                            ))}
                          </div>
                        )}
                        <p className="truncate text-sm text-muted-foreground">
                          {lead.ultima_mensagem?.mensagem || 'Sem mensagens'}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-muted-foreground">
                            💬 {lead.total_mensagens} mensagens
                          </p>
                          {(unreadCounts[lead.id] || 0) > 0 && (
                            <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center ml-2">
                              {unreadCounts[lead.id] > 99 ? '99+' : unreadCounts[lead.id]}
                            </span>
                          )}
                          {lead.sessao_ativa?.atendente && (
                            <span className="text-xs text-muted-foreground truncate ml-2">
                              👤 {lead.sessao_ativa.atendente.nome}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {temFixadas && indexPrimeiraNaoFixada > 0 && index === indexPrimeiraNaoFixada - 1 && (
                    <div className="px-3 py-1">
                      <div className="border-t border-dashed border-border/50" />
                    </div>
                  )}
                  </React.Fragment>
                ))
              )}
            </div>
          </div>
        </Card>

        <Card className={`col-span-1 md:col-span-2 overflow-hidden relative ${isMobile && !selectedLead ? 'hidden' : ''}`}>
          <div className="flex h-full flex-col">
            {selectedLead ? (
              <>
                <div className={`border-b p-2 md:p-4 ${whatsappStyles.headerBg} text-white`}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    {isMobile && (
                      <button
                        onClick={() => setSelectedLead(null)}
                        className="md:hidden flex items-center gap-1 text-white/90 hover:text-white transition-colors mr-1"
                        aria-label="Voltar para lista"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setContactInfoOpen(true)}
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer text-left"
                    >
                      <ContactAvatar
                        nome={selectedLead.nome}
                        avatarUrl={selectedLead.avatar_url}
                        size="sm"
                        className="md:w-10 md:h-10"
                      />
                      <div>
                        <h3 className="font-semibold">{selectedLead.nome}</h3>
                        <p className="text-xs text-white/80 hidden md:block">
                          {formatPhone(selectedLead.whatsapp_id || selectedLead.telefone)}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2 flex-wrap hidden md:flex">
                          <JanelaBadge janela={janela} loadingJanela={loadingJanela} />
                          {getSessionId(selectedLead) && (
                            <React.Suspense fallback={null}>
                              <AIHandoffBadge
                                sessaoId={getSessionId(selectedLead)!}
                                size="sm"
                              />
                            </React.Suspense>
                          )}
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center gap-1 md:gap-2 overflow-x-auto flex-wrap md:flex-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setModoSelecao((v) => {
                            const novo = !v;
                            if (!novo) setMensagensSelecionadas([]);
                            return novo;
                          });
                        }}
                        className="text-white/80 hover:text-white hover:bg-white/10 gap-1.5"
                        title="Selecionar mensagens"
                      >
                        <CheckSquare className="h-4 w-4" />
                        <span className="hidden sm:inline text-xs">
                          {modoSelecao ? 'Cancelar' : 'Selecionar'}
                        </span>
                      </Button>
                      {modoSelecao && mensagensSelecionadas.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEncaminharDialogOpen(true)}
                          className="text-white/90 hover:text-white hover:bg-white/10 gap-1.5 bg-white/10"
                          title="Encaminhar mensagens selecionadas"
                        >
                          <Forward className="h-4 w-4" />
                          <span className="hidden sm:inline text-xs">
                            Encaminhar ({mensagensSelecionadas.length})
                          </span>
                        </Button>
                      )}
                      {selectedLead?.sessao_ativa?.status_sessao === 'encerrada' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleReabrirConversa}
                          className="text-green-300 hover:text-green-200 hover:bg-white/10 gap-1.5"
                          title="Reabrir conversa"
                        >
                          <RotateCcw className="h-4 w-4" />
                          <span className="hidden sm:inline text-xs">Reabrir</span>
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setModalFecharOpen(true)}
                          className="text-white/80 hover:text-white hover:bg-white/10 gap-1.5"
                          title="Encerrar conversa"
                        >
                          <CheckCheck className="h-4 w-4" />
                          <span className="hidden sm:inline text-xs">Encerrar</span>
                        </Button>
                      )}
                      {(selectedLead?.sessao_ativa?.id || selectedLead?.ultima_sessao_id || selectedLead?.sessoes?.[0]?.id) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAssignModalOpen(true)}
                          className="text-white/80 hover:text-white hover:bg-white/10 gap-1.5"
                          title="Assumir / atribuir conversa"
                        >
                          <UserCheck className="h-4 w-4" />
                          <span className="hidden sm:inline text-xs">
                            Assumir
                          </span>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAgendarOpen(true)}
                        className="text-white/80 hover:text-white hover:bg-white/10 gap-1.5"
                        title="Agendar consulta"
                      >
                        <CalendarPlus className="h-4 w-4" />
                        <span className="hidden sm:inline text-xs">Agendar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/10"
                        onClick={() => {
                          setBuscaAtiva(v => {
                            if (v) handleBuscaChange('');
                            return !v;
                          });
                        }}
                        title="Buscar na conversa (Ctrl+F)"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                      <AttendantBadge
                        atendente={selectedLead.sessao_ativa?.atendente || undefined}
                        onTransfer={() => setAssignModalOpen(true)}
                      />
                      {!selectedLead.sessao_ativa?.atendente && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAssignModalOpen(true)}
                          className="bg-white text-[#075E54] border-white hover:bg-[#F0F2F5] hover:text-[#075E54]"
                        >
                          Atribuir
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {buscaAtiva && (
                  <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30 animate-slide-down">
                    <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Buscar na conversa..."
                      value={buscaMensagem}
                      onChange={(e) => handleBuscaChange(e.target.value)}
                       onKeyDown={(e) => {
                         if (e.key === 'Escape') {
                           setBuscaAtiva(false);
                           handleBuscaChange('');
                         }
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.shiftKey ? irParaAnterior() : irParaProximo();
                        }
                      }}
                      className="flex-1 bg-transparent text-sm outline-none"
                    />
                    {buscaMensagem && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {resultadosBusca.length > 0
                          ? `${resultadoAtual + 1} de ${resultadosBusca.length}`
                          : 'Nenhum resultado'}
                      </span>
                    )}
                    {resultadosBusca.length > 1 && (
                      <>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={irParaAnterior}>
                          <ChevronUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={irParaProximo}>
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => { setBuscaAtiva(false); handleBuscaChange(''); }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}

                <div
                  className="flex-1 overflow-y-auto p-4"
                  style={{ backgroundImage: chatBgPattern, backgroundColor: '#ECE5DD' }}
                >
                  {loadingMensagens ? (
                    <div className="space-y-3">
                      {[0, 1, 2, 3, 4, 5].map((i) => {
                        const own = i % 2 === 1;
                        return (
                          <div key={i} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[60%] rounded-lg p-3 ${own ? 'bg-[#DCF8C6]/60' : 'bg-white/70'} shadow-sm`}>
                              <Skeleton className="h-3 w-40 mb-2" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : mensagens.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center max-w-xs">
                        <MessageSquare className="h-10 w-10 text-[#667781]/60 mx-auto mb-2" />
                        <p className="text-sm font-medium text-[#3b4a54]">Nenhuma mensagem ainda</p>
                        <p className="text-xs text-[#667781] mt-1">
                          Envie a primeira mensagem para iniciar a conversa.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 pb-2">
                        {mensagens.map((mensagem: any, idx) => {
                          if (mensagem.tipo_mensagem === 'reaction') return null;
                          const isOwn = mensagem.is_from_me === true || mensagem.remetente === 'atendente' || mensagem.remetente === 'assistant';
                          const isAIMessage = mensagem.remetente === 'bot' || mensagem.sent_by === 'ai';
                          const isHumanMessage = isOwn && !isAIMessage;
                        const isAudio = mensagem.tipo_mensagem === 'audio';
                         if (mensagem.is_nota_interna) {
                           return (
                             <div id={`msg-${idx}`} key={mensagem.id ?? idx} className="flex justify-center my-2 animate-fade-in">
                               <div className="max-w-[85%] px-4 py-2.5 rounded-xl bg-yellow-50 border border-yellow-200 shadow-sm">
                                 <div className="flex items-center gap-2 mb-1">
                                   <StickyNote className="h-3 w-3 text-yellow-600" />
                                   <span className="text-xs font-medium text-yellow-700">Nota interna</span>
                                   {mensagem.nota_autor_nome && (
                                     <span className="text-xs text-yellow-600">• {mensagem.nota_autor_nome}</span>
                                   )}
                                 </div>
                                 <p className="text-sm text-yellow-900 whitespace-pre-wrap break-words">
                                   {mensagem.conteudo || mensagem.mensagem}
                                 </p>
                                 <p className="text-xs text-yellow-500 text-right mt-1">
                                   {formatTime(mensagem.data_envio || mensagem.created_at)}
                                 </p>
                               </div>
                             </div>
                           );
                         }
                        return (
                          <div
                             id={`msg-${idx}`}
                            key={`${mensagem.id ?? idx}-${reacoesMap[mensagem.message_id || ''] || ''}`}
                            className={`flex ${isOwn ? 'justify-end animate-slide-in-right' : 'justify-start animate-slide-in-left'}`}
                          >
                            {modoSelecao && mensagem.id && (
                              <div className="flex items-center mr-2">
                                <Checkbox
                                  checked={mensagensSelecionadas.includes(mensagem.id)}
                                  onCheckedChange={(checked) => {
                                    setMensagensSelecionadas((prev) =>
                                      checked
                                        ? [...prev, mensagem.id]
                                        : prev.filter((id) => id !== mensagem.id),
                                    );
                                  }}
                                />
                              </div>
                            )}
                            {!isOwn && (
                              <ContactAvatar
                                nome={selectedLead?.nome || 'Usuário'}
                                avatarUrl={selectedLead?.avatar_url}
                                size="sm"
                                className="mr-2 mt-1"
                              />
                            )}
                            <div
                              className={`max-w-[85%] sm:max-w-[70%] px-4 py-2 shadow-sm relative group ${
                                isOwn ? whatsappStyles.sentBubble : whatsappStyles.receivedBubble
                              }`}
                              style={{
                                borderRadius: isOwn ? '8px 8px 0px 8px' : '8px 8px 8px 0px',
                              }}
                              onContextMenu={(e) => {
                                const texto = mensagem.mensagem || mensagem.conteudo;
                                if (!texto) return;
                                e.preventDefault();
                                copiarMensagem(texto);
                              }}
                              title="Clique com o botão direito para copiar"
                            >
                              <button
                                type="button"
                                onClick={() => setRespondendoMensagem(mensagem)}
                                className={`absolute -top-7 ${isOwn ? 'right-0' : 'left-0'} opacity-0 group-hover:opacity-100 bg-white rounded-full shadow-md p-1.5 text-gray-400 hover:text-[#25D366] transition-all z-10`}
                                title="Responder"
                              >
                                <Reply className="w-3.5 h-3.5" />
                              </button>
                              {mensagem.message_id && (
                                <div className={`absolute -top-7 ${isOwn ? 'right-8' : 'left-8'} z-20`}>
                                  <button
                                    type="button"
                                    onClick={() => setReacaoPickerMsgId(
                                      reacaoPickerMsgId === mensagem.message_id ? null : mensagem.message_id
                                    )}
                                    className="opacity-0 group-hover:opacity-100 bg-white rounded-full shadow-md p-1.5 text-gray-400 hover:text-[#25D366] transition-all"
                                    title="Reagir"
                                  >
                                    <span className="text-sm">😊</span>
                                  </button>
                                  {reacaoPickerMsgId === mensagem.message_id && (
                                    <>
                                      <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setReacaoPickerMsgId(null)}
                                      />
                                      <div className={`absolute ${isOwn ? 'right-0' : 'left-0'} -top-12 z-20 bg-white rounded-full shadow-xl border border-gray-100 px-2 py-1.5 flex items-center gap-1`}>
                                        {['❤️', '👍', '😂', '😮', '😢', '🙏'].map(emoji => (
                                          <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => {
                                              handleEnviarReacao(mensagem, emoji);
                                              setReacaoPickerMsgId(null);
                                            }}
                                            className="text-xl hover:scale-125 transition-transform"
                                          >
                                            {emoji}
                                          </button>
                                        ))}
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                              <div
                                className={`absolute bottom-0 ${isOwn ? '-right-2' : '-left-2'}`}
                                style={{
                                  width: 0,
                                  height: 0,
                                  borderStyle: 'solid',
                                  borderWidth: isOwn ? '0 10px 10px 0' : '0 0 10px 10px',
                                  borderColor: isOwn
                                    ? 'transparent #DCF8C6 transparent transparent'
                                    : 'transparent transparent transparent #ffffff',
                                }}
                              />
                              {mensagem.quoted_content && (
                                <div className="border-l-4 border-[#25D366] bg-black/5 rounded px-2 py-1 mb-2 max-w-full">
                                  <span className="text-[11px] font-semibold text-[#25D366] block truncate">
                                    {mensagem.quoted_remetente === 'atendente' || mensagem.quoted_remetente === 'bot'
                                      ? 'Você'
                                      : selectedLead?.nome || 'Contato'}
                                  </span>
                                  <span className="text-[11px] text-gray-500 truncate block max-w-[220px]">
                                    {mensagem.quoted_type === 'image' ? '📷 Imagem'
                                     : mensagem.quoted_type === 'audio' ? '🎵 Áudio'
                                     : mensagem.quoted_type === 'video' ? '🎬 Vídeo'
                                     : mensagem.quoted_type === 'document' ? '📄 Documento'
                                     : mensagem.quoted_content}
                                  </span>
                                </div>
                              )}
                              {isAudio && mensagem.midia_url ? (
                                <AudioPlayer
                                  audioUrl={mensagem.midia_url}
                                  duration={mensagem.duracao_audio_segundos}
                                />
                              ) : (mensagem.tipo_mensagem === 'image' || isImagemUrl(mensagem.midia_url)) && mensagem.midia_url ? (
                                <div className="relative group cursor-pointer" onClick={() => abrirLightbox(mensagem.midia_url!)}>
                                  <img
                                    src={mensagem.midia_url}
                                    alt="Imagem"
                                    className="max-w-[300px] max-h-[300px] rounded-lg object-cover transition-opacity hover:opacity-90"
                                    loading="lazy"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors">
                                    <Maximize2 className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                   {mensagem.mensagem && (
                                     <p className="text-sm whitespace-pre-wrap break-words mt-2">
                                       {buscaAtiva && buscaMensagem
                                         ? highlightTexto(mensagem.mensagem || '', buscaMensagem)
                                         : renderWhatsAppMarkdown(mensagem.mensagem)}
                                     </p>
                                   )}
                                </div>
                              ) : mensagem.tipo_mensagem === 'document' && mensagem.midia_url ? (
                                <a
                                  href={mensagem.midia_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download
                                  className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors max-w-[300px]"
                                >
                                  <div className="w-10 h-10 bg-[#5F66CD] rounded-lg flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-6 h-6 text-white" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {mensagem.mensagem || 'Documento'}
                                    </p>
                                    <p className="text-xs text-gray-500">Clique para baixar</p>
                                  </div>
                                  <Download className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                </a>
                               ) : mensagem.tipo_mensagem === 'video' && mensagem.midia_url ? (
                                 <div>
                                   <video
                                     src={mensagem.midia_url}
                                     controls
                                     className="max-w-[300px] max-h-[250px] rounded-lg w-full"
                                     preload="metadata"
                                   />
                                   {mensagem.mensagem && mensagem.mensagem !== '[Vídeo]' && (
                                     <p className="text-sm whitespace-pre-wrap break-words mt-1">
                                       {mensagem.mensagem}
                                     </p>
                                   )}
                                 </div>
                                ) : mensagem.tipo_mensagem === 'location' && mensagem.metadata?.lat != null ? (
                                  <a
                                    href={`https://maps.google.com/?q=${mensagem.metadata.lat},${mensagem.metadata.lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-2 bg-white/80 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors max-w-[260px]"
                                  >
                                    <div className="w-9 h-9 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <MapPin className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {mensagem.metadata.name || 'Localização'}
                                      </p>
                                      <p className="text-xs text-gray-500 truncate">
                                        {mensagem.metadata.address ||
                                          `${mensagem.metadata.lat?.toFixed(4)}, ${mensagem.metadata.lng?.toFixed(4)}`}
                                      </p>
                                      <p className="text-xs text-blue-500 mt-0.5">Abrir no Maps →</p>
                                    </div>
                                  </a>
                                ) : (
                                  <p className="text-sm whitespace-pre-wrap break-words">
                                    {buscaAtiva && buscaMensagem
                                      ? highlightTexto(mensagem.mensagem || '', buscaMensagem)
                                      : renderWhatsAppMarkdown(mensagem.mensagem || '')}
                                  </p>
                                )}
                              <span className="text-xs text-[#667781] mt-1 flex items-center gap-1 justify-end">
                                {isAIMessage && (
                                  <span title="Mensagem enviada pela IA">🤖</span>
                                )}
                                {new Date(mensagem.data_envio).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit', minute: '2-digit'
                                })}
                                {isHumanMessage && (
                                  <span className={
                                    mensagem.status_entrega === 'lido' ? 'text-blue-500' : 'text-[#667781]'
                                  }>
                                    {mensagem.status_entrega === 'lido' ? '✓✓' :
                                     mensagem.status_entrega === 'entregue' ? '✓✓' :
                                     mensagem.status_entrega === 'enviado' ? '✓' : '🕐'}
                                  </span>
                                )}
                              </span>
                              {(() => {
                                const emoji = mensagem.reaction_emoji || (mensagem.message_id ? reacoesMap[mensagem.message_id] : null);
                                if (!emoji) return null;
                                return (
                                  <div className={`absolute -bottom-4 ${isOwn ? 'right-2' : 'left-2'}`}>
                                    <span className="text-base bg-white rounded-full shadow-sm border border-gray-100 px-1 py-0.5 leading-none">
                                      {emoji}
                                    </span>
                                  </div>
                                );
                              })()}
                              {isAIMessage && mensagem.id && (
                                <div className="flex items-center gap-1 mt-0.5 justify-end">
                                  {feedbacksDados[mensagem.id] ? (
                                    <span className="text-[10px]">
                                      {feedbacksDados[mensagem.id] === 'positive' ? '👍' : '👎'}
                                    </span>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => handleFeedbackIA(mensagem.id, 'positive')}
                                        className="text-[10px] opacity-0 group-hover:opacity-100 hover:scale-110 transition-all p-0.5 rounded"
                                        title="Boa resposta"
                                      >
                                        👍
                                      </button>
                                      <button
                                        onClick={() => handleFeedbackIA(mensagem.id, 'negative')}
                                        className="text-[10px] opacity-0 group-hover:opacity-100 hover:scale-110 transition-all p-0.5 rounded"
                                        title="Resposta ruim"
                                      >
                                        👎
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                <div className="border-t px-2 md:px-4 py-2 bg-[#F0F2F5] overflow-hidden">
                  {/* Indicador "digitando..." do contato (Paciente → Atendente) */}
                  {contatoDigitando && (
                    <div className="flex items-end gap-2 px-4 py-1">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs shrink-0">
                        {selectedLead?.nome?.charAt(0) || '?'}
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm border">
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Indicador "IA digitando..." */}
                  {iaDigitando && (
                    <div className="flex items-end gap-2 px-4 py-1">
                      <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-xs shrink-0">
                        🤖
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm border">
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Indicador "digitando..." */}
                  {usuarioDigitando && !showAudioRecorder && (
                    <div className="flex items-center gap-2 px-2 py-1 mb-1 animate-fade-in">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-[#25D366] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-[#25D366] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-[#25D366] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs text-[#667781] italic">
                        {selectedLead?.nome || 'Usuário'} está digitando...
                      </span>
                    </div>
                  )}
                  {showAudioRecorder ? (
                    <div className="flex items-center justify-center">
                      <AudioRecorder
                        onAudioReady={handleEnviarAudio}
                        onCancel={() => setShowAudioRecorder(false)}
                      />
                    </div>
                  ) : (
                    <>
                    {respondendoMensagem && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-[#F0F2F5] border-t border-[#E9EDEF]">
                        <div className="flex-1 border-l-4 border-[#25D366] bg-white rounded-lg px-3 py-1.5 min-w-0">
                          <p className="text-xs font-semibold text-[#25D366] truncate">
                            {respondendoMensagem.is_from_me
                              ? 'Você'
                              : selectedLead?.nome || 'Contato'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {respondendoMensagem.tipo_mensagem === 'image' ? '📷 Imagem'
                             : respondendoMensagem.tipo_mensagem === 'audio' ? '🎵 Áudio'
                             : respondendoMensagem.tipo_mensagem === 'video' ? '🎬 Vídeo'
                             : respondendoMensagem.tipo_mensagem === 'document' ? '📄 Documento'
                             : respondendoMensagem.mensagem}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setRespondendoMensagem(null)}
                          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                          title="Cancelar resposta"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <form onSubmit={handleEnviarMensagem} className="flex flex-col gap-1 relative min-w-0 overflow-hidden">
                      {/* Painel Sugestões IA */}
                      {showAISuggestions && (
                        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl border border-[#E9EDEF] shadow-xl overflow-hidden z-50">
                          <div className="flex items-center justify-between px-3 py-2 border-b bg-[#F0F2F5]">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-[#25D366]" />
                              <span className="text-sm font-medium text-[#3b4a54]">Sugestões IA</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={fetchAISuggestions}
                                className="p-1.5 rounded hover:bg-[#E9EDEF] text-[#667781] transition-colors"
                                title="Regenerar sugestões"
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowAISuggestions(false)}
                                className="p-1.5 rounded hover:bg-[#E9EDEF] text-[#667781] transition-colors"
                                title="Fechar"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {loadingSuggestions ? (
                            <div className="px-4 py-6 flex items-center justify-center gap-2 text-[#667781]">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm">Gerando sugestões...</span>
                            </div>
                          ) : aiSuggestions.length === 0 ? (
                            <div className="px-4 py-6 text-center text-sm text-[#667781]">
                              Nenhuma sugestão disponível
                            </div>
                          ) : (
                            <div className="divide-y divide-[#F0F2F5]">
                              {aiSuggestions.map((sugestao, idx) => (
                                <button
                                  type="button"
                                  key={idx}
                                  onClick={() => aplicarSugestaoIA(sugestao)}
                                  className="w-full text-left px-4 py-3 hover:bg-[#F0F2F5] transition-colors text-sm text-gray-800 flex items-start gap-2"
                                >
                                  <span className="shrink-0 w-5 h-5 rounded-full bg-[#25D366]/10 text-[#25D366] text-xs font-medium flex items-center justify-center">
                                    {idx + 1}
                                  </span>
                                  <span className="flex-1 leading-relaxed">{sugestao}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {/* Menu de respostas rápidas */}
                      {showRespostas && respostasFiltradas.length > 0 && (
                        <div
                          data-respostas-menu
                          className="absolute bottom-full left-0 right-0 mb-2 bg-background rounded-xl border shadow-xl overflow-hidden z-50 max-h-72 overflow-y-auto"
                        >
                          <div className="px-3 py-2 border-b bg-muted/50 sticky top-0">
                            <p className="text-xs text-muted-foreground">
                              ↑↓ navegar · Tab ou Enter para selecionar · Esc para fechar
                            </p>
                          </div>
                          {respostasFiltradas.map((r, idx) => (
                            <button
                              type="button"
                              key={r.id}
                              className={`w-full text-left px-4 py-3 transition-colors border-b border-border/30 last:border-0 ${
                                idx === respostaSelecionada ? 'bg-accent' : 'hover:bg-accent/50'
                              }`}
                              onClick={() => aplicarResposta(r)}
                              onMouseEnter={() => setRespostaSelecionada(idx)}
                            >
                              <div className="flex items-start gap-3">
                                <span className="shrink-0 font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground mt-0.5">
                                  /{r.atalho}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">{r.titulo}</p>
                                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                    {r.conteudo}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2 min-w-0">
                      {/* Input arredondado estilo WhatsApp */}
                      <div className={`flex-1 flex items-center gap-3 rounded-[24px] border px-4 py-2.5 transition-all shadow-sm ${
                        modoNota
                          ? 'bg-yellow-50 border-yellow-300'
                          : 'bg-white border-[#E9EDEF] hover:border-[#D1D7DB]'
                      }`}>
                        {/* Botão de anexo */}
                        <div className="relative flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => setMenuAnexoAberto((v) => !v)}
                            className="text-[#54656F] hover:text-[#25D366] transition-colors duration-200 flex items-center"
                            title="Anexar"
                          >
                            <Paperclip className="w-6 h-6" />
                          </button>
                          {menuAnexoAberto && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setMenuAnexoAberto(false)}
                              />
                              <div className="absolute bottom-10 left-0 z-20 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden min-w-[180px] animate-fade-in">
                                <button
                                  type="button"
                                  onClick={() => {
                                    document.getElementById('input-foto')?.click();
                                    setMenuAnexoAberto(false);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                                >
                                  <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                    <Camera className="w-5 h-5 text-purple-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-800">Foto</p>
                                    <p className="text-xs text-gray-500">JPG, PNG, GIF</p>
                                  </div>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    document.getElementById('input-documento')?.click();
                                    setMenuAnexoAberto(false);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                                >
                                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-800">Documento</p>
                                    <p className="text-xs text-gray-500">PDF, DOC, XLS</p>
                                  </div>
                                </button>
                              </div>
                            </>
                          )}
                          <input
                            id="input-foto"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAnexarFoto}
                          />
                          <input
                            id="input-documento"
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                            className="hidden"
                            onChange={handleAnexarDocumento}
                          />
                        </div>

                        {/* Botão emoji com picker */}
                        <div className="relative flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => setEmojiPickerAberto((v) => !v)}
                            className={`transition-colors duration-200 ${
                              emojiPickerAberto ? 'text-[#25D366]' : 'text-[#54656F] hover:text-[#25D366]'
                            }`}
                            title="Emoji"
                          >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9c.83 0 1.5-.67 1.5-1.5S7.83 8 7 8s-1.5.67-1.5 1.5S6.17 11 7 11zm5 0c.83 0 1.5-.67 1.5-1.5S12.83 8 12 8s-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm5 0c.83 0 1.5-.67 1.5-1.5S17.83 8 17 8s-1.5.67-1.5 1.5.67 1.5 1.5 1.5zM12 17.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                            </svg>
                          </button>
                          {emojiPickerAberto && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setEmojiPickerAberto(false)}
                              />
                              <div className="absolute bottom-10 left-0 z-20 shadow-2xl rounded-lg overflow-hidden animate-fade-in">
                                <EmojiPicker
                                  onEmojiClick={handleEmojiClick}
                                  theme={Theme.LIGHT}
                                  emojiStyle={EmojiStyle.NATIVE}
                                  searchPlaceholder="Buscar emoji..."
                                  width={350}
                                  height={400}
                                  lazyLoadEmojis
                                  previewConfig={{ showPreview: false }}
                                />
                              </div>
                            </>
                          )}
                        </div>

                        {/* Input de texto */}
                        <input
                          ref={textInputRef}
                          type="text"
                          data-chat-input
                          placeholder={modoNota ? '📝 Nota interna — visível apenas para a equipe...' : 'Digite uma mensagem'}
                          value={novaMsg}
                          onChange={handleMensagemChange}
                          onKeyDown={(e) => {
                            if (showRespostas) {
                              if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                setRespostaSelecionada(prev => Math.min(prev + 1, respostasFiltradas.length - 1));
                                return;
                              }
                              if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                setRespostaSelecionada(prev => Math.max(prev - 1, 0));
                                return;
                              }
                              if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
                                e.preventDefault();
                                if (respostasFiltradas[respostaSelecionada]) {
                                  aplicarResposta(respostasFiltradas[respostaSelecionada]);
                                }
                                return;
                              }
                              if (e.key === 'Escape') {
                                e.preventDefault();
                                setShowRespostas(false);
                                return;
                              }
                            }
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              if (novaMsg.trim()) {
                                handleEnviarMensagem(e as any);
                              }
                            }
                          }}
                          maxLength={1000}
                          disabled={enviando || enviandoNota}
                          autoComplete="off"
                          className={`flex-1 bg-transparent outline-none text-[15px] min-w-0 disabled:opacity-50 ${
                            modoNota
                              ? 'text-yellow-900 placeholder:text-yellow-600'
                              : 'text-gray-800 placeholder:text-[#8696A0]'
                          }`}
                        />
                        {/* Botão alternar nota interna */}
                        <button
                          type="button"
                          onClick={() => setModoNota((v) => !v)}
                          className={`flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-lg transition-all ${
                            modoNota
                              ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                              : 'text-[#54656F] hover:text-yellow-600'
                          }`}
                          title={modoNota ? 'Modo nota ativo — clique para desativar' : 'Adicionar nota interna'}
                        >
                          <StickyNote className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Botão Sugestões IA */}
                      {selectedLead?.sessao_ativa?.id && (
                        <button
                          type="button"
                          onClick={fetchAISuggestions}
                          className={`flex-shrink-0 h-8 w-8 md:h-10 md:w-10 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-105 ${
                            showAISuggestions
                              ? 'bg-[#25D366] text-white shadow-sm'
                              : 'bg-white text-[#54656F] hover:text-[#25D366] border border-[#E9EDEF]'
                          }`}
                          title="Sugestões IA"
                        >
                          <Sparkles className="h-5 w-5" />
                        </button>
                      )}

                      {/* Botão microfone circular com hover verde */}
                      <button
                        type="button"
                        onClick={() => setShowAudioRecorder(true)}
                        className="group w-9 h-9 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-[#F0F2F5] hover:bg-[#25D366] transition-all duration-200 hover:scale-105 shadow-sm flex-shrink-0"
                        title="Gravar áudio"
                      >
                        <Mic className="w-4 h-4 md:w-6 md:h-6 text-[#54656F] group-hover:text-white transition-colors duration-200" />
                      </button>

                      {/* Botão enviar - aparece quando há texto */}
                      {novaMsg.trim() && (
                        <button
                          type="submit"
                          disabled={enviando || enviandoNota}
                          className={`w-9 h-9 md:w-12 md:h-12 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-105 shadow-sm flex-shrink-0 disabled:opacity-50 animate-scale-in ${
                            modoNota
                              ? 'bg-yellow-500 hover:bg-yellow-600'
                              : 'bg-[#25D366] hover:bg-[#1DA851]'
                          }`}
                          title={modoNota ? 'Salvar nota interna' : 'Enviar mensagem'}
                        >
                          {enviando || enviandoNota ? (
                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                          ) : (
                            <Send className="w-5 h-5 text-white" />
                          )}
                        </button>
                      )}
                      </div>

                      {/* Contador de caracteres (espaço sempre reservado para evitar shift de layout) */}
                      <div className="flex items-center gap-2 px-3 text-[11px] mt-0.5 h-4">
                        {novaMsg.length > 0 && (
                          <>
                            <span
                              className={
                                novaMsg.length > 1000
                                  ? 'text-red-500 font-medium'
                                  : novaMsg.length > 500
                                  ? 'text-orange-500'
                                  : 'text-[#8696A0]'
                              }
                            >
                              {novaMsg.length} caracteres
                            </span>
                            {novaMsg.length > 500 && novaMsg.length <= 1000 && (
                              <span className="text-orange-500">• Mensagem longa</span>
                            )}
                            {novaMsg.length > 1000 && (
                              <span className="text-red-500">• Limite atingido</span>
                            )}
                          </>
                        )}
                      </div>
                    </form>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full p-8">
                <EmptyState
                  icon={MessageSquare}
                  title="Selecione uma conversa"
                  description="Escolha um contato na lista ao lado para visualizar o histórico e enviar mensagens. Dica: use Ctrl+F para buscar dentro da conversa."
                />
              </div>
            )}
          </div>
          {selectedLead && (
            <ContactInfoPanel
              open={contactInfoOpen}
              onClose={() => setContactInfoOpen(false)}
              lead={selectedLead}
            />
          )}
        </Card>
      </div>

      {selectedLead && (
        <AssignmentModal
          open={assignModalOpen}
          onOpenChange={setAssignModalOpen}
          conversationId={getSessionId(selectedLead) || ''}
          currentAtendente={selectedLead.sessao_ativa?.atendente || undefined}
          preSelectedId={user?.profissional_id ?? undefined}
          onSuccess={handleAssignSuccess}
        />
      )}

      <AgendarFromConversaModal
        open={agendarOpen}
        onOpenChange={setAgendarOpen}
        lead={selectedLead ? { id: selectedLead.id, nome: selectedLead.nome, telefone: selectedLead.telefone, whatsapp_id: selectedLead.whatsapp_id } : null}
      />

      <Dialog open={modalFecharOpen} onOpenChange={setModalFecharOpen}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>Encerrar conversa</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Deseja encerrar o atendimento com{' '}
            <strong>{selectedLead?.nome}</strong>? A conversa será movida para "Resolvidas".
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium">Motivo (opcional)</label>
            <textarea
              className="w-full text-sm border rounded-lg px-3 py-2 bg-background resize-none"
              rows={3}
              placeholder="Ex: Agendamento confirmado, dúvida resolvida..."
              value={motivoFechamento}
              onChange={(e) => setMotivoFechamento(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setModalFecharOpen(false);
                setMotivoFechamento('');
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleFecharConversa} disabled={fechandoConversa}>
              {fechandoConversa && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Encerrar atendimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox de imagem */}
      {lightboxAberto && todasImagens.length > 0 && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center animate-fade-in"
          onClick={fecharLightbox}
          onWheel={(e) => {
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            setZoomLightbox((z) => Math.min(5, Math.max(0.5, z + delta)));
          }}
        >
          {/* Toolbar */}
          <div
            className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/60 to-transparent text-white z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-sm font-medium">
              Imagem {indiceAtual + 1} de {todasImagens.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadImagem(todasImagens[indiceAtual])}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={fecharLightbox}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                title="Fechar (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navegação anterior */}
          {todasImagens.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); imagemAnterior(); }}
              className="absolute left-4 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              title="Anterior (←)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Imagem */}
          <img
            src={todasImagens[indiceAtual]}
            alt={`Imagem ${indiceAtual + 1}`}
            className="max-w-[90vw] max-h-[85vh] object-contain transition-transform duration-200 select-none"
            style={{ transform: `scale(${zoomLightbox})` }}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={() => setZoomLightbox((z) => (z === 1 ? 2 : 1))}
            draggable={false}
          />

          {/* Navegação próxima */}
          {todasImagens.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); proximaImagem(); }}
              className="absolute right-4 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              title="Próxima (→)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Caption */}
          <div className="absolute bottom-0 left-0 right-0 text-center py-4 text-white/70 text-xs bg-gradient-to-t from-black/60 to-transparent">
            Use ← → para navegar • Scroll para zoom • Duplo clique para zoom 2x • ESC para fechar
          </div>
        </div>
      )}

      {arquivoSelecionado && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Enviar Arquivo</h3>
              <button
                onClick={() => { setArquivoSelecionado(null); setPreviewUrl(null); }}
                disabled={uploadando}
                className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-auto max-h-[300px] object-contain rounded-lg border"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed">
                  <FileText className="w-16 h-16 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">{arquivoSelecionado.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(arquivoSelecionado.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}
            </div>
            <div className="mb-4 p-3 bg-gray-50 rounded space-y-1">
              <p className="text-sm text-gray-700"><span className="font-medium">Nome:</span> {arquivoSelecionado.name}</p>
              <p className="text-sm text-gray-700"><span className="font-medium">Tamanho:</span> {(arquivoSelecionado.size / 1024 / 1024).toFixed(2)} MB</p>
              <p className="text-sm text-gray-700"><span className="font-medium">Tipo:</span> {arquivoSelecionado.type}</p>
            </div>
            {uploadando && (
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#25D366] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressoUpload}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 text-center mt-1">{progressoUpload}% enviado...</p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setArquivoSelecionado(null); setPreviewUrl(null); }}
                disabled={uploadando}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={enviarArquivo}
                disabled={uploadando}
                className="flex-1 px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#20BD5F] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploadando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {conversaIdParaTags && (
        <TagManager
          open={tagManagerOpen}
          onOpenChange={(open) => {
            setTagManagerOpen(open);
            if (!open) setConversaIdParaTags(null);
          }}
          sessaoId={conversaIdParaTags}
        />
      )}
      <EncaminharDialog
        open={encaminharDialogOpen}
        onOpenChange={setEncaminharDialogOpen}
        mensagensSelecionadas={mensagens
          .filter((m: any) => m.id && mensagensSelecionadas.includes(m.id))
          .map((m: any) => ({
            id: m.id,
            mensagem: m.mensagem,
            tipo_mensagem: m.tipo_mensagem,
            midia_url: m.midia_url,
            data_envio: m.data_envio,
          }))}
        sessaoOrigemId={selectedLead?.sessao_ativa?.id || ''}
        contatos={leads
          .filter((l) => l.whatsapp_id || l.telefone)
          .map((l) => ({
            id: l.id,
            nome: l.nome,
            numero: l.whatsapp_id || l.telefone,
          }))}
        onSuccess={() => {
          setModoSelecao(false);
          setMensagensSelecionadas([]);
        }}
      />

      {/* Modal de confirmação — Excluir conversa */}
      {conversaParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-sm mx-4">
            <h3 className="text-base font-semibold mb-2">Excluir conversa</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Deseja excluir a conversa com{" "}
              <span className="font-medium text-foreground">
                {conversaParaExcluir.nomeLead}
              </span>
              ?{" "}
              A conversa ficará oculta. Os dados são mantidos no banco.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConversaParaExcluir(null)}
                disabled={excluindo}
                className="px-4 py-2 text-sm rounded-md border border-input bg-background hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarExclusao}
                disabled={excluindo}
                className="px-4 py-2 text-sm rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {excluindo ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Conversa */}
      <NovaConversaModal
        open={novaConversaModalAberto}
        onClose={() => setNovaConversaModalAberto(false)}
        onConversaIniciada={(sessaoId) => {
          fetchLeads(false);
          setTimeout(() => {
            const novoLead = leads[0];
            if (novoLead) {
              handleSelectLead(novoLead);
            }
          }, 500);
        }}
      />
    </DashboardLayout>
  );
}
