import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Star } from "lucide-react";

export default function Especialidades() {
  return (
    <DashboardLayout title="Especialidades">
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">⭐ Especialidades</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie as especialidades dos profissionais
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Especialidade
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Em Desenvolvimento</CardTitle>
            <CardDescription>
              Esta funcionalidade está em desenvolvimento e estará disponível em breve.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-12">
            <div className="text-center">
              <Star className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground">
                Página de especialidades em breve
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
