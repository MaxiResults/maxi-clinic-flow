import React, { useState, useEffect, useRef, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MessageSquare, Send, Mic, Paperclip, Camera, FileText, X, ChevronLeft, ChevronRight, Download, Maximize2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import api from "@/lib/api";
import { AssignmentModal } from "@/components/whatsapp/Assignment/AssignmentModal";
import { AttendantBadge } from "@/components/whatsapp/Assignment/AttendantBadge";
import { ConversationFilters } from "@/components/whatsapp/Assignment/ConversationFilters";
import { AudioRecorder } from "@/components/whatsapp/AudioRecorder";
import { AudioPlayer } from "@/components/whatsapp/AudioPlayer";
import { io, Socket } from "socket.io-client";
import EmojiPicker, { EmojiClickData, Theme, EmojiStyle } from "emoji-picker-react";

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

interface Atendente {
  id: string;
  nome: string;
  email?: string;
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
  } | null;
  ultima_mensagem: {
    mensagem: string;
    data_envio: string;
    tipo_mensagem: string;
  } | null;
  total_mensagens: number;
  ultima_interacao: string;
}

interface Mensagem {
  id: string;
  sessao_id: string;
  remetente: 'cliente' | 'atendente' | 'bot';
  tipo_mensagem: 'text' | 'image' | 'audio' | 'video' | 'document';
  mensagem: string;
  message_id?: string;
  data_envio: string;
  status_entrega: string;
  midia_url?: string;
  midia_tipo?: string;
  duracao_audio_segundos?: number;
}

export default function Conversas() {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMensagens, setLoadingMensagens] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [novaMsg, setNovaMsg] = useState("");
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [conversationFilter, setConversationFilter] = useState<'todas' | 'minhas'>('todas');
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [menuAnexoAberto, setMenuAnexoAberto] = useState(false);
  const [usuarioDigitando, setUsuarioDigitando] = useState(false);
  const timeoutDigitando = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [emojiPickerAberto, setEmojiPickerAberto] = useState(false);
  const [lightboxAberto, setLightboxAberto] = useState(false);
  const [todasImagens, setTodasImagens] = useState<string[]>([]);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [zoomLightbox, setZoomLightbox] = useState(1);

  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadando, setUploadando] = useState(false);
  const [progressoUpload, setProgressoUpload] = useState(0);

  const playNotification = useNotificationSound();

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [mensagens]);

  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationFilter]);

  // Socket.io connection
  useEffect(() => {
    const socketConnection = io('https://api.maxiclinicas.com.br', {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socketConnection.on('connect', () => {
      console.log('[Socket.io] Conectado ao servidor:', socketConnection.id);
    });
    socketConnection.on('disconnect', () => {
      console.log('[Socket.io] Desconectado do servidor');
    });
    socketConnection.on('connect_error', (error) => {
      console.error('[Socket.io] Erro de conexão:', error);
    });

    setSocket(socketConnection);

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  // Join/Leave conversation rooms
  useEffect(() => {
    if (!socket || !selectedLead?.sessao_ativa?.id) return;
    const conversaId = selectedLead.sessao_ativa.id;

    socket.emit('join_conversation', conversaId);
    console.log('[Socket.io] Entrou na sala:', conversaId);

    return () => {
      socket.emit('leave_conversation', conversaId);
      console.log('[Socket.io] Saiu da sala:', conversaId);
    };
  }, [socket, selectedLead?.sessao_ativa?.id]);

  // Listen to nova_mensagem event
  useEffect(() => {
    if (!socket || !selectedLead?.sessao_ativa?.id) return;
    const conversaId = selectedLead.sessao_ativa.id;

    const handleNovaMensagem = (data: any) => {
      console.log('[Socket.io] Nova mensagem recebida:', data);
      if (data.conversaId === conversaId) {
        setMensagens((prev) => {
          const existe = prev.some((m) => m.id === data.mensagem.id);
          if (existe) return prev;
          return [...prev, data.mensagem];
        });
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        // Tocar som apenas para mensagens recebidas (não enviadas por mim)
        if (data.mensagem?.is_from_me === false) {
          playNotification();
        }
      }
    };

    socket.on('nova_mensagem', handleNovaMensagem);
    return () => {
      socket.off('nova_mensagem', handleNovaMensagem);
    };
  }, [socket, selectedLead?.sessao_ativa?.id, playNotification]);

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

      const response = await api.get(endpoint, {
        params: { t: Date.now() }
      });

      const leadsArray = response.data || [];
      setLeads(leadsArray);

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

      setMensagens(response.data || []);
    } catch (err: any) {
      if (!silent) setMensagens([]);
    } finally {
      if (!silent) setLoadingMensagens(false);
    }
  };

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    setMensagens([]);
    fetchMensagens(lead.id);
  };

  const handleEnviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMsg.trim() || !selectedLead || enviando) return;

    try {
      setEnviando(true);

      // Mensagem otimista removida - Socket.io entrega em tempo real
      const textoEnvio = novaMsg;
      setNovaMsg("");

      await api.post(`/conversas/leads/${selectedLead.id}/mensagens`, {
        texto: textoEnvio,
      });
    } catch (err: any) {
      setMensagens(prev => prev.filter(m => !m.id.startsWith('temp-')));
      toast({
        title: "❌ Erro ao enviar",
        description: err.message || "Não foi possível enviar a mensagem",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setEnviando(false), 300);
    }
  };

  const handleMensagemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const texto = e.target.value;
    setNovaMsg(texto);

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
      formData.append('leadId', String(selectedLead.id));
      formData.append('tipoArquivo', arquivoSelecionado.type.startsWith('image/') ? 'image' : 'document');

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${import.meta.env.VITE_API_URL}/conversas/upload`);
        const token = localStorage.getItem('token');
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            setProgressoUpload(Math.round((evt.loaded / evt.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error('Erro ao enviar arquivo'));
        };
        xhr.onerror = () => reject(new Error('Erro ao enviar arquivo'));
        xhr.send(formData);
      });

      setArquivoSelecionado(null);
      setPreviewUrl(null);
      setProgressoUpload(0);
      sonnerToast.success('Arquivo enviado com sucesso!');
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

  const handleEnviarAudio = async (audioBlob: Blob, duracao: number) => {
    if (!selectedLead || enviando) return;

    try {
      setEnviando(true);
      const audioBase64 = await blobToBase64(audioBlob);

      // Mensagem otimista removida - Socket.io entrega em tempo real
      setShowAudioRecorder(false);

      await api.post('/evolution/send-audio', {
        conversaId: selectedLead.sessao_ativa?.id,
        audioBase64,
        duracao,
      });

      toast({
        title: "🎤 Áudio enviado",
        description: "Seu áudio foi enviado com sucesso",
      });
    } catch (err: any) {
      setMensagens(prev => prev.filter(m => !m.id.startsWith('temp-audio-')));
      toast({
        title: "❌ Erro ao enviar áudio",
        description: err.message || "Não foi possível enviar o áudio",
        variant: "destructive",
      });
    } finally {
      setEnviando(false);
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

  return (
    <DashboardLayout title="Conversas WhatsApp">
      <div className="grid h-[calc(100vh-160px)] grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="col-span-1 overflow-hidden">
          <div className="flex h-full flex-col">
            <div className="border-b p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Conversas ({leads.length})</h3>
                <Button onClick={() => fetchLeads()} variant="ghost" size="sm">🔄</Button>
              </div>
              <ConversationFilters
                filter={conversationFilter}
                onFilterChange={(filter) => {
                  setConversationFilter(filter);
                }}
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {leads.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium">Nenhuma conversa</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {conversationFilter === 'minhas'
                      ? 'Você não tem conversas atribuídas'
                      : 'Aguardando mensagens de clientes'}
                  </p>
                </div>
              ) : (
                leads.map((lead) => (
                  <div
                    key={lead.id}
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
                          <p className="font-medium truncate">{lead.nome}</p>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(lead.ultima_interacao)}
                          </span>
                        </div>
                        <p className="truncate text-sm text-muted-foreground">
                          {lead.ultima_mensagem?.mensagem || 'Sem mensagens'}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-muted-foreground">
                            💬 {lead.total_mensagens} mensagens
                          </p>
                          {lead.sessao_ativa?.atendente && (
                            <span className="text-xs text-muted-foreground truncate ml-2">
                              👤 {lead.sessao_ativa.atendente.nome}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>

        <Card className="col-span-1 md:col-span-2 overflow-hidden">
          <div className="flex h-full flex-col">
            {selectedLead ? (
              <>
                <div className={`border-b p-4 ${whatsappStyles.headerBg} text-white`}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <ContactAvatar
                        nome={selectedLead.nome}
                        avatarUrl={selectedLead.avatar_url}
                        size="lg"
                      />
                      <div>
                        <h3 className="font-semibold">{selectedLead.nome}</h3>
                        <p className="text-xs text-white/80">
                          {formatPhone(selectedLead.whatsapp_id || selectedLead.telefone)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <AttendantBadge
                        atendente={selectedLead.sessao_ativa?.atendente || undefined}
                        onTransfer={() => setAssignModalOpen(true)}
                      />
                      {!selectedLead.sessao_ativa?.atendente && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAssignModalOpen(true)}
                        >
                          Atribuir
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className="flex-1 overflow-y-auto p-4"
                  style={{ backgroundImage: chatBgPattern, backgroundColor: '#ECE5DD' }}
                >
                  {loadingMensagens ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : mensagens.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-sm text-[#667781]">Nenhuma mensagem ainda</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                       {mensagens.map((mensagem) => {
                        const isOwn = mensagem.remetente === 'atendente';
                        const isAudio = mensagem.tipo_mensagem === 'audio';
                        return (
                          <div
                            key={mensagem.id}
                            className={`flex ${isOwn ? 'justify-end animate-slide-in-right' : 'justify-start animate-slide-in-left'}`}
                          >
                            {!isOwn && (
                              <ContactAvatar
                                nome={selectedLead?.nome || 'Usuário'}
                                avatarUrl={selectedLead?.avatar_url}
                                size="sm"
                                className="mr-2 mt-1"
                              />
                            )}
                            <div
                              className={`max-w-[70%] px-4 py-2 shadow-sm relative ${
                                isOwn ? whatsappStyles.sentBubble : whatsappStyles.receivedBubble
                              }`}
                              style={{
                                borderRadius: isOwn ? '8px 8px 0px 8px' : '8px 8px 8px 0px',
                              }}
                            >
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
                                    <p className="text-sm whitespace-pre-wrap break-words mt-2">{mensagem.mensagem}</p>
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
                              ) : (
                                <p className="text-sm whitespace-pre-wrap break-words">{mensagem.mensagem}</p>
                              )}
                              <span className="text-xs text-[#667781] mt-1 flex items-center gap-1 justify-end">
                                {new Date(mensagem.data_envio).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit', minute: '2-digit'
                                })}
                                {isOwn && (
                                  <span className={
                                    mensagem.status_entrega === 'lido' ? 'text-blue-500' : 'text-[#667781]'
                                  }>
                                    {mensagem.status_entrega === 'lido' ? '✓✓' :
                                     mensagem.status_entrega === 'entregue' ? '✓✓' :
                                     mensagem.status_entrega === 'enviado' ? '✓' : '🕐'}
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                <div className="border-t px-4 py-2 bg-[#F0F2F5]">
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
                    <form onSubmit={handleEnviarMensagem} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                      {/* Input arredondado estilo WhatsApp */}
                      <div className="flex-1 flex items-center gap-3 bg-white rounded-[24px] border border-[#E9EDEF] px-4 py-2.5 transition-all hover:border-[#D1D7DB] shadow-sm">
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
                          type="text"
                          placeholder="Digite uma mensagem"
                          value={novaMsg}
                          onChange={handleMensagemChange}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              if (novaMsg.trim()) {
                                handleEnviarMensagem(e as any);
                              }
                            }
                          }}
                          maxLength={1000}
                          disabled={enviando}
                          autoComplete="off"
                          className="flex-1 bg-transparent outline-none text-[15px] text-gray-800 placeholder:text-[#8696A0] min-w-0 disabled:opacity-50"
                        />
                      </div>

                      {/* Botão microfone circular com hover verde */}
                      <button
                        type="button"
                        onClick={() => setShowAudioRecorder(true)}
                        className="group w-12 h-12 flex items-center justify-center rounded-full bg-[#F0F2F5] hover:bg-[#25D366] transition-all duration-200 hover:scale-105 shadow-sm flex-shrink-0"
                        title="Gravar áudio"
                      >
                        <Mic className="w-6 h-6 text-[#54656F] group-hover:text-white transition-colors duration-200" />
                      </button>

                      {/* Botão enviar - aparece quando há texto */}
                      {novaMsg.trim() && (
                        <button
                          type="submit"
                          disabled={enviando}
                          className="w-12 h-12 flex items-center justify-center rounded-full bg-[#25D366] hover:bg-[#1DA851] transition-all duration-200 hover:scale-105 shadow-sm flex-shrink-0 disabled:opacity-50 animate-scale-in"
                          title="Enviar mensagem"
                        >
                          {enviando ? (
                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                          ) : (
                            <Send className="w-5 h-5 text-white" />
                          )}
                        </button>
                      )}
                      </div>

                      {/* Contador de caracteres */}
                      {novaMsg.length > 0 && (
                        <div className="flex items-center gap-2 px-3 text-[11px] mt-0.5">
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
                        </div>
                      )}
                    </form>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Selecione uma conversa</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {selectedLead && (
        <AssignmentModal
          open={assignModalOpen}
          onOpenChange={setAssignModalOpen}
          conversationId={selectedLead.id}
          currentAtendente={selectedLead.sessao_ativa?.atendente || undefined}
          onSuccess={handleAssignSuccess}
        />
      )}

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
    </DashboardLayout>
  );
}
