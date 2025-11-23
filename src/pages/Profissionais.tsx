import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Edit, Trash2, Loader2, Phone, Mail, UserCog
} from "lucide-react";
import * as Icons from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const API_BASE_URL = "https://viewlessly-unadjoining-lashanda.ngrok-free.dev/api/v1";

interface Profissional {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  foto_url?: string;
  registro_profissional?: string;
  status: string;
  especialidades?: Array<{
    id: string;
    principal: boolean;
    especialidade: {
      id: string;
      nome: string;
      icone: string;
      cor: string;
    };
  }>;
}

export default function Profissionais() {
  const navigate = useNavigate();
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchProfissionais();
  }, []);

  const fetchProfissionais = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/profissionais`, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      const result = await response.json();
      if (result.success) {
        setProfissionais(result.data || []);
      }
    } catch (error) {
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar os profissionais",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/profissionais/${selectedId}`, {
        method: "DELETE",
        headers: { "ngrok-skip-browser-warning": "true" },
      });

      if (!response.ok) throw new Error("Erro ao excluir");

      toast({
        title: "Profissional excluído",
        description: "Profissional removido com sucesso",
      });

      fetchProfissionais();
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o profissional",
        variant: "destructive",
      });
    } finally {
      setDeleteOpen(false);
      setSelectedId(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Profissionais">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Profissionais">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">👨‍⚕️ Profissionais</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie sua equipe de profissionais
            </p>
          </div>
          <Button onClick={() => navigate("/profissionais/novo")}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Profissional
          </Button>
        </div>

        {profissionais.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserCog className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Nenhum profissional cadastrado</p>
              <p className="text-muted-foreground mb-4">
                Comece adicionando o primeiro profissional da sua equipe
              </p>
              <Button onClick={() => navigate("/profissionais/novo")}>
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar primeiro profissional
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profissionais.map((prof) => (
              <Card key={prof.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      {prof.foto_url ? (
                        <img
                          src={prof.foto_url}
                          alt={prof.nome}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                          <UserCog className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div
                        className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                          prof.status === "ativo" ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                    </div>

                    <div className="flex-1">
                      <CardTitle className="text-lg">{prof.nome}</CardTitle>
                      {prof.registro_profissional && (
                        <p className="text-sm text-muted-foreground">
                          {prof.registro_profissional}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {prof.especialidades && prof.especialidades.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {prof.especialidades.map((esp) => {
                        const Icon = (Icons as any)[esp.especialidade.icone] || Icons.Star;
                        return (
                          <Badge
                            key={esp.id}
                            variant={esp.principal ? "default" : "secondary"}
                            className="flex items-center gap-1"
                            style={
                              esp.principal
                                ? {
                                    backgroundColor: `${esp.especialidade.cor}20`,
                                    color: esp.especialidade.cor,
                                    borderColor: esp.especialidade.cor,
                                  }
                                : {}
                            }
                          >
                            <Icon className="h-3 w-3" />
                            {esp.especialidade.nome}
                            {esp.principal && " ⭐"}
                          </Badge>
                        );
                      })}
                    </div>
                  )}

                  <div className="space-y-2 text-sm">
                    {prof.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{prof.email}</span>
                      </div>
                    )}
                    {prof.telefone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {prof.telefone}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/profissionais/${prof.id}/editar`)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedId(prof.id);
                        setDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este profissional? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
