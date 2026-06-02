import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  KeyRound,
  MoreVertical,
  Copy,
  Users,
  Shield,
  UserCheck,
  UserX,
  Search,
  LayoutGrid,
  List,
  Table,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: 'admin' | 'gestor' | 'atendente';
  ativo: boolean;
  created_at: string;
  ultimo_acesso?: string | null;
}

type ViewMode = 'grid' | 'list' | 'table';

const ROLE_CONFIG = {
  admin: { label: 'Admin', emoji: '👑', className: 'bg-purple-100 text-purple-800 border-purple-200' },
  gestor: { label: 'Gestor', emoji: '🎯', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  atendente: { label: 'Atendente', emoji: '👤', className: 'bg-gray-100 text-gray-800 border-gray-200' },
};

export default function Usuarios() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Data
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & View
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('todos');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Modal criar/editar
  const [modalOpen, setModalOpen] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [formData, setFormData] = useState({ nome: '', email: '', senha: '', role: 'atendente' as const });

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Reset senha
  const [resetSenhaOpen, setResetSenhaOpen] = useState(false);
  const [resetSenhaId, setResetSenhaId] = useState<string | null>(null);
  const [novaSenhaTemp, setNovaSenhaTemp] = useState<string | null>(null);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const response = await api.get('/usuarios');
      setUsuarios(response.data || []);
    } catch {
      toast({ title: 'Erro ao carregar usuários', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const stats = useMemo(() => ({
    total: usuarios.length,
    admins: usuarios.filter(u => u.role === 'admin').length,
    gestores: usuarios.filter(u => u.role === 'gestor').length,
    atendentes: usuarios.filter(u => u.role === 'atendente').length,
    ativos: usuarios.filter(u => u.ativo).length,
  }), [usuarios]);

  // Filtered list
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(u => {
      const matchSearch = !searchTerm ||
        u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = filterRole === 'todos' || u.role === filterRole;
      const matchStatus = filterStatus === 'todos' ||
        (filterStatus === 'ativo' && u.ativo) ||
        (filterStatus === 'inativo' && !u.ativo);
      return matchSearch && matchRole && matchStatus;
    });
  }, [usuarios, searchTerm, filterRole, filterStatus]);

  const handleAbrirCriar = () => {
    setUsuarioEditando(null);
    setFormData({ nome: '', email: '', senha: '', role: 'atendente' });
    setModalOpen(true);
  };

  const handleAbrirEditar = (u: Usuario) => {
    setUsuarioEditando(u);
    setFormData({ nome: u.nome, email: u.email, senha: '', role: u.role });
    setModalOpen(true);
  };

  const handleSalvar = async () => {
    if (!formData.nome.trim() || !formData.role) return;
    if (!usuarioEditando && (!formData.email.trim() || !formData.senha.trim())) return;

    setSalvando(true);
    try {
      if (usuarioEditando) {
        await api.patch(`/usuarios/${usuarioEditando.id}`, {
          nome: formData.nome,
          role: formData.role,
        });
        toast({ title: 'Usuário atualizado com sucesso' });
      } else {
        await api.post('/usuarios', {
          nome: formData.nome,
          email: formData.email,
          senha: formData.senha,
          role: formData.role,
        });
        toast({ title: 'Usuário criado com sucesso' });
      }
      setModalOpen(false);
      fetchUsuarios();
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar',
        description: err?.response?.data?.error || 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setSalvando(false);
    }
  };

  const handleToggleStatus = async (id: string, ativo: boolean) => {
    try {
      await api.patch(`/usuarios/${id}/status`, { ativo });
      setUsuarios(prev => prev.map(u => u.id === id ? { ...u, ativo } : u));
      toast({ title: ativo ? 'Usuário ativado' : 'Usuário desativado' });
    } catch {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' });
    }
  };

  const handleResetSenha = async () => {
    if (!resetSenhaId) return;
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const novaSenha = Array.from({ length: 12 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
    try {
      await api.post(`/usuarios/${resetSenhaId}/resetar-senha`, { nova_senha: novaSenha });
      setNovaSenhaTemp(novaSenha);
      toast({ title: 'Senha resetada com sucesso' });
    } catch {
      toast({ title: 'Erro ao resetar senha', variant: 'destructive' });
    } finally {
      setResetSenhaOpen(false);
      setResetSenhaId(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      await api.delete(`/usuarios/${selectedId}`);
      toast({ title: 'Usuário excluído' });
      fetchUsuarios();
    } catch {
      toast({ title: 'Erro ao excluir', variant: 'destructive' });
    } finally {
      setDeleteOpen(false);
      setSelectedId(null);
    }
  };

  const renderAvatar = (nome: string, size = 'md') => {
    const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm' };
    return (
      <div className={`${sizes[size as keyof typeof sizes]} rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0`}>
        <span className="font-semibold text-primary">
          {nome.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  };

  const renderRoleBadge = (role: string) => {
    const config = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.atendente;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
        {config.emoji} {config.label}
      </span>
    );
  };

  const renderMenu = (u: Usuario) => {
    if (!isAdmin) return null;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleAbrirEditar(u)}>
            <Edit className="h-4 w-4 mr-2" /> Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setResetSenhaId(u.id); setResetSenhaOpen(true); }}>
            <KeyRound className="h-4 w-4 mr-2" /> Resetar Senha
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            disabled={u.id === user?.id}
            onClick={() => { setSelectedId(u.id); setDeleteOpen(true); }}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  if (loading) {
    return (
      <DashboardLayout title="Usuários">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Usuários">
      <div className="p-8 space-y-6 animate-fade-in">

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Usuários</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Admins</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.admins}</p>
                </div>
                <Shield className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gestores</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.gestores}</p>
                </div>
                <UserCheck className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Atendentes</p>
                  <p className="text-3xl font-bold text-gray-600">{stats.atendentes}</p>
                </div>
                <UserX className="h-8 w-8 text-gray-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros + Toggle + Botão */}
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
            {/* Busca */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            {/* Filtro Role */}
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Todos os perfis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os perfis</SelectItem>
                <SelectItem value="admin">👑 Admin</SelectItem>
                <SelectItem value="gestor">🎯 Gestor</SelectItem>
                <SelectItem value="atendente">👤 Atendente</SelectItem>
              </SelectContent>
            </Select>
            {/* Filtro Status */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="ativo">✅ Ativos</SelectItem>
                <SelectItem value="inativo">❌ Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            {/* Toggle visualização */}
            <div className="flex gap-1 bg-muted p-1 rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 w-8 p-0"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-8 w-8 p-0"
              >
                <Table className="h-4 w-4" />
              </Button>
            </div>
            {isAdmin && (
              <Button onClick={handleAbrirCriar}>
                <Plus className="h-4 w-4 mr-2" /> Novo Usuário
              </Button>
            )}
          </div>
        </div>

        {/* Empty state */}
        {usuariosFiltrados.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">
              {usuarios.length === 0 ? 'Nenhum usuário encontrado' : 'Nenhum resultado para os filtros'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {usuarios.length === 0 ? 'Crie o primeiro usuário clicando em "Novo Usuário"' : 'Tente ajustar os filtros de busca'}
            </p>
          </div>
        )}

        {/* GRID VIEW */}
        {viewMode === 'grid' && usuariosFiltrados.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {usuariosFiltrados.map(u => (
              <Card key={u.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {renderAvatar(u.nome)}
                      <div>
                        <CardTitle className="text-base leading-tight">{u.nome}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">{u.email}</p>
                      </div>
                    </div>
                    {renderMenu(u)}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    {renderRoleBadge(u.role)}
                    {isAdmin ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {u.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                        <Switch
                          checked={u.ativo}
                          disabled={u.id === user?.id}
                          onCheckedChange={val => handleToggleStatus(u.id, val)}
                        />
                      </div>
                    ) : (
                      <Badge variant={u.ativo ? 'default' : 'secondary'}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* LIST VIEW */}
        {viewMode === 'list' && usuariosFiltrados.length > 0 && (
          <div className="space-y-2">
            {usuariosFiltrados.map(u => (
              <div
                key={u.id}
                className="flex items-center justify-between p-4 bg-card border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {renderAvatar(u.nome, 'sm')}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{u.nome}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <div className="hidden sm:block">{renderRoleBadge(u.role)}</div>
                  <Badge variant={u.ativo ? 'default' : 'secondary'} className="hidden md:flex">
                    {u.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  {isAdmin && (
                    <Switch
                      checked={u.ativo}
                      disabled={u.id === user?.id}
                      onCheckedChange={val => handleToggleStatus(u.id, val)}
                    />
                  )}
                  {renderMenu(u)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TABLE VIEW */}
        {viewMode === 'table' && usuariosFiltrados.length > 0 && (
          <div className="bg-card rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Usuário</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Perfil</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Criado em</th>
                    {isAdmin && <th className="px-4 py-3 text-right text-sm font-semibold">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {usuariosFiltrados.map(u => (
                    <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {renderAvatar(u.nome, 'sm')}
                          <span className="text-sm font-medium">{u.nome}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3">{renderRoleBadge(u.role)}</td>
                      <td className="px-4 py-3">
                        {isAdmin ? (
                          <Switch
                            checked={u.ativo}
                            disabled={u.id === user?.id}
                            onCheckedChange={val => handleToggleStatus(u.id, val)}
                          />
                        ) : (
                          <Badge variant={u.ativo ? 'default' : 'secondary'}>
                            {u.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">{renderMenu(u)}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Criar/Editar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{usuarioEditando ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
            <DialogDescription>
              {usuarioEditando
                ? 'Atualize nome e perfil do usuário'
                : 'Preencha os dados para criar um novo acesso'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input
                value={formData.nome}
                onChange={e => setFormData(p => ({ ...p, nome: e.target.value }))}
                placeholder="Nome completo"
              />
            </div>
            {!usuarioEditando && (
              <>
                <div className="space-y-1.5">
                  <Label>E-mail *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Senha *</Label>
                  <Input
                    type="password"
                    value={formData.senha}
                    onChange={e => setFormData(p => ({ ...p, senha: e.target.value }))}
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label>Perfil de acesso *</Label>
              <Select
                value={formData.role}
                onValueChange={val => setFormData(p => ({ ...p, role: val as 'admin' | 'gestor' | 'atendente' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">👑 Admin — acesso total</SelectItem>
                  <SelectItem value="gestor">🎯 Gestor — visualiza tudo, edita parcial</SelectItem>
                  <SelectItem value="atendente">👤 Atendente — atendimento e conversas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} disabled={salvando}>
              {salvando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {usuarioEditando ? 'Salvar Alterações' : 'Criar Usuário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog Resetar Senha */}
      <AlertDialog open={resetSenhaOpen} onOpenChange={setResetSenhaOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetar Senha</AlertDialogTitle>
            <AlertDialogDescription>
              Uma nova senha segura será gerada automaticamente.
              Anote e compartilhe com o usuário — ela não será exibida novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetSenha}>
              Gerar Nova Senha
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog exibir senha gerada */}
      {novaSenhaTemp && (
        <Dialog open={!!novaSenhaTemp} onOpenChange={() => setNovaSenhaTemp(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>✅ Senha Resetada</DialogTitle>
              <DialogDescription>
                Compartilhe esta senha com o usuário. Ela não será exibida novamente.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <code className="flex-1 text-lg font-mono font-bold tracking-widest">
                {novaSenhaTemp}
              </code>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(novaSenhaTemp);
                  toast({ title: '✅ Copiado para a área de transferência' });
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
      )}

      {/* AlertDialog Excluir */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O usuário perderá o acesso ao sistema imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
