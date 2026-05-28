import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, Edit, Trash2, Loader2, Phone, Mail, UserCog, MoreVertical,
  KeyRound, ShieldOff, ShieldCheck, Copy
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api from '@/lib/api';
import { DarAcessoModal } from "@/components/profissionais/DarAcessoModal";

interface Profissional {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  foto_url?: string;
  registro_profissional?: string;
  status: string;
  pode_receber_conversas?: boolean;
  is_default?: boolean;
  is_ai_agent?: boolean;
  usuario_id?: string | null;
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
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [darAcessoProfissional, setDarAcessoProfissional] =
    useState<Profissional | null>(null);
  const [revogarProfissional, setRevogarProfissional] =
    useState<Profissional | null>(null);
  const [resetSenhaProfissional, setResetSenhaProfissional] =
    useState<Profissional | null>(null);
  const [novaSenhaTemp, setNovaSenhaTemp] = useState<string | null>(null);

  useEffect(() => {
    fetchProfissionais();
  }, []);

  const fetchProfissionais = async () => {
    try {
      setLoading(true);
      const response = await api.get('/profissionais');
      setProfissionais(response.data || []);
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

  const handleToggleWhatsApp = async (id: string, value: boolean) => {
    setUpdatingId(id);
    try {
      await api.patch(`/profissionais/${id}`, { pode_receber_conversas: value });
      toast({
        title: value
          ? "Habilitado para WhatsApp"
          : "Desabilitado para WhatsApp",
      });
      setProfissionais((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, pode_receber_conversas: value } : p,
        ),
      );
    } catch {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRevogarAcesso = async () => {
    if (!revogarProfissional?.usuario_id) return;
    try {
      await api.patch(`/usuarios/${revogarProfissional.usuario_id}/status`, {
        ativo: false,
      });
      toast({ title: "Acesso revogado" });
      fetchProfissionais();
    } catch {
      toast({ title: "Erro ao revogar acesso", variant: "destructive" });
    } finally {
      setRevogarProfissional(null);
    }
  };

  const handleResetSenha = async () => {
    if (!resetSenhaProfissional?.usuario_id) return;
    const novaSenha = Math.random().toString(36).slice(-10);
    try {
      await api.post(
        `/usuarios/${resetSenhaProfissional.usuario_id}/resetar-senha`,
        { nova_senha: novaSenha },
      );
      setNovaSenhaTemp(novaSenha);
    } catch {
      toast({ title: "Erro ao resetar senha", variant: "destructive" });
    } finally {
      setResetSenhaProfissional(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;

    try {
      await api.delete(`/profissionais/${selectedId}`);

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

  const profissionaisVisiveis = profissionais.filter(
    (p) => !p.is_default && !p.is_ai_agent,
  );

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

        {profissionaisVisiveis.length === 0 ? (
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
            {profissionaisVisiveis.map((prof) => (
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

                    {prof.usuario_id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setResetSenhaProfissional(prof)}
                          >
                            <KeyRound className="h-4 w-4 mr-2" />
                            Resetar senha
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setRevogarProfissional(prof)}
                            className="text-destructive focus:text-destructive"
                          >
                            <ShieldOff className="h-4 w-4 mr-2" />
                            Revogar acesso
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
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

                  <div className="flex items-center justify-between pt-2 border-t">
                    <Label
                      htmlFor={`whatsapp-${prof.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      Atende WhatsApp
                    </Label>
                    <Switch
                      id={`whatsapp-${prof.id}`}
                      checked={!!prof.pode_receber_conversas}
                      disabled={updatingId === prof.id}
                      onCheckedChange={(checked) =>
                        handleToggleWhatsApp(prof.id, checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">
                      Acesso ao sistema
                    </span>
                    {prof.usuario_id ? (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200 gap-1"
                      >
                        <ShieldCheck className="h-3 w-3" />
                        Com acesso
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDarAcessoProfissional(prof)}
                      >
                        Dar acesso
                      </Button>
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

      <DarAcessoModal
        open={!!darAcessoProfissional}
        onOpenChange={(o) => !o && setDarAcessoProfissional(null)}
        profissional={darAcessoProfissional}
        onSuccess={fetchProfissionais}
      />

      <AlertDialog
        open={!!revogarProfissional}
        onOpenChange={(o) => !o && setRevogarProfissional(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar acesso</AlertDialogTitle>
            <AlertDialogDescription>
              {revogarProfissional?.nome} não poderá mais acessar o sistema.
              Esta ação pode ser revertida posteriormente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevogarAcesso}>
              Revogar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!resetSenhaProfissional}
        onOpenChange={(o) => !o && setResetSenhaProfissional(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetar senha</AlertDialogTitle>
            <AlertDialogDescription>
              Uma nova senha temporária será gerada para{" "}
              {resetSenhaProfissional?.nome}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetSenha}>
              Resetar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!novaSenhaTemp}
        onOpenChange={(o) => !o && setNovaSenhaTemp(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Senha temporária gerada</DialogTitle>
            <DialogDescription>
              Compartilhe esta senha com o profissional. Ele deverá alterá-la no
              primeiro acesso.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted font-mono text-sm">
            <span className="flex-1 break-all">{novaSenhaTemp}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (novaSenhaTemp) {
                  navigator.clipboard.writeText(novaSenhaTemp);
                  toast({ title: "Senha copiada" });
                }
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setNovaSenhaTemp(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
