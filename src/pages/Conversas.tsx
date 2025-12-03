import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [mensagens]);

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchLeads(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedLead) return;
    const interval = setInterval(() => {
      fetchMensagens(selectedLead.id, true);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedLead]);

  const fetchLeads = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }

      const response = await api.get('/conversas/leads', {
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

      const mensagemTemp: Mensagem = {
        id: `temp-${Date.now()}`,
        sessao_id: selectedLead.sessao_ativa?.id || '',
        remetente: 'atendente',
        tipo_mensagem: 'text',
        mensagem: novaMsg,
        data_envio: new Date().toISOString(),
        status_entrega: 'enviando',
      };

      setMensagens(prev => [...prev, mensagemTemp]);
      setNovaMsg("");

      await api.post(`/conversas/leads/${selectedLead.id}/mensagens`, {
        texto: novaMsg,
      });

      setTimeout(() => {
        fetchMensagens(selectedLead.id, true);
      }, 1000);

      toast({
        title: "✅ Mensagem enviada",
        description: "Sua mensagem foi enviada com sucesso",
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
            <Button onClick={() => fetchLeads()} variant="destructive">
              🔄 Tentar novamente
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (leads.length === 0) {
    return (
      <DashboardLayout title="Conversas WhatsApp">
        <div className="text-center py-12">
          <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium">Nenhuma conversa ativa</p>
          <p className="text-sm text-muted-foreground mt-2">
            As conversas aparecerão aqui quando clientes enviarem mensagens
          </p>
          <Button onClick={() => fetchLeads()} variant="outline" className="mt-4">
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
                <h3 className="font-semibold">Conversas ({leads.length})</h3>
                <Button onClick={() => fetchLeads()} variant="ghost" size="sm">🔄</Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className={`cursor-pointer border-b p-4 transition-colors hover:bg-muted/50 ${
                    selectedLead?.id === lead.id ? "bg-blue-50" : ""
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
                      <p className="text-xs text-muted-foreground mt-1">
                        💬 {lead.total_mensagens} mensagens
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
            {selectedLead ? (
              <>
                <div className="border-b p-4 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {selectedLead.nome.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{selectedLead.nome}</h3>
                      <p className="text-xs text-muted-foreground">
                        {formatPhone(selectedLead.whatsapp_id || selectedLead.telefone)}
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
