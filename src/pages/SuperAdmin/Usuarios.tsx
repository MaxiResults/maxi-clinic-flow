import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Loader2, KeyRound, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { Label } from '@/components/ui/label';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  cliente_id: number;
  empresa_id: number;
  ultimo_login?: string;
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [criando, setCriando] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmaSenha: '',
    cliente_id: '',
    empresa_id: '',
    role: 'admin',
  });

  const [resetSenhaDialog, setResetSenhaDialog] = useState<string | null>(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaNovaSenha, setConfirmaNovaSenha] = useState('');

  const [impersonateDialog, setImpersonateDialog] = useState<Usuario | null>(null);
  const [impersonando, setImpersonando] = useState(false);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const response = await api.get('/superadmin/usuarios');
      setUsuarios(response.data.data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar usuários',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCriarUsuario = async () => {
    try {
      if (!formData.nome || !formData.email || !formData.senha || !formData.cliente_id || !formData.empresa_id) {
        toast({
          title: 'Preencha todos os campos obrigatórios',
          variant: 'destructive',
        });
        return;
      }

      if (formData.senha !== formData.confirmaSenha) {
        toast({
          title: 'Senhas não conferem',
          variant: 'destructive',
        });
        return;
      }

      if (formData.senha.length < 8) {
        toast({
          title: 'Senha deve ter no mínimo 8 caracteres',
          variant: 'destructive',
        });
        return;
      }

      setCriando(true);
      await api.post('/superadmin/usuarios', {
        nome: formData.nome,
        email: formData.email,
        senha: formData.senha,
        cliente_id: Number(formData.cliente_id),
        empresa_id: Number(formData.empresa_id),
        role: formData.role,
      });

      toast({ title: 'Usuário criado com sucesso' });
      setFormData({
        nome: '',
        email: '',
        senha: '',
        confirmaSenha: '',
        cliente_id: '',
        empresa_id: '',
        role: 'admin',
      });

      await fetchUsuarios();
    } catch (error: any) {
      toast({
        title: 'Erro ao criar usuário',
        description: error?.response?.data?.error,
        variant: 'destructive',
      });
    } finally {
      setCriando(false);
    }
  };

  const handleResetarSenha = async () => {
    try {
      if (!novaSenha || novaSenha.length < 8) {
        toast({
          title: 'Senha deve ter no mínimo 8 caracteres',
          variant: 'destructive',
        });
        return;
      }

      if (novaSenha !== confirmaNovaSenha) {
        toast({
          title: 'Senhas não conferem',
          variant: 'destructive',
        });
        return;
      }

      await api.post(`/superadmin/usuarios/${resetSenhaDialog}/resetar-senha`, {
        nova_senha: novaSenha,
      });

      toast({ title: 'Senha resetada com sucesso' });
      setResetSenhaDialog(null);
      setNovaSenha('');
      setConfirmaNovaSenha('');
    } catch (error: any) {
      toast({
        title: 'Erro ao resetar senha',
        description: error?.response?.data?.error,
        variant: 'destructive',
      });
    }
  };

  const handleImpersonate = async () => {
    try {
      if (!impersonateDialog) return;

      setImpersonando(true);
      const response = await api.post(`/superadmin/impersonate/${impersonateDialog.id}`);

      if (response.data?.data?.token) {
        localStorage.setItem('token', response.data.data.token);
        toast({
          title: `✓ Sessão iniciada como ${impersonateDialog.nome}`,
          description: 'Token expira em 1 hora',
        });

        setTimeout(() => {
          navigate('/');
        }, 500);
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao logar como usuário',
        description: error?.response?.data?.error,
        variant: 'destructive',
      });
    } finally {
      setImpersonando(false);
    }
  };

  const roleColor: Record<string, string> = {
    admin: 'bg-indigo-100 text-indigo-800',
    manager: 'bg-violet-100 text-violet-800',
    viewer: 'bg-slate-100 text-slate-800',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Formulário de Criação */}
      <div className="lg:col-span-2">
        <Card className="border-slate-200 sticky top-8">
          <CardHeader>
            <CardTitle className="text-base">Criar Usuário Admin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nome Completo *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="João Silva"
              />
            </div>

            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="joao@example.com"
              />
            </div>

            <div>
              <Label>Senha *</Label>
              <Input
                type="password"
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                placeholder="Mín. 8 caracteres"
              />
            </div>

            <div>
              <Label>Confirmar Senha *</Label>
              <Input
                type="password"
                value={formData.confirmaSenha}
                onChange={(e) => setFormData({ ...formData, confirmaSenha: e.target.value })}
                placeholder="Mín. 8 caracteres"
              />
            </div>

            <div>
              <Label>Cliente ID *</Label>
              <Input
                type="number"
                value={formData.cliente_id}
                onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
                placeholder="123"
              />
            </div>

            <div>
              <Label>Empresa ID *</Label>
              <Input
                type="number"
                value={formData.empresa_id}
                onChange={(e) => setFormData({ ...formData, empresa_id: e.target.value })}
                placeholder="456"
              />
            </div>

            <div>
              <Label>Perfil</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleCriarUsuario}
              disabled={criando}
              className="w-full"
            >
              {criando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Usuário'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Usuários */}
      <div className="lg:col-span-3">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Usuários do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            {usuarios.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Nenhum usuário encontrado
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {usuarios.map((usuario) => (
                  <div
                    key={usuario.id}
                    className="flex items-center justify-between p-3 border border-slate-200 rounded hover:bg-slate-50"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{usuario.nome}</p>
                      <p className="text-xs text-slate-500">{usuario.email}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Cliente {usuario.cliente_id} • Empresa {usuario.empresa_id}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={roleColor[usuario.role]}>
                        {usuario.role}
                      </Badge>
                      <Badge variant={usuario.ativo ? 'default' : 'secondary'}>
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>

                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setResetSenhaDialog(usuario.id)}
                        title="Reset Senha"
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setImpersonateDialog(usuario)}
                        title="Impersonate"
                      >
                        <LogIn className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reset Senha Dialog */}
      <Dialog open={resetSenhaDialog !== null} onOpenChange={(open) => !open && setResetSenhaDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetar Senha</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nova Senha *</Label>
              <Input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Mín. 8 caracteres"
              />
            </div>
            <div>
              <Label>Confirmar Senha *</Label>
              <Input
                type="password"
                value={confirmaNovaSenha}
                onChange={(e) => setConfirmaNovaSenha(e.target.value)}
                placeholder="Mín. 8 caracteres"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setResetSenhaDialog(null)}>
              Cancelar
            </Button>
            <Button onClick={handleResetarSenha}>Resetar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Impersonate Dialog */}
      <Dialog open={impersonateDialog !== null} onOpenChange={(open) => !open && setImpersonateDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Impersonate</DialogTitle>
            <DialogDescription>
              Você vai logar como <strong>{impersonateDialog?.nome}</strong> ({impersonateDialog?.email}).
              <br />
              <br />
              O token expira em <strong>1 hora</strong>.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImpersonateDialog(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleImpersonate}
              disabled={impersonando}
            >
              {impersonando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Acessando...
                </>
              ) : (
                'Confirmar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
