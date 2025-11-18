import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "lucide-react";

const mockProfissionais = [
  {
    id: 1,
    name: "Dr. João Silva",
    specialties: ["Dermatologia", "Estética"],
    status: "ativo",
    appointments: 24,
  },
  {
    id: 2,
    name: "Dra. Ana Costa",
    specialties: ["Massoterapia", "Fisioterapia"],
    status: "ativo",
    appointments: 18,
  },
  {
    id: 3,
    name: "Dr. Pedro Santos",
    specialties: ["Nutrição", "Emagrecimento"],
    status: "ativo",
    appointments: 15,
  },
  {
    id: 4,
    name: "Dra. Carla Mendes",
    specialties: ["Pilates", "Personal"],
    status: "inativo",
    appointments: 0,
  },
];

export default function Profissionais() {
  return (
    <DashboardLayout title="Profissionais">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockProfissionais.map((profissional) => (
          <Card key={profissional.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {profissional.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{profissional.name}</CardTitle>
                    <Badge
                      variant={profissional.status === "ativo" ? "default" : "secondary"}
                      className={
                        profissional.status === "ativo"
                          ? "bg-status-converted/10 text-status-converted border-status-converted/20"
                          : "bg-status-completed/10 text-status-completed border-status-completed/20"
                      }
                    >
                      {profissional.status === "ativo" ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-2">Especialidades</p>
                <div className="flex flex-wrap gap-2">
                  {profissional.specialties.map((specialty) => (
                    <Badge key={specialty} variant="outline">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-muted-foreground">
                  {profissional.appointments} agendamentos
                </span>
              </div>
              <Button className="w-full" variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Ver Disponibilidade
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
