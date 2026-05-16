import { useState, useEffect, useRef, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { AssignmentModal } from "@/components/whatsapp/Assignment/AssignmentModal";
import { AttendantBadge } from "@/components/whatsapp/Assignment/AttendantBadge";
import { ConversationFilters } from "@/components/whatsapp/Assignment/ConversationFilters";
import { AudioRecorder } from "@/components/whatsapp/AudioRecorder";
import { AudioPlayer } from "@/components/whatsapp/AudioPlayer";
import { io, Socket } from "socket.io-client";

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
  tipo_mensagem: 'text' | 'image' | 'audio' | 'video';
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
      }
    };

    socket.on('nova_mensagem', handleNovaMensagem);
    return () => {
      socket.off('nova_mensagem', handleNovaMensagem);
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
      setNovaMsg("");

      await api.post(`/conversas/leads/${selectedLead.id}/mensagens`, {
        texto: novaMsg,
      });
    } catch (err: any) {
      setMensagens(prev => prev.filter(m => !m.id.startsWith('temp-')));
      toast({
        title: "❌ Erro ao enviar",
        description: err.message || "Não foi possível enviar a mensagem",
        variant: "destructive",
      });
    } finally {
      setEnviando(false);
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
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {lead.nome.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
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
                      <Avatar>
                        <AvatarFallback className="bg-white/20 text-white">
                          {selectedLead.nome.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
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
                          <div key={mensagem.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            {!isOwn && (
                              <Avatar className="h-8 w-8 mr-2 mt-1">
                                <AvatarFallback className="bg-[#075E54] text-white text-xs">
                                  {selectedLead?.nome?.[0] || 'L'}
                                </AvatarFallback>
                              </Avatar>
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

                <div className="border-t p-4 bg-card">
                  {showAudioRecorder ? (
                    <div className="flex items-center justify-center">
                      <AudioRecorder
                        onAudioReady={handleEnviarAudio}
                        onCancel={() => setShowAudioRecorder(false)}
                      />
                    </div>
                  ) : (
                    <form onSubmit={handleEnviarMensagem} className="flex items-center gap-2">
                      <AudioRecorder
                        onAudioReady={handleEnviarAudio}
                        onCancel={() => setShowAudioRecorder(false)}
                      />
                      <Input
                        value={novaMsg}
                        onChange={(e) => setNovaMsg(e.target.value)}
                        placeholder="Digite uma mensagem..."
                        disabled={enviando}
                        className="flex-1"
                      />
                      <Button type="submit" disabled={!novaMsg.trim() || enviando} size="icon">
                        {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
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
    </DashboardLayout>
  );
}
