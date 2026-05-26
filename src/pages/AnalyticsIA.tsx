import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Bot,
  TrendingUp,
  MessageSquare,
  UserCheck,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import api from '@/lib/api';

interface OverviewData {
  periodo_dias: number;
  conversas: { total: number; atendidas_ia: number; atendidas_humano: number; taxa_ia_percent: number };
  mensagens: { total: number; enviadas_ia: number; taxa_ia_percent: number };
  handoffs: { total: number; manuais: number; automaticos: number };
}

interface TimelinePoint {
  data: string;
  ia: number;
  humano: number;
  total: number;
}

export default function AnalyticsIA() {
  const [periodo, setPeriodo] = useState('30');

  const { data: overview, isLoading: loadingOverview } = useQuery<OverviewData>({
    queryKey: ['ai-analytics-overview', periodo],
    queryFn: async () => {
      const res = await api.get(`/analytics/ia/overview?periodo=${periodo}`);
      return res.data.data;
    },
  });

  const { data: timeline, isLoading: loadingTimeline } = useQuery<TimelinePoint[]>({
    queryKey: ['ai-analytics-timeline', periodo],
    queryFn: async () => {
      const res = await api.get(`/analytics/ia/timeline?periodo=${periodo}`);
      return res.data.data;
    },
  });

  const { data: intentsData, isLoading: loadingIntents } = useQuery({
    queryKey: ['ai-analytics-intents', periodo],
    queryFn: async () => {
      const res = await api.get(`/analytics/ia/intents?periodo=${periodo}`);
      return res.data.data;
    },
  });

  const { data: functionsData, isLoading: loadingFunctions } = useQuery({
    queryKey: ['ai-analytics-functions', periodo],
    queryFn: async () => {
      const res = await api.get(`/analytics/ia/functions?periodo=${periodo}`);
      return res.data.data;
    },
  });

  const INTENT_LABELS: Record<string, string> = {
    saudacao: '👋 Saudação',
    informacao_procedimento: '💉 Info Procedimento',
    horario_funcionamento: '🕐 Horário',
    localizacao: '📍 Localização',
    duvida_geral: '❓ Dúvida Geral',
    agendamento_novo: '📅 Agendar',
    reagendar: '🔄 Reagendar',
    cancelar: '❌ Cancelar',
    reclamacao: '😤 Reclamação',
    emergencia: '🚨 Emergência',
    falar_com_atendente: '🧑 Atendente',
  };

  const FUNCTION_LABELS: Record<string, string> = {
    buscarHorariosDisponiveis: '🔍 Buscar Horários',
    criarAgendamento: '📅 Criar Agendamento',
    buscarAgendamentos: '📋 Buscar Agendamentos',
    reagendarAgendamento: '🔄 Reagendar',
    cancelarAgendamento: '❌ Cancelar',
  };

  const taxa = overview?.conversas?.taxa_ia_percent ?? 0;

  return (
    <DashboardLayout title="Analytics IA">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">🤖 Analytics IA</h1>
            <p className="text-muted-foreground mt-2">
              Desempenho do assistente IA no atendimento
            </p>
          </div>
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="text-sm border rounded-lg px-3 py-1.5 bg-background"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
        </div>

        {/* SEÇÃO 1 — Cards de métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Atendidas pela IA</CardTitle>
              <Bot className="h-4 w-4 text-violet-500" />
            </CardHeader>
            <CardContent>
              {loadingOverview ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {overview?.conversas?.atendidas_ia ?? 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    de {overview?.conversas?.total ?? 0} totais
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Card 2 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Taxa IA</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {loadingOverview ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{taxa}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    das conversas no período
                  </p>
                  <div className="w-full bg-muted rounded-full mt-2 h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 bg-green-500 rounded-full"
                      style={{ width: `${Math.min(taxa, 100)}%` }}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Card 3 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Mensagens IA</CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              {loadingOverview ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {overview?.mensagens?.enviadas_ia ?? 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {overview?.mensagens?.taxa_ia_percent ?? 0}% do total
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Card 4 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Handoffs</CardTitle>
              <UserCheck className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              {loadingOverview ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {overview?.handoffs?.total ?? 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {overview?.handoffs?.manuais ?? 0} manuais ·{' '}
                    {overview?.handoffs?.automaticos ?? 0} automáticos
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* SEÇÃO 2 — Gráfico timeline */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <CardTitle>Conversas: IA vs Humano</CardTitle>
                <CardDescription>Distribuição diária no período</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-violet-500" />
                  IA
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-orange-500" />
                  Humano
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingTimeline ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeline ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="data" className="text-xs" />
                  <YAxis className="text-xs" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="ia"
                    name="IA"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="humano"
                    name="Humano"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* SEÇÃO 3 — Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Motivos de Handoff
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingOverview ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Manuais (atendente)</span>
                    </div>
                    <span className="font-bold">
                      {overview?.handoffs?.manuais ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-violet-500" />
                      <span className="text-sm">Automáticos (baixa confiança)</span>
                    </div>
                    <span className="font-bold">
                      {overview?.handoffs?.automaticos ?? 0}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-violet-500" />
                Resumo do Período
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingOverview ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Período</span>
                    <span className="font-medium">{periodo} dias</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Conversas atendidas pela IA</span>
                    <span className="font-medium">
                      {overview?.conversas?.atendidas_ia ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Mensagens geradas pela IA</span>
                    <span className="font-medium">
                      {overview?.mensagens?.enviadas_ia ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-muted-foreground">Handoffs realizados</span>
                    <span className="font-medium">
                      {overview?.handoffs?.total ?? 0}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}