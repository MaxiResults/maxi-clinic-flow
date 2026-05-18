import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { Users, Calendar, MessageSquare, TrendingUp, Clock, RefreshCw, Loader2, Send, Timer } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '@/lib/api';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    agendamentosHoje: 0,
    conversasAtivas: 0,
    taxaConversao: 0
  });
  const [chartData, setChartData] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsWpp, setAnalyticsWpp] = useState<any>(null);
  const [loadingWpp, setLoadingWpp] = useState(true);
  const [periodoWpp, setPeriodoWpp] = useState('30');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    setLoadingWpp(true);
    api.get(`/analytics/conversas?periodo=${periodoWpp}`)
      .then(r => setAnalyticsWpp(r.data))
      .catch(() => setAnalyticsWpp(null))
      .finally(() => setLoadingWpp(false));
  }, [periodoWpp]);

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [leadsRes, agendamentosRes] = await Promise.all([
        api.get('/leads', { params: { t: Date.now() } }),
        api.get('/agendamentos', { params: { t: Date.now() } })
      ]);

      const leads = leadsRes.data || [];
      const totalLeads = leads.length;
      const convertidos = leads.filter(l => l.status === 'convertido').length;
      const taxaConversao = totalLeads > 0 ? Math.round((convertidos / totalLeads) * 100) : 0;

      const agendamentos = agendamentosRes.data || [];
      const hoje = new Date().toISOString().split('T')[0];
      const agendamentosHoje = agendamentos.filter(a => {
        if (!a.data_hora_inicio) return false;
        return a.data_hora_inicio.split('T')[0] === hoje;
      });

      const proximos = agendamentosHoje
        .filter(a => a.status === 'agendado' || a.status === 'confirmado')
        .slice(0, 5)
        .map(a => ({
          id: a.id,
          clientName: a.Lead?.nome || a.Cliente_Final?.nome_completo || 'Cliente',
          procedure: a.Produto?.nome || 'Procedimento',
          time: new Date(a.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          status: a.status
        }));

      const leadsPorCanal = leads.reduce((acc, lead) => {
        const canal = lead.canal_origem || 'Não informado';
        acc[canal] = (acc[canal] || 0) + 1;
        return acc;
      }, {});

      const chartDataFormatted = Object.entries(leadsPorCanal).map(([name, leads]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        leads
      }));

      const conversasAtivas = leads.filter(l => {
        if (!l.updated_at) return false;
        return (Date.now() - new Date(l.updated_at).getTime()) / (1000 * 60 * 60) <= 24;
      }).length;

      setStats({ totalLeads, agendamentosHoje: agendamentosHoje.length, conversasAtivas, taxaConversao });
      setChartData(chartDataFormatted);
      setUpcomingAppointments(proximos);
    } catch (error) {
      console.error('❌ Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6 animate-fade-in">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total de Leads" value={stats.totalLeads.toString()} icon={Users} trend={{ value: 12.5, isPositive: true }} />
          <StatCard title="Agendamentos Hoje" value={stats.agendamentosHoje.toString()} icon={Calendar} description={`${upcomingAppointments.filter(a => a.status === 'confirmado').length} confirmados`} />
          <StatCard title="Conversas Ativas" value={stats.conversasAtivas.toString()} icon={MessageSquare} description="Últimas 24h" />
          <StatCard title="Taxa de Conversão" value={`${stats.taxaConversao}%`} icon={TrendingUp} trend={{ value: 4.2, isPositive: true }} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Próximos Agendamentos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Próximos Agendamentos
              </CardTitle>
              <CardDescription>Agendamentos para hoje</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="Nenhum agendamento para hoje"
                  description="Não há agendamentos programados para hoje."
                />
              ) : (
                <div className="space-y-3">
                  {upcomingAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{appointment.clientName}</p>
                        <p className="text-sm text-muted-foreground">{appointment.procedure}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{appointment.time}</span>
                        <StatusBadge status={appointment.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Leads por Origem */}
          <Card>
            <CardHeader>
              <CardTitle>Leads por Origem</CardTitle>
              <CardDescription>Distribuição atual</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <EmptyState
                  icon={TrendingUp}
                  title="Nenhum lead cadastrado"
                  description="Cadastre leads para visualizar a distribuição por origem."
                />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                    <Bar dataKey="leads" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* WhatsApp & Atendimento */}
        <div>
          <div className="flex items-center justify-between mt-8 mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#25D366]" />
              <h2 className="text-lg font-semibold">WhatsApp & Atendimento</h2>
            </div>
            <select
              value={periodoWpp}
              onChange={e => setPeriodoWpp(e.target.value)}
              className="text-sm border rounded-lg px-3 py-1.5 bg-background"
            >
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
            </select>
          </div>

          {!loadingWpp && !analyticsWpp && (
            <p className="text-sm text-muted-foreground mb-4">Sem dados para o período</p>
          )}

          {/* Cards de resumo */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversas</CardTitle>
                <MessageSquare className="h-4 w-4 text-[#25D366]" />
              </CardHeader>
              <CardContent>
                {loadingWpp ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{analyticsWpp?.resumo?.total_conversas ?? 0}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">Total no período</p>
                <p className="text-xs text-muted-foreground">{analyticsWpp?.resumo?.conversas_hoje ?? 0} hoje</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Em aberto</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                {loadingWpp ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{analyticsWpp?.resumo?.conversas_abertas ?? 0}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">Aguardando resposta</p>
                <p className="text-xs text-muted-foreground">{analyticsWpp?.resumo?.conversas_resolvidas ?? 0} resolvidas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mensagens</CardTitle>
                <Send className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                {loadingWpp ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{analyticsWpp?.resumo?.total_mensagens ?? 0}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">Mensagens trocadas</p>
                <p className="text-xs text-muted-foreground">
                  ↑{analyticsWpp?.resumo?.mensagens_enviadas ?? 0} enviadas · ↓{analyticsWpp?.resumo?.mensagens_recebidas ?? 0} recebidas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tempo resposta</CardTitle>
                <Timer className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                {loadingWpp ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">
                    {(() => {
                      const t = analyticsWpp?.resumo?.tempo_medio_resposta_min ?? 0;
                      if (t < 60) return `${Math.round(t)} min`;
                      const h = Math.floor(t / 60);
                      const m = Math.round(t % 60);
                      return `${h}h ${m}min`;
                    })()}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">Tempo médio de resposta</p>
                <p className="text-xs text-muted-foreground">Por atendente</p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de volume */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Volume de conversas</CardTitle>
              <CardDescription>Conversas e mensagens por dia</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingWpp ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (analyticsWpp?.volume_por_dia?.length ?? 0) === 0 ? (
                <EmptyState icon={MessageSquare} title="Sem volume no período" description="Nenhuma conversa ou mensagem registrada." />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={analyticsWpp.volume_por_dia}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="data"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(v: string) => {
                        if (!v) return '';
                        const [, m, d] = v.split('-');
                        return `${d}/${m}`;
                      }}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      labelFormatter={(v: string) => {
                        if (!v) return '';
                        const [y, m, d] = v.split('-');
                        return `${d}/${m}/${y}`;
                      }}
                      formatter={(value: any) => Number(value).toLocaleString('pt-BR')}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="conversas" name="Conversas" stroke="#25D366" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="mensagens" name="Mensagens" stroke="#6366F1" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Tabela de atendentes */}
          {(loadingWpp || (analyticsWpp?.performance_atendentes?.length ?? 0) > 0) && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Performance dos atendentes</CardTitle>
                <CardDescription>Top 5 do período</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Atendente</TableHead>
                      <TableHead className="text-right">Conversas</TableHead>
                      <TableHead className="text-right">Resolvidas</TableHead>
                      <TableHead className="text-right">Taxa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingWpp
                      ? Array.from({ length: 3 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-4 w-10 ml-auto" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-4 w-10 ml-auto" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-5 w-14 ml-auto" /></TableCell>
                          </TableRow>
                        ))
                      : analyticsWpp.performance_atendentes.slice(0, 5).map((a: any) => {
                          const taxa = a.conversas > 0 ? Math.round((a.resolvidas / a.conversas) * 100) : 0;
                          const variant =
                            taxa >= 80
                              ? 'bg-green-100 text-green-800 hover:bg-green-100'
                              : taxa >= 50
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                              : 'bg-red-100 text-red-800 hover:bg-red-100';
                          return (
                            <TableRow key={a.id}>
                              <TableCell className="font-medium">{a.nome}</TableCell>
                              <TableCell className="text-right">{a.conversas}</TableCell>
                              <TableCell className="text-right">{a.resolvidas}</TableCell>
                              <TableCell className="text-right">
                                <Badge className={variant}>{taxa}%</Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Atualizar */}
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => fetchDashboardData(true)} disabled={refreshing}>
            {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {refreshing ? "Atualizando..." : "Atualizar Dashboard"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
