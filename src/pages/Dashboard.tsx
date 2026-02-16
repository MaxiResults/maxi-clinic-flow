import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { Users, Calendar, MessageSquare, TrendingUp, Clock, RefreshCw, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';

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

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
