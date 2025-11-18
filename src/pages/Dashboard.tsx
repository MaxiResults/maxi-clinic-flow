import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Users, Calendar, MessageSquare, TrendingUp, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = [
  { name: "WhatsApp", leads: 45 },
  { name: "Instagram", leads: 32 },
  { name: "Facebook", leads: 28 },
  { name: "Site", leads: 15 },
  { name: "Indicação", leads: 12 },
];

const upcomingAppointments = [
  {
    id: 1,
    clientName: "Maria Silva",
    procedure: "Limpeza de Pele",
    time: "09:00",
    status: "confirmado" as const,
  },
  {
    id: 2,
    clientName: "João Santos",
    procedure: "Massagem Relaxante",
    time: "10:30",
    status: "agendado" as const,
  },
  {
    id: 3,
    clientName: "Ana Costa",
    procedure: "Drenagem Linfática",
    time: "14:00",
    status: "confirmado" as const,
  },
  {
    id: 4,
    clientName: "Pedro Oliveira",
    procedure: "Consulta Nutricional",
    time: "15:30",
    status: "agendado" as const,
  },
  {
    id: 5,
    clientName: "Carla Mendes",
    procedure: "Avaliação Física",
    time: "16:00",
    status: "confirmado" as const,
  },
];

export default function Dashboard() {
  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total de Leads"
            value="132"
            icon={Users}
            trend={{ value: 12.5, isPositive: true }}
          />
          <StatCard
            title="Agendamentos Hoje"
            value="8"
            icon={Calendar}
            description="5 confirmados"
          />
          <StatCard
            title="Conversas Ativas"
            value="24"
            icon={MessageSquare}
            description="Últimas 24h"
          />
          <StatCard
            title="Taxa de Conversão"
            value="68%"
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
            </CardContent>
          </Card>

          {/* Leads por Origem */}
          <Card>
            <CardHeader>
              <CardTitle>Leads por Origem</CardTitle>
              <CardDescription>Últimos 30 dias</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
