import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/EmptyState";
import { Calendar, Clock, User, Package, CheckCircle, XCircle, AlertCircle, Plus, RefreshCw, Loader2 } from "lucide-react";
import { formatTimeBR } from "@/utils/timezone";
import { FormattedDate } from '@/components/ui/FormattedDate';
import api from '@/lib/api';
import { ListSkeleton } from '@/components/skeletons/ListSkeleton';

interface Agendamento {
  id: string;
  Lead?: { nome: string; telefone: string };
  Profissional?: { nome: string };
  Produto?: { nome: string };
  data_hora_inicio: string;
  data_hora_fim: string;
  status: string;
  valor: number;
  observacoes?: string;
}

export default function Agendamentos() {
  const navigate = useNavigate();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState("todos");

  useEffect(() => {
    fetchAgendamentos();
  }, []);

  const fetchAgendamentos = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else { setLoading(true); setError(null); }

      const response = await api.get('/agendamentos', { params: { t: Date.now() } });
      setAgendamentos(response.data || []);
    } catch (err: any) {
      console.error('❌ Erro ao buscar agendamentos:', err);
      setError(err.message);
      setAgendamentos([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmado': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelado': return <XCircle className="h-5 w-5 text-destructive" />;
      case 'agendado': return <Clock className="h-5 w-5 text-blue-500" />;
      default: return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelado': return 'bg-destructive/10 text-destructive';
      case 'agendado': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'concluido': return 'bg-muted text-muted-foreground';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    }
  };

  const agendamentosFiltrados = agendamentos.filter(ag => filtroStatus === 'todos' || ag.status === filtroStatus);

  if (loading) {
    return <DashboardLayout title="Agendamentos"><ListSkeleton /></DashboardLayout>;
  }

  if (error) {
    return (
      <DashboardLayout title="Agendamentos">
        <div className="p-8">
          <EmptyState
            icon={AlertCircle}
            title="Erro ao carregar agendamentos"
            description={error}
            action={{ label: "Tentar novamente", onClick: () => fetchAgendamentos() }}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Agendamentos">
      <div className="p-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Agendamentos</h2>
            <p className="text-muted-foreground mt-1">
              Total: {agendamentos.length} | Exibindo: {agendamentosFiltrados.length}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => fetchAgendamentos(true)} disabled={refreshing}>
              {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              {refreshing ? "Atualizando..." : "Recarregar"}
            </Button>
            <Button onClick={() => navigate("/agendamentos/novo")}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Agendamento
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="lista" className="w-full">
          <TabsList>
            <TabsTrigger value="lista">Lista</TabsTrigger>
            <TabsTrigger value="calendario">Calendário</TabsTrigger>
          </TabsList>

          <TabsContent value="lista" className="space-y-4">
            {/* Filtros */}
            <div className="flex flex-wrap gap-2">
              {['todos', 'agendado', 'confirmado', 'cancelado', 'concluido'].map(status => (
                <Button
                  key={status}
                  variant={filtroStatus === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFiltroStatus(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>

            {/* Lista */}
            {agendamentosFiltrados.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="Nenhum agendamento encontrado"
                description={filtroStatus !== 'todos' ? 'Tente outro filtro para encontrar agendamentos.' : 'Clique em "Novo Agendamento" para criar um.'}
                action={filtroStatus === 'todos' ? { label: "Novo Agendamento", onClick: () => navigate("/agendamentos/novo") } : undefined}
              />
            ) : (
              <div className="space-y-4">
                {agendamentosFiltrados.map((agendamento) => (
                  <div
                    key={agendamento.id}
                    className="bg-card border rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          {getStatusIcon(agendamento.status)}
                          <h3 className="text-lg font-bold text-foreground">
                            {agendamento.Lead?.nome || 'Cliente não informado'}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(agendamento.status)}`}>
                            {agendamento.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-start gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-foreground">
                                <FormattedDate value={agendamento.data_hora_inicio} format="short" />
                              </p>
                              <p className="text-xs">
                                {formatTimeBR(agendamento.data_hora_inicio)} - {formatTimeBR(agendamento.data_hora_fim)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 text-muted-foreground">
                            <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs">Profissional</p>
                              <p className="font-medium text-foreground">{agendamento.Profissional?.nome || 'Não definido'}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 text-muted-foreground">
                            <Package className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs">Serviço</p>
                              <p className="font-medium text-foreground">{agendamento.Produto?.nome || 'Não definido'}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 text-muted-foreground">
                            <span className="text-lg flex-shrink-0">💰</span>
                            <div>
                              <p className="text-xs">Valor</p>
                              <p className="font-medium text-green-600 dark:text-green-400">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(agendamento.valor || 0)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {agendamento.observacoes && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Obs:</span> {agendamento.observacoes}
                            </p>
                          </div>
                        )}
                        {agendamento.Lead?.telefone && (
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground">📱 {agendamento.Lead.telefone}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex lg:flex-col gap-2">
                        <Button variant="outline" size="sm" className="flex-1 lg:flex-none">Ver detalhes</Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 lg:flex-none"
                          onClick={() => {
                            if (!agendamento.id) return;
                            navigate(`/agendamentos/${agendamento.id}/editar`);
                          }}
                        >
                          ✏️ Editar
                        </Button>
                        {agendamento.status === 'agendado' && (
                          <>
                            <Button variant="outline" size="sm" className="flex-1 lg:flex-none text-green-600 hover:text-green-700">Confirmar</Button>
                            <Button variant="outline" size="sm" className="flex-1 lg:flex-none text-destructive hover:text-destructive">Cancelar</Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="calendario">
            <EmptyState
              icon={Calendar}
              title="Calendário em desenvolvimento"
              description="Visualização de calendário será implementada em breve."
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
