import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Calendar as CalendarIcon, List, Plus, Clock, User } from "lucide-react";

const mockAgendamentos = [
  {
    id: 1,
    clientName: "Maria Silva",
    professional: "Dr. João",
    service: "Limpeza de Pele",
    date: "2024-01-15",
    time: "09:00",
    status: "confirmado" as const,
  },
  {
    id: 2,
    clientName: "João Santos",
    professional: "Dra. Ana",
    service: "Massagem Relaxante",
    date: "2024-01-15",
    time: "10:30",
    status: "agendado" as const,
  },
  {
    id: 3,
    clientName: "Ana Costa",
    professional: "Dr. Pedro",
    service: "Drenagem Linfática",
    date: "2024-01-15",
    time: "14:00",
    status: "confirmado" as const,
  },
  {
    id: 4,
    clientName: "Pedro Oliveira",
    professional: "Dra. Carla",
    service: "Consulta Nutricional",
    date: "2024-01-16",
    time: "15:30",
    status: "agendado" as const,
  },
];

export default function Agendamentos() {
  const [activeTab, setActiveTab] = useState("lista");

  return (
    <DashboardLayout title="Agendamentos">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="lista" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Lista
              </TabsTrigger>
              <TabsTrigger value="calendario" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Calendário
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Agendamento
          </Button>
        </div>

        <TabsContent value="lista" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {mockAgendamentos.map((agendamento) => (
              <Card key={agendamento.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{agendamento.clientName}</CardTitle>
                    <StatusBadge status={agendamento.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{agendamento.professional}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(agendamento.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{agendamento.time}</span>
                  </div>
                  <p className="text-sm font-medium pt-2">{agendamento.service}</p>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      Reagendar
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="calendario">
          <Card>
            <CardContent className="p-6">
              <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <CalendarIcon className="mx-auto h-12 w-12 mb-4" />
                  <p>Visualização de calendário será implementada aqui</p>
                  <p className="text-sm mt-2">Use a aba "Lista" para ver os agendamentos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </div>
    </DashboardLayout>
  );
}
