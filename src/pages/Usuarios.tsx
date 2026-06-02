import { useState, useEffect } from 'react';
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

export default function Usuarios() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resetSenhaOpen, setResetSenhaOpen] = useState(false);
  const [resetSenhaId, setResetSenhaId] = useState<string | null>(null);
  const [novaSenhaTemp, setNovaSenhaTemp] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    role: 'atendente' as 'admin' | 'gestor' | 'atendente',
  });

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const response = await api.get('/usuarios');
      setUsuarios(response.data || []);
    } catch (error) {
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar os usuários',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleSalvar = async () => {
    if (!formData.nome || !formData.email || !formData.role) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha nome, e-mail e perfil de acesso',
        variant: 'destructive',
      });
      return;
    }

    if (!usuarioEditando && !formData.senha) {
      toast({
        title: 'Senha obrigatória',
        description: 'Digite uma senha para o novo usuário',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSalvando(true);
      if (usuarioEditando) {
        await api.patch(`/usuarios/${usuarioEditando.id}`, {
          nome: formData.nome,
          role: formData.role,
        });
        toast({
          title: 'Sucesso',
          description: 'Usuário atualizado com sucesso',
        });
      } else {
        await api.post('/usuarios', {
          nome: formData.nome,
          email: formData.email,
          senha: formData.senha,
          role: formData.role,
        });
        toast({
          title: 'Sucesso',
          description: 'Usuário criado com sucesso',
        });
      }
      setModalOpen(false);
      setUsuarioEditando(null);
      setFormData({ nome: '', email: '', senha: '', role: 'atendente' });
      fetchUsuarios();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description:
          error.response?.data?.message ||
          'Erro ao salvar usuário',
        variant: 'destructive',
      });
    } finally {
      setSalvando(false);
    }
  };

  const handleToggleStatus = async (id: string, ativo: boolean) => {
    try {
      await api.patch(`/usuarios/${id}/status`, { ativo });
      setUsuarios(usuarios.map(u => (u.id === id ? { ...u, ativo } : u)));
      toast({
        title: 'Sucesso',
        description: ativo ? 'Usuário ativado' : 'Usuário desativado',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status do usuário',
        variant: 'destructive',
      });
    }
  };

  const handleResetSenha = async () => {
    if (!resetSenhaId) return;

    try {
      const novaSenha = generateRandomPassword();
      await api.post(`/usuarios/${resetSenhaId}/resetar-senha`, {
        nova_senha: novaSenha,
      });
      setNovaSenhaTemp(novaSenha);
      setResetSenhaOpen(false);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao resetar senha',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;

    try {
      await api.delete(`/usuarios/${selectedId}`);
      setUsuarios(usuarios.filter(u => u.id !== selectedId));
      setDeleteOpen(false);
      setSelectedId(null);
      toast({
        title: 'Sucesso',
        description: 'Usuário excluído com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir usuário',
        variant: 'destructive',
      });
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return '👑 Admin';
      case 'gestor':
        return '🎯 Gestor';
      case 'atendente':
        return '👤 Atendente';
      default:
        return role;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'gestor':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Usuários">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Usuários">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">👥 Usuários</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie os usuários com acesso ao sistema
            </p>
          </div>
          {user?.role === 'admin' && (
            <Button
              onClick={() => {
                setUsuarioEditando(null);
                setFormData({
                  nome: '',
                  email: '',
                  senha: '',
                  role: 'atendente',
                });
                setModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> Novo Usuário
            </Button>
          )}
        </div>

        {/* Grid de usuários */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {usuarios.map(usuario => (
            <Card key={usuario.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {usuario.nome.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {usuario.nome}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {usuario.email}
                      </p>
                    </div>
                  </div>
                  {user?.role === 'admin' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setUsuarioEditando(usuario);
                            setFormData({
                              nome: usuario.nome,
                              email: usuario.email,
                              senha: '',
                              role: usuario.role,
                            });
                            setModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setResetSenhaId(usuario.id);
                            setResetSenhaOpen(true);
                          }}
                        >
                          <KeyRound className="h-4 w-4 mr-2" /> Resetar
                          Senha
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setSelectedId(usuario.id);
                            setDeleteOpen(true);
                          }}
                          disabled={usuario.id === user?.id}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={getRoleBadgeVariant(usuario.role)}>
                      {getRoleLabel(usuario.role)}
                    </Badge>
                  </div>
                  {user?.role === 'admin' && (
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </Label>
                      <Switch
                        checked={usuario.ativo}
                        disabled={usuario.id === user?.id}
                        onCheckedChange={val =>
                          handleToggleStatus(usuario.id, val)
                        }
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {usuarios.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nenhum usuário criado ainda
            </p>
          </div>
        )}
      </div>

      {/* Modal Criar/Editar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {usuarioEditando ? 'Editar Usuário' : 'Novo Usuário'}
            </DialogTitle>
            <DialogDescription>
              {usuarioEditando
                ? 'Atualize os dados do usuário'
                : 'Preencha os dados para criar um novo acesso'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={formData.nome}
                onChange={e =>
                  setFormData(p => ({ ...p, nome: e.target.value }))
                }
                placeholder="Nome completo"
              />
            </div>
            {!usuarioEditando && (
              <div>
                <Label>E-mail *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={e =>
                    setFormData(p => ({ ...p, email: e.target.value }))
                  }
                  placeholder="email@exemplo.com"
                />
              </div>
            )}
            {!usuarioEditando && (
              <div>
                <Label>Senha *</Label>
                <Input
                  type="password"
                  value={formData.senha}
                  onChange={e =>
                    setFormData(p => ({ ...p, senha: e.target.value }))
                  }
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
            )}
            <div>
              <Label>Perfil de acesso *</Label>
              <Select
                value={formData.role}
                onValueChange={val =>
                  setFormData(p => ({
                    ...p,
                    role: val as 'admin' | 'gestor' | 'atendente',
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    👑 Admin — acesso total
                  </SelectItem>
                  <SelectItem value="gestor">
                    🎯 Gestor — visualiza tudo, edita parcial
                  </SelectItem>
                  <SelectItem value="atendente">
                    👤 Atendente — atendimento e conversas
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSalvar} disabled={salvando}>
              {salvando && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {usuarioEditando ? 'Salvar' : 'Criar Usuário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Resetar Senha */}
      <AlertDialog open={resetSenhaOpen} onOpenChange={setResetSenhaOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetar Senha</AlertDialogTitle>
            <AlertDialogDescription>
              Uma nova senha será gerada automaticamente. Anote-a e
              compartilhe com o usuário.
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

      {/* Modal exibir senha gerada */}
      {novaSenhaTemp && (
        <Dialog
          open={!!novaSenhaTemp}
          onOpenChange={() => setNovaSenhaTemp(null)}
        >
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>✅ Senha Resetada</DialogTitle>
              <DialogDescription>
                Compartilhe esta senha com o usuário. Ela não será
                exibida novamente.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <code className="flex-1 text-lg font-mono font-bold">
                {novaSenhaTemp}
              </code>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(novaSenhaTemp);
                  toast({ title: 'Copiado!' });
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => setNovaSenhaTemp(null)}>
                Fechar
              </Button>
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
              Esta ação não pode ser desfeita. O usuário perderá o
              acesso ao sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive" onClick={handleDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
