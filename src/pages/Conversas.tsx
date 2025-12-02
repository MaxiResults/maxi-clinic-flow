import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface Sessao {
  id: string;
  whatsapp_id: string;
  lead_id?: string;
  canal: string;
  status_sessao: string;
  profissional_responsavel_id?: string;
  tipo_atendimento_atual: string;
  ultima_interacao: string;
  total_mensagens: number;
  ultima_mensagem?: {
    mensagem: string;
    data_envio: string;
    tipo_mensagem: string;
  };
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
}
export default function Conversas() {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [selectedSessao, setSelectedSessao] = useState<Sessao | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMensagens, setLoadingMensagens] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [novaMsg, setNovaMsg] = useState("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [mensagens]);

  useEffect(() => {
    fetchSessoes();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchSessoes(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedSessao) return;
    const interval = setInterval(() => {
      fetchMensagens(selectedSessao.id, true);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedSessao]);
  const fetchSessoes = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      const response = await api.get('/conversas', {
        params: { status: 'ativa', t: Date.now() }
      });
      const sessoesArray = response.data || [];
      setSessoes(sessoesArray);
      if (!silent && sessoesArray.length > 0 && !selectedSessao) {
        setSelectedSessao(sessoesArray[0]);
        fetchMensagens(sessoesArray[0].id);
      }
    } catch (err: any) {
      if (!silent) {
        setError(err.message);
        setSessoes([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchMensagens = async (sessaoId: string, silent = false) => {
    try {
      if (!silent) setLoadingMensagens(true);
      const response = await api.get(`/conversas/${sessaoId}/mensagens`, {
        params: { t: Date.now() }
      });
      setMensagens(response.data || []);
    } catch (err: any) {
      if (!silent) setMensagens([]);
    } finally {
      if (!silent) setLoadingMensagens(false);
    }
  };

  const handleSelectSessao = (sessao: Sessao) => {
    setSelectedSessao(sessao);
    setMensagens([]);
    fetchMensagens(sessao.id);
  };

  const handleEnviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMsg.trim() || !selectedSessao || enviando) return;
    try {
      setEnviando(true);
      const mensagemTemp: Mensagem = {
        id: `temp-${Date.now()}`,
        sessao_id: selectedSessao.id,
        remetente: 'atendente',
        tipo_mensagem: 'text',
        mensagem: novaMsg,
        data_envio: new Date().toISOString(),
        status_entrega: 'enviando',
      };
      setMensagens(prev => [...prev, mensagemTemp]);
      setNovaMsg("");
      await api.post(`/conversas/${selectedSessao.id}/mensagens`, { texto: novaMsg });
      setTimeout(() => fetchMensagens(selectedSessao.id, true), 1000);
      toast({ title: "✅ Mensagem enviada" });
    } catch (err: any) {
      setMensagens(prev => prev.filter(m => !m.id.startsWith('temp-')));
      toast({ title: "❌ Erro ao enviar", variant: "destructive" });
    } finally {
      setEnviando(false);
    }
  };

  const formatPhone = (whatsappId: string) => {
    if (!whatsappId) return 'Sem telefone';
    const numbers = whatsappId.replace(/\D/g, '');
    if (numbers.length === 13) {
      return `+${numbers.slice(0, 2)} (${numbers.slice(2, 4)}) ${numbers.slice(4, 9)}-${numbers.slice(9)}`;
    }
    return whatsappId;
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-red-800 font-bold mb-3">❌ Erro ao carregar</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => fetchSessoes()} variant="destructive">
              🔄 Tentar novamente
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (sessoes.length === 0) {
    return (
      <DashboardLayout title="Conversas WhatsApp">
        <div className="text-center py-12">
          <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium">Nenhuma conversa ativa</p>
          <p className="text-sm text-muted-foreground mt-2">
            As conversas aparecerão aqui quando clientes enviarem mensagens
          </p>
          <Button onClick={() => fetchSessoes()} variant="outline" className="mt-4">
            🔄 Recarregar
          </Button>
        </div>
      </DashboardLayout>
    );
  }
  return (
    <DashboardLayout title="Conversas WhatsApp">
      <div className="grid h-[calc(100vh-160px)] grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="col-span-1 overflow-hidden">
          <div className="flex h-full flex-col">
            <div className="border-b p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Conversas ({sessoes.length})</h3>
                <Button onClick={() => fetchSessoes()} variant="ghost" size="sm">🔄</Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {sessoes.map((sessao) => (
                <div
                  key={sessao.id}
                  className={`cursor-pointer border-b p-4 transition-colors hover:bg-muted/50 ${
                    selectedSessao?.id === sessao.id ? "bg-blue-50" : ""
                  }`}
                  onClick={() => handleSelectSessao(sessao)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {formatPhone(sessao.whatsapp_id).substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium truncate">{formatPhone(sessao.whatsapp_id)}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(sessao.ultima_interacao)}
                        </span>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {sessao.ultima_mensagem?.mensagem || 'Sem mensagens'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="col-span-1 md:col-span-2 overflow-hidden">
          <div className="flex h-full flex-col">
            {selectedSessao ? (
              <>
                <div className="border-b p-4 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {formatPhone(selectedSessao.whatsapp_id).substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{formatPhone(selectedSessao.whatsapp_id)}</h3>
                      <p className="text-xs text-muted-foreground">
                        {selectedSessao.tipo_atendimento_atual === 'bot' ? '🤖 Bot' : '👤 Humano'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
                  {loadingMensagens ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : mensagens.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {mensagens.map((mensagem) => {
                        const isOwn = mensagem.remetente === 'atendente';
                        return (
                          <div key={mensagem.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              isOwn ? 'bg-blue-500 text-white' : 'bg-white border'
                            }`}>
                              <p className="text-sm whitespace-pre-wrap break-words">{mensagem.mensagem}</p>
                              <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-muted-foreground'}`}>
                                {new Date(mensagem.data_envio).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit', minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                <div className="border-t p-4 bg-white">
                  <form onSubmit={handleEnviarMensagem} className="flex gap-2">
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
    </DashboardLayout>
  );
}
