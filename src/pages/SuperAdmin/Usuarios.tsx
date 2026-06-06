import { useState, useEffect, useRef } from 'react';
import {
  Users, UserCog, Eye, Pencil, KeyRound, LogIn, ArrowLeft, Plus,
  Loader2, Building2, Shield, Lock, User, Info, AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type View = 'lista' | 'cadastro';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  cliente_id: number;
  empresa_id: number;
  ultimo_login?: string;
  created_at: string;
}

interface ClienteBasico {
  Cliente_ID: number;
  nome: string;
  nome_fantasia?: string;
}

interface EmpresaBasica {
  id: number;
  nome_fantasia: string;
  cliente_id: number;
}

export default function Usuarios() {
  const { toast } = useToast();
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Views
  const [view, setView] = useState<View>('lista');

  // Lista de usuários
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [clientes, setClientes] = useState<ClienteBasico[]>([]);
  const [empresasFiltradas, setEmpresasFiltradas] = useState<EmpresaBasica[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('todos');
  const [clienteFilter, setClienteFilter] = useState<number>(0);
  const [empresaFilter, setEmpresaFilter] = useState<number>(0);
  const [empresasParaFiltro, setEmpresasParaFiltro] = useState<EmpresaBasica[]>([]);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);

  // Form
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmar_senha: '',
    cliente_id: 0,
    empresa_id: 0,
    role: 'admin',
    ativo: true,
  });

  // Reset senha dialog
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [usuarioResetando, setUsuarioResetando] = useState<Usuario | null>(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmNovaSenha, setConfirmNovaSenha] = useState('');
  const [resetando, setResetando] = useState(false);

  // Impersonate dialog
  const [showImpersonateDialog, setShowImpersonateDialog] = useState(false);
  const [usuarioImpersonating, setUsuarioImpersonating] = useState<Usuario | null>(null);
  const [impersonating, setImpersonating] = useState(false);

  // Helpers
  const formatDate = (date: string | null): string => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getRoleColor = (role: string): string => {
    const colors: Record<string, string> = {
      admin: 'bg-indigo-100 text-indigo-700',
      manager: 'bg-violet-100 text-violet-700',
      viewer: 'bg-slate-100 text-slate-700',
    };
    return colors[role] || 'bg-slate-100 text-slate-700';
  };

  const getRoleLabel = (role: string): string => {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      manager: 'Gerente',
      viewer: 'Visualizador',
    };
    return labels[role] || role;
  };

  const getAvatarColor = (role: string): string => {
    const colors: Record<string, string> = {
      admin: 'bg-indigo-500',
      manager: 'bg-violet-500',
      viewer: 'bg-slate-400',
    };
    return colors[role] || 'bg-slate-400';
  };

  const getInitials = (nome: string): string => {
    const parts = nome.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nome.substring(0, 2).toUpperCase();
  };

  // API calls
  const fetchUsuarios = async (
    s = search,
    role = roleFilter,
    clienteId = clienteFilter,
    empresaId = empresaFilter
  ) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (s) params.append('search', s);
      if (role !== 'todos') params.append('role', role);
      if (clienteId > 0) params.append('cliente_id', String(clienteId));
      if (empresaId > 0) params.append('empresa_id', String(empresaId));
      const response = await api.get(`/superadmin/usuarios?${params.toString()}`);
      setUsuarios(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários.',
        variant: 'destructive',
      });
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientes = async () => {
    try {
      const response = await api.get('/superadmin/clientes');
      setClientes(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os clientes.',
        variant: 'destructive',
      });
      setClientes([]);
    }
  };

  const fetchEmpresasDoCliente = async (clienteId: number) => {
    if (!clienteId) {
      setEmpresasFiltradas([]);
      return;
    }
    try {
      const response = await api.get(
        `/superadmin/clientes/${clienteId}/empresas`
      );
      setEmpresasFiltradas(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as empresas do cliente.',
        variant: 'destructive',
      });
      setEmpresasFiltradas([]);
    }
  };

  // Event handlers
  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      fetchUsuarios(value, roleFilter, clienteFilter, empresaFilter);
    }, 300);
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    fetchUsuarios(search, value, clienteFilter, empresaFilter);
  };

  const handleClienteFilterChange = async (value: string) => {
    const clienteId = value === 'todos' ? 0 : Number(value);
    setClienteFilter(clienteId);
    setEmpresaFilter(0);
    setEmpresasParaFiltro([]);

    if (clienteId > 0) {
      try {
        const res = await api.get(`/superadmin/clientes/${clienteId}/empresas`);
        setEmpresasParaFiltro(Array.isArray(res.data) ? res.data : []);
      } catch {
        setEmpresasParaFiltro([]);
      }
    }

    fetchUsuarios(search, roleFilter, clienteId, 0);
  };

  const handleEmpresaFilterChange = (value: string) => {
    const empresaId = value === 'todos' ? 0 : Number(value);
    setEmpresaFilter(empresaId);
    fetchUsuarios(search, roleFilter, clienteFilter, empresaId);
  };

  const handleClienteChange = (clienteId: string) => {
    const id = parseInt(clienteId);
    setFormData({ ...formData, cliente_id: id, empresa_id: 0 });
    fetchEmpresasDoCliente(id);
  };

  const handleNovoUsuario = () => {
    setUsuarioEditando(null);
    setFormData({
      nome: '',
      email: '',
      senha: '',
      confirmar_senha: '',
      cliente_id: 0,
      empresa_id: 0,
      role: 'admin',
      ativo: true,
    });
    setEmpresasFiltradas([]);
    setView('cadastro');
  };

  const handleEditarUsuario = (usuario: Usuario) => {
    setUsuarioEditando(usuario);
    setFormData({
      nome: usuario.nome,
      email: usuario.email,
      senha: '',
      confirmar_senha: '',
      cliente_id: usuario.cliente_id,
      empresa_id: usuario.empresa_id,
      role: usuario.role,
      ativo: usuario.ativo,
    });
    fetchEmpresasDoCliente(usuario.cliente_id);
    setView('cadastro');
  };

  const handleSalvarUsuario = async () => {
    // Validações
    if (!formData.nome.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.email.trim()) {
      toast({
        title: 'Erro',
        description: 'Email é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.cliente_id === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione um cliente.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.empresa_id === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione uma empresa.',
        variant: 'destructive',
      });
      return;
    }

    // Validação de senha (obrigatória só para novo usuário)
    if (!usuarioEditando) {
      if (!formData.senha.trim()) {
        toast({
          title: 'Erro',
          description: 'Senha é obrigatória.',
          variant: 'destructive',
        });
        return;
      }

      if (formData.senha.length < 8) {
        toast({
          title: 'Erro',
          description: 'A senha deve ter no mínimo 8 caracteres.',
          variant: 'destructive',
        });
        return;
      }

      if (formData.senha !== formData.confirmar_senha) {
        toast({
          title: 'Erro',
          description: 'As senhas não conferem.',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      setSalvando(true);

      if (!usuarioEditando) {
        // Novo usuário
        const payload = {
          nome: formData.nome,
          email: formData.email,
          senha: formData.senha,
          cliente_id: formData.cliente_id,
          empresa_id: formData.empresa_id,
          role: formData.role,
        };
        await api.post('/superadmin/usuarios', payload);
        toast({
          title: 'Sucesso',
          description: 'Usuário criado com sucesso.',
        });
      } else {
        // Editar usuário
        const payload: Record<string, any> = {
          nome: formData.nome,
          email: formData.email,
          cliente_id: formData.cliente_id,
          empresa_id: formData.empresa_id,
          role: formData.role,
          ativo: formData.ativo,
        };
        await api.patch(`/superadmin/usuarios/${usuarioEditando.id}`, payload);
        toast({
          title: 'Sucesso',
          description: 'Usuário atualizado com sucesso.',
        });
      }

      setView('lista');
      try {
        await fetchUsuarios();
      } catch {
        // Erro no refetch não impede o sucesso do cadastro/edição
      }
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o usuário.',
        variant: 'destructive',
      });
    } finally {
      setSalvando(false);
    }
  };

  const handleResetarSenha = async () => {
    if (!novaSenha.trim()) {
      toast({
        title: 'Erro',
        description: 'Nova senha é obrigatória.',
        variant: 'destructive',
      });
      return;
    }

    if (novaSenha.length < 8) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter no mínimo 8 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    if (novaSenha !== confirmNovaSenha) {
      toast({
        title: 'Erro',
        description: 'As senhas não conferem.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setResetando(true);
      await api.post(`/superadmin/usuarios/${usuarioResetando?.id}/resetar-senha`, {
        nova_senha: novaSenha,
      });
      toast({
        title: 'Sucesso',
        description: `Senha de ${usuarioResetando?.nome} alterada com sucesso.`,
      });
      setShowResetDialog(false);
      setNovaSenha('');
      setConfirmNovaSenha('');
      setUsuarioResetando(null);
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível resetar a senha.',
        variant: 'destructive',
      });
    } finally {
      setResetando(false);
    }
  };

  const handleImpersonate = async () => {
    try {
      setImpersonating(true);
      const response = await api.post(
        `/superadmin/impersonate/${usuarioImpersonating?.id}`
      );
      localStorage.setItem('token', response.data.token);
      toast({
        title: 'Sucesso',
        description: `Sessão iniciada como ${usuarioImpersonating?.nome}. Token expira em 1h.`,
      });
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (error) {
      console.error('Erro ao impersonate:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível acessar como este usuário.',
        variant: 'destructive',
      });
    } finally {
      setImpersonating(false);
    }
  };

  // Mount
  useEffect(() => {
    fetchUsuarios();
    fetchClientes();
  }, []);

  // RENDER VIEW LISTA
  if (view === 'lista') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Usuários</h1>
          <p className="text-slate-600 mt-1">Gerencie os usuários da plataforma</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-3 items-end">
          <div className="flex-1">
            <Label htmlFor="search" className="mb-2 block">Buscar usuário</Label>
            <Input
              id="search"
              placeholder="Nome ou email..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="h-10"
            />
          </div>

          <div className="w-full md:w-48">
            <Label htmlFor="role" className="mb-2 block">Filtrar por role</Label>
            <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
              <SelectTrigger id="role" className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="manager">Gerente</SelectItem>
                <SelectItem value="viewer">Visualizador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-48">
            <Label htmlFor="cliente-filter" className="mb-2 block">Filtrar por cliente</Label>
            <Select
              value={clienteFilter === 0 ? 'todos' : String(clienteFilter)}
              onValueChange={handleClienteFilterChange}
            >
              <SelectTrigger id="cliente-filter" className="h-10">
                <SelectValue placeholder="Todos os clientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os clientes</SelectItem>
                {clientes.map((c) => (
                  <SelectItem key={c.Cliente_ID} value={String(c.Cliente_ID)}>
                    {c.nome_fantasia || c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {clienteFilter > 0 && (
            <div className="w-full md:w-48">
              <Label htmlFor="empresa-filter" className="mb-2 block">Filtrar por empresa</Label>
              <Select
                value={empresaFilter === 0 ? 'todos' : String(empresaFilter)}
                onValueChange={handleEmpresaFilterChange}
              >
                <SelectTrigger id="empresa-filter" className="h-10">
                  <SelectValue placeholder="Todas as empresas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as empresas</SelectItem>
                  {empresasParaFiltro.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.nome_fantasia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            onClick={handleNovoUsuario}
            className="gap-2 h-10"
          >
            <Plus className="h-4 w-4" />
            Novo Usuário
          </Button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-slate-200">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <Skeleton className="w-16 h-6 rounded" />
                  </div>
                  <Skeleton className="w-full h-6 rounded" />
                  <Skeleton className="w-3/4 h-4 rounded" />
                  <Skeleton className="w-24 h-6 rounded" />
                  <Skeleton className="w-full h-4 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : usuarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-16 w-16 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Nenhum usuário encontrado</h3>
            <p className="text-slate-600">Crie um novo usuário para começar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {usuarios.map((usuario) => (
              <Card
                key={usuario.id}
                className="hover:shadow-lg transition-all border-2 hover:border-primary/50 border-slate-200"
              >
                <CardContent className="pt-6">
                  {/* Avatar + Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg ${getAvatarColor(
                        usuario.role
                      )}`}
                    >
                      {getInitials(usuario.nome)}
                    </div>
                    <Badge
                      className={
                        usuario.ativo
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }
                    >
                      {usuario.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  {/* Nome e Email */}
                  <h3 className="font-semibold text-lg text-slate-900 mb-1">
                    {usuario.nome}
                  </h3>
                  <p className="text-sm text-slate-500 mb-3">{usuario.email}</p>

                  {/* Role badge */}
                  <Badge className={getRoleColor(usuario.role) + ' mb-3'}>
                    {getRoleLabel(usuario.role)}
                  </Badge>

                  {/* Último login */}
                  <div className="text-xs text-slate-500 mb-4">
                    Último login: {formatDate(usuario.ultimo_login || null)}
                  </div>

                  {/* Botões */}
                  <div className="flex gap-2 pt-3 border-t border-slate-200">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditarUsuario(usuario)}
                      className="flex-1"
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setUsuarioResetando(usuario);
                        setShowResetDialog(true);
                      }}
                    >
                      <KeyRound className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setUsuarioImpersonating(usuario);
                        setShowImpersonateDialog(true);
                      }}
                    >
                      <LogIn className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog Reset Senha */}
        <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                Resetar senha de {usuarioResetando?.nome}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="novaSenha">Nova Senha *</Label>
                <Input
                  id="novaSenha"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmNovaSenha">Confirmar Nova Senha *</Label>
                <Input
                  id="confirmNovaSenha"
                  type="password"
                  placeholder="Confirme a senha"
                  value={confirmNovaSenha}
                  onChange={(e) => setConfirmNovaSenha(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setShowResetDialog(false);
                  setNovaSenha('');
                  setConfirmNovaSenha('');
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleResetarSenha}
                disabled={resetando}
                className="gap-2"
              >
                {resetando && <Loader2 className="h-4 w-4 animate-spin" />}
                Resetar Senha
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Impersonate */}
        <Dialog open={showImpersonateDialog} onOpenChange={setShowImpersonateDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Acessar como usuário</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <p className="text-sm text-slate-700">
                Você vai entrar na plataforma como{' '}
                <span className="font-semibold">{usuarioImpersonating?.nome}</span> (
                {usuarioImpersonating?.email}). O acesso expira automaticamente em 1 hora.
              </p>

              <div className="flex gap-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  Esta ação é registrada no audit log.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setShowImpersonateDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleImpersonate}
                disabled={impersonating}
                className="gap-2 bg-red-600 hover:bg-red-700"
              >
                {impersonating && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirmar Acesso
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // RENDER VIEW CADASTRO
  return (
    <div className="space-y-6">
      {/* Breadcrumb + Voltar */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">
          <a
            onClick={() => setView('lista')}
            className="cursor-pointer hover:text-primary transition"
          >
            Usuários
          </a>
          {' '} → {' '}
          {usuarioEditando ? (
            <>
              {usuarioEditando.nome} → <span>Editar</span>
            </>
          ) : (
            <span>Novo Usuário</span>
          )}
        </div>
        <Button
          variant="ghost"
          onClick={() => setView('lista')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>

      {/* Seções */}
      <div className="space-y-6">
        {/* SEÇÃO 1: Dados Pessoais */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-blue-500" />
              Dados Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="nome" className="mb-2 block">
                Nome Completo *
              </Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                placeholder="Ex: Maria Silva"
              />
            </div>

            <div>
              <Label htmlFor="email" className="mb-2 block">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Ex: maria@empresa.com"
              />
            </div>

            {usuarioEditando && (
              <div className="flex items-center justify-between">
                <Label htmlFor="ativo" className="flex items-center gap-2 cursor-pointer">
                  <span>Status: Ativo</span>
                </Label>
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, ativo: checked })
                  }
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* SEÇÃO 2: Senha */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="h-5 w-5 text-amber-500" />
              Senha
            </CardTitle>
          </CardHeader>
          <CardContent>
            {usuarioEditando ? (
              <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  Para alterar a senha deste usuário, use o botão 'Resetar Senha'
                  na lista de usuários.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="senha" className="mb-2 block">
                    Nova Senha *
                  </Label>
                  <Input
                    id="senha"
                    type="password"
                    value={formData.senha}
                    onChange={(e) =>
                      setFormData({ ...formData, senha: e.target.value })
                    }
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>

                <div>
                  <Label htmlFor="confirmar_senha" className="mb-2 block">
                    Confirmar Senha *
                  </Label>
                  <Input
                    id="confirmar_senha"
                    type="password"
                    value={formData.confirmar_senha}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmar_senha: e.target.value,
                      })
                    }
                    placeholder="Confirme a senha"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SEÇÃO 3: Vínculo */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-green-500" />
              Vínculo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cliente" className="mb-2 block">
                Cliente *
              </Label>
              <Select
                value={formData.cliente_id.toString()}
                onValueChange={handleClienteChange}
              >
                <SelectTrigger id="cliente">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem
                      key={cliente.Cliente_ID}
                      value={cliente.Cliente_ID.toString()}
                    >
                      {cliente.nome_fantasia || cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="empresa" className="mb-2 block">
                Empresa *
              </Label>
              <Select
                value={formData.empresa_id.toString()}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    empresa_id: parseInt(value),
                  })
                }
                disabled={formData.cliente_id === 0}
              >
                <SelectTrigger id="empresa">
                  <SelectValue
                    placeholder={
                      formData.cliente_id === 0
                        ? 'Selecione primeiro o cliente'
                        : 'Selecione uma empresa'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {empresasFiltradas.map((empresa) => (
                    <SelectItem key={empresa.id} value={empresa.id.toString()}>
                      {empresa.nome_fantasia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO 4: Permissões */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-violet-500" />
              Permissões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Admin */}
              <div
                onClick={() => setFormData({ ...formData, role: 'admin' })}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.role === 'admin'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <UserCog className="h-6 w-6 text-indigo-600 mb-2" />
                <h4 className="font-semibold text-slate-900 mb-1">
                  Administrador
                </h4>
                <p className="text-sm text-slate-600">
                  Acesso completo a todas as funcionalidades
                </p>
              </div>

              {/* Manager */}
              <div
                onClick={() => setFormData({ ...formData, role: 'manager' })}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.role === 'manager'
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Users className="h-6 w-6 text-violet-600 mb-2" />
                <h4 className="font-semibold text-slate-900 mb-1">
                  Gerente
                </h4>
                <p className="text-sm text-slate-600">
                  Gerencia atendimentos e relatórios
                </p>
              </div>

              {/* Viewer */}
              <div
                onClick={() => setFormData({ ...formData, role: 'viewer' })}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.role === 'viewer'
                    ? 'border-slate-500 bg-slate-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Eye className="h-6 w-6 text-slate-600 mb-2" />
                <h4 className="font-semibold text-slate-900 mb-1">
                  Visualizador
                </h4>
                <p className="text-sm text-slate-600">
                  Apenas visualização, sem edições
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botões */}
      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          onClick={() => setView('lista')}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSalvarUsuario}
          disabled={salvando}
          className="gap-2"
        >
          {salvando && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar Usuário
        </Button>
      </div>
    </div>
  );
}
