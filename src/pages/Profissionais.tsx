import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Plus, Edit, Trash2, Phone, Mail, UserCog, MoreVertical,
  KeyRound, ShieldOff, ShieldCheck, Copy, Search, Users, UserCheck, MessageSquare
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

  const profissionaisVisiveis = profissionais.filter(
    (p) => !p.is_default && !p.is_ai_agent,
  );

  const [busca, setBusca] = useState('');

  const profissionaisFiltrados = useMemo(() => {
    if (!busca.trim()) return profissionaisVisiveis;
    const b = busca.toLowerCase();
    return profissionaisVisiveis.filter(p =>
      p.nome.toLowerCase().includes(b) ||
      p.email?.toLowerCase().includes(b) ||
      p.registro_profissional?.toLowerCase().includes(b)
    );
  }, [profissionaisVisiveis, busca]);

  return (
    <DashboardLayout title="Profissionais">
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .prof-card-anim { animation: fadeSlideIn 0.35s ease both; }
      `}</style>

      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Profissionais
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Gerencie sua equipe de profissionais e especialidades
            </p>
          </div>
          <Button onClick={() => navigate("/profissionais/novo")} className="rounded-lg shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Novo Profissional
          </Button>
        </div>

        {/* Stats cards */}
        {!loading && profissionaisVisiveis.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: 'Total',
                value: profissionaisVisiveis.length,
                icon: Users,
                color: '#6366F1',
              },
              {
                label: 'Ativos',
                value: profissionaisVisiveis.filter(p => p.status === 'ativo').length,
                icon: UserCheck,
                color: '#10B981',
              },
              {
                label: 'Atendem WhatsApp',
                value: profissionaisVisiveis.filter(p => p.pode_receber_conversas).length,
                icon: MessageSquare,
                color: '#3B82F6',
              },
            ].map(({ label, value, icon: Icon, color }, idx) => (
              <div
                key={label}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
                style={{ animation: 'fadeSlideIn 0.35s ease both', animationDelay: `${idx * 60}ms` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-500">{label}</p>
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${color}18` }}>
                    <Icon className="h-3.5 w-3.5" style={{ color }} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Busca */}
        {!loading && profissionaisVisiveis.length > 0 && (
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar profissional..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="pl-9 bg-white border-gray-200 rounded-lg"
            />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && profissionaisVisiveis.length === 0 && (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <UserCog className="h-7 w-7 text-primary" />
            </div>
            <h3 className="font-semibold text-gray-800 text-lg">
              Nenhum profissional cadastrado
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Comece adicionando o primeiro profissional da sua equipe
            </p>
            <Button
              onClick={() => navigate("/profissionais/novo")}
              className="mt-4 rounded-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar primeiro profissional
            </Button>
          </div>
        )}

        {/* Grid de cards */}
        {!loading && profissionaisFiltrados.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profissionaisFiltrados.map((prof, idx) => {
              const initials = prof.nome.trim().split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map(n => n[0])
                .join('')
                .toUpperCase();

              return (
                <div
                  key={prof.id}
                  className="prof-card-anim group relative bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  {/* Borda lateral: verde=ativo, cinza=inativo */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                    style={{ backgroundColor: prof.status === 'ativo' ? '#10B981' : '#D1D5DB' }}
                  />

                  <div className="pl-5 pr-4 pt-4 pb-3">

                    {/* Header do card: avatar + nome + menu */}
                    <div className="flex items-start gap-3 mb-3">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {prof.foto_url ? (
                          <img
                            src={prof.foto_url}
                            alt={prof.nome}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-sm"
                          />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ring-2 ring-white shadow-sm"
                            style={{
                              backgroundColor: prof.status === 'ativo' ? '#ECFDF5' : '#F3F4F6',
                              color: prof.status === 'ativo' ? '#059669' : '#6B7280',
                            }}
                          >
                            {initials || <UserCog className="h-5 w-5" />}
                          </div>
                        )}
                        {/* Indicador de status */}
                        <div
                          className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
                          style={{ backgroundColor: prof.status === 'ativo' ? '#10B981' : '#9CA3AF' }}
                        />
                      </div>

                      {/* Nome + registro */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-gray-900 truncate leading-tight">
                          {prof.nome}
                        </h3>
                        {prof.registro_profissional && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate">
                            {prof.registro_profissional}
                          </p>
                        )}
                        <span
                          className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            prof.status === 'ativo'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {prof.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>

                      {/* Menu dropdown */}
                      {prof.usuario_id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setResetSenhaProfissional(prof)}>
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

                    {/* Especialidades */}
                    {prof.especialidades && prof.especialidades.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {prof.especialidades.map(esp => {
                          const Icon = (Icons as any)[esp.especialidade.icone] || Icons.Star;
                          return (
                            <span
                              key={esp.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border"
                              style={{
                                backgroundColor: `${esp.especialidade.cor}15`,
                                color: esp.especialidade.cor,
                                borderColor: `${esp.especialidade.cor}30`,
                              }}
                            >
                              <Icon className="h-2.5 w-2.5" />
                              {esp.especialidade.nome}
                              {esp.principal && ' ⭐'}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Contato */}
                    <div className="space-y-1 mb-3">
                      {prof.email && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{prof.email}</span>
                        </div>
                      )}
                      {prof.telefone && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          <span>{prof.telefone}</span>
                        </div>
                      )}
                    </div>

                    {/* WhatsApp toggle */}
                    <div className="flex items-center justify-between py-2 border-t border-gray-50">
                      <span className="text-xs text-gray-500">Atende WhatsApp</span>
                      <Switch
                        checked={!!prof.pode_receber_conversas}
                        disabled={updatingId === prof.id}
                        onCheckedChange={v => handleToggleWhatsApp(prof.id, v)}
                      />
                    </div>

                    {/* Acesso ao sistema */}
                    <div className="flex items-center justify-between py-2 border-t border-gray-50">
                      <span className="text-xs text-gray-500">Acesso ao sistema</span>
                      {prof.usuario_id ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          <ShieldCheck className="h-2.5 w-2.5" />
                          Com acesso
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs px-2"
                          onClick={() => setDarAcessoProfissional(prof)}
                        >
                          Dar acesso
                        </Button>
                      )}
                    </div>

                    {/* Quick actions no hover */}
                    <div className="flex gap-2 pt-2 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7 text-xs"
                        onClick={() => navigate(`/profissionais/${prof.id}/editar`)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-red-50"
                        onClick={() => {
                          setSelectedId(prof.id);
                          setDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state filtro */}
        {!loading && profissionaisVisiveis.length > 0 && profissionaisFiltrados.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500 text-sm">
              Nenhum profissional encontrado para "<strong>{busca}</strong>"
            </p>
          </div>
        )}

      </div>

      {/* MODAIS EXISTENTES */}

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
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DarAcessoModal
        open={!!darAcessoProfissional}
        onOpenChange={(o) => !o && setDarAcessoProfissional(null)}
        profissional={darAcessoProfissional}
        onSuccess={fetchProfissionais}
      />

      <AlertDialog open={!!revogarProfissional} onOpenChange={(o) => !o && setRevogarProfissional(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar acesso</AlertDialogTitle>
            <AlertDialogDescription>
              {revogarProfissional?.nome} não poderá mais acessar o sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevogarAcesso}>Revogar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!resetSenhaProfissional} onOpenChange={(o) => !o && setResetSenhaProfissional(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetar senha</AlertDialogTitle>
            <AlertDialogDescription>
              Uma nova senha temporária será gerada para {resetSenhaProfissional?.nome}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetSenha}>Resetar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!novaSenhaTemp} onOpenChange={(o) => !o && setNovaSenhaTemp(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Senha temporária gerada</DialogTitle>
            <DialogDescription>
              Compartilhe esta senha com o profissional. Ele deverá alterá-la no primeiro acesso.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-muted font-mono text-sm">
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
