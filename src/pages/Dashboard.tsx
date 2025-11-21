import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Users, Calendar, MessageSquare, TrendingUp, Clock, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_BASE_URL = 'https://viewlessly-unadjoining-lashanda.ngrok-free.dev/api/v1';

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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Buscar dados em paralelo
      const [leadsRes, agendamentosRes] = await Promise.all([
        fetch(`${API_BASE_URL}/leads?t=${Date.now()}`).then(r => r.json()),
        fetch(`${API_BASE_URL}/agendamentos?t=${Date.now()}`).then(r => r.json())
      ]);

      console.log('📊 Leads:', leadsRes);
      console.log('📅 Agendamentos:', agendamentosRes);

      // Processar leads
      const leads = leadsRes.success ? leadsRes.data : [];
      const totalLeads = leads.length;

      // Calcular taxa de conversão
      const convertidos = leads.filter(l => l.status === 'convertido').length;
      const taxaConversao = totalLeads > 0 
        ? Math.round((convertidos / totalLeads) * 100) 
        : 0;

      // Processar agendamentos
      const agendamentos = agendamentosRes.success ? agendamentosRes.data : [];
      
      // Filtrar agendamentos de hoje
      const hoje = new Date().toISOString().split('T')[0];
      const agendamentosHoje = agendamentos.filter(a => {
        if (!a.data_hora_inicio) return false;
        const dataAgendamento = a.data_hora_inicio.split('T')[0];
        return dataAgendamento === hoje;
      });

      // Próximos 5 agendamentos de hoje
      const proximos = agendamentosHoje
        .filter(a => a.status === 'agendado' || a.status === 'confirmado')
        .slice(0, 5)
        .map(a => ({
          id: a.id,
          clientName: a.Lead?.nome || a.Cliente_Final?.nome_completo || 'Cliente',
          procedure: a.Produto?.nome || 'Procedimento',
          time: new Date(a.data_hora_inicio).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          status: a.status
        }));

      // Agrupar leads por canal de origem
      const leadsPorCanal = leads.reduce((acc, lead) => {
        const canal = lead.canal_origem || 'Não informado';
        acc[canal] = (acc[canal] || 0) + 1;
        return acc;
      }, {});

      const chartDataFormatted = Object.entries(leadsPorCanal).map(([name, leads]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        leads
      }));

      // Conversas ativas (últimas 24h)
      const conversasAtivas = leads.filter(l => {
        if (!l.updated_at) return false;
        const diff = Date.now() - new Date(l.updated_at).getTime();
        const hours = diff / (1000 * 60 * 60);
        return hours <= 24;
      }).length;

      // Atualizar estados
      setStats({
        totalLeads,
        agendamentosHoje: agendamentosHoje.length,
        conversasAtivas,
        taxaConversao
      });

      setChartData(chartDataFormatted);
      setUpcomingAppointments(proximos);

    } catch (error) {
      console.error('❌ Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando dashboard...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total de Leads"
            value={stats.totalLeads.toString()}
            icon={Users}
            trend={{ value: 12.5, isPositive: true }}
          />
          <StatCard
            title="Agendamentos Hoje"
            value={stats.agendamentosHoje.toString()}
            icon={Calendar}
            description={`${upcomingAppointments.filter(a => a.status === 'confirmado').length} confirmados`}
          />
          <StatCard
            title="Conversas Ativas"
            value={stats.conversasAtivas.toString()}
            icon={MessageSquare}
            description="Últimas 24h"
          />
          <StatCard
            title="Taxa de Conversão"
            value={`${stats.taxaConversao}%`}
            icon={TrendingUp}
            trend={{ value: 4.2, isPositive: true }}
          />
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
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum agendamento para hoje</p>
                </div>
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
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum lead cadastrado ainda</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar 
                      dataKey="leads" 
                      fill="hsl(var(--chart-1))" 
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Botão para recarregar */}
        <div className="flex justify-end">
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            🔄 Atualizar Dashboard
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
