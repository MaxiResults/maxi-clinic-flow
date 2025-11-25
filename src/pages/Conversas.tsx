import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, MessageSquare } from "lucide-react";
import api from "@/lib/api";

interface Sessao {
  id: string;
  Lead?: {
    id: string;
    nome: string;
    telefone: string;
  };
  ultima_mensagem_em?: string;
  status: string;
}

interface Mensagem {
  id: string;
  remetente: string;
  mensagem: string;
  data_envio: string;
  tipo_mensagem: string;
}

export default function Conversas() {
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [selectedSessao, setSelectedSessao] = useState<Sessao | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMensagens, setLoadingMensagens] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSessoes();
  }, []);

  const fetchSessoes = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Buscando sessões...');

      // Por enquanto, vamos buscar os leads como "sessões"
      const response = await api.get('/leads', {
        params: { t: Date.now() }
      });
      const leadsArray = response.data || [];
      
      console.log('📦 Leads:', leadsArray);

      const sessoesArray = leadsArray.map((lead: any) => ({
        id: lead.id,
        Lead: {
          id: lead.id,
          nome: lead.nome,
          telefone: lead.telefone
        },
        ultima_mensagem_em: lead.primeira_mensagem_at || lead.created_at,
        status: 'ativa'
      }));

      console.log('✅ Total de conversas:', sessoesArray.length);
      setSessoes(sessoesArray);

      // Selecionar primeira conversa automaticamente
      if (sessoesArray.length > 0 && !selectedSessao) {
        setSelectedSessao(sessoesArray[0]);
        fetchMensagens(sessoesArray[0].Lead?.id);
      }

    } catch (err: any) {
      console.error('❌ Erro:', err);
      setError(err.message);
      setSessoes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMensagens = async (leadId?: string) => {
    if (!leadId) return;

    try {
      setLoadingMensagens(true);

      console.log('🔍 Buscando mensagens do lead:', leadId);

      const response = await api.get(`/conversas/${leadId}/historico`, {
        params: { t: Date.now() }
      });
      const data = response.data;
      
      console.log('📦 Histórico:', data);

      const mensagensArray = data.mensagens || [];

      console.log('✅ Total de mensagens:', mensagensArray.length);
      setMensagens(mensagensArray);

    } catch (err: any) {
      console.error('❌ Erro ao buscar mensagens:', err);
      setMensagens([]);
    } finally {
      setLoadingMensagens(false);
    }
  };

  const handleSelectSessao = (sessao: Sessao) => {
    setSelectedSessao(sessao);
    fetchMensagens(sessao.Lead?.id);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Ontem';
    } else if (diffDays < 7) {
      return `${diffDays} dias`;
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Conversas">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando conversas...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Conversas">
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-red-800 font-bold mb-3">❌ Erro ao carregar</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchSessoes} variant="destructive">
              🔄 Tentar novamente
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (sessoes.length === 0) {
    return (
      <DashboardLayout title="Conversas">
        <div className="text-center py-12">
          <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium">Nenhuma conversa ativa</p>
          <p className="text-sm text-muted-foreground mt-2">
            As conversas aparecerão aqui quando os leads entrarem em contato
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Conversas">
      <div className="grid h-[calc(100vh-160px)] grid-cols-1 md:grid-cols-3 gap-4">
        {/* Lista de Conversas */}
        <Card className="col-span-1 overflow-hidden">
          <div className="flex h-full flex-col">
            <div className="border-b p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Conversas Ativas ({sessoes.length})</h3>
                <Button onClick={fetchSessoes} variant="ghost" size="sm">
                  🔄
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {sessoes.map((sessao) => (
                <div
                  key={sessao.id}
                  className={`cursor-pointer border-b p-4 transition-colors hover:bg-muted/50 ${
                    selectedSessao?.id === sessao.id ? "bg-muted" : ""
                  }`}
                  onClick={() => handleSelectSessao(sessao)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {sessao.Lead?.nome ? sessao.Lead.nome.substring(0, 2).toUpperCase() : '??'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{sessao.Lead?.nome || 'Sem nome'}</p>
                        <span className="text-xs text-muted-foreground">
                          {sessao.ultima_mensagem_em ? formatTime(sessao.ultima_mensagem_em) : '-'}
                        </span>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        📱 {sessao.Lead?.telefone || 'Sem telefone'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Área de Mensagens */}
        <Card className="col-span-1 md:col-span-2 overflow-hidden">
          <div className="flex h-full flex-col">
            {selectedSessao ? (
              <>
                {/* Header */}
                <div className="border-b p-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {selectedSessao.Lead?.nome ? selectedSessao.Lead.nome.substring(0, 2).toUpperCase() : '??'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{selectedSessao.Lead?.nome || 'Sem nome'}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedSessao.Lead?.telefone || 'Sem telefone'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mensagens */}
                <div className="flex-1 overflow-y-auto p-4">
                  {loadingMensagens ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2 text-sm text-muted-foreground">Carregando mensagens...</span>
                    </div>
                  ) : mensagens.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {mensagens.map((mensagem) => (
                        <div
                          key={mensagem.id}
                          className={`flex ${
                            mensagem.remetente === "lead" ? "justify-start" : "justify-end"
                          }`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              mensagem.remetente === "lead"
                                ? "bg-muted"
                                : "bg-primary text-primary-foreground"
                            }`}
                          >
                            <p className="text-sm">{mensagem.mensagem}</p>
                            <p
                              className={`mt-1 text-xs ${
                                mensagem.remetente === "lead"
                                  ? "text-muted-foreground"
                                  : "text-primary-foreground/70"
                              }`}
                            >
                              {new Date(mensagem.data_envio).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Input (desabilitado por enquanto) */}
                <div className="border-t p-4">
                  <p className="text-sm text-center text-muted-foreground">
                    💬 Visualização apenas. Envio de mensagens em breve.
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Selecione uma conversa para ver as mensagens</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
