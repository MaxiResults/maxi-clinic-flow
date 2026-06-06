import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pencil,
  Building2,
  Plus,
  Loader2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { Label } from '@/components/ui/label';

interface Cliente {
  Cliente_ID: number;
  nome: string;
  nome_fantasia?: string;
  documento?: string;
  email?: string;
  telefone?: string;
  cidade?: string;
  estado?: string;
  status: string;
  created_at: string;
  empresas?: Empresa[];
}

interface Empresa {
  id: number;
  cliente_id: number;
  razao_social?: string;
  nome_fantasia: string;
  plano: string;
  status: string;
  status_pagamento?: string;
  data_ativacao?: string;
  cliente_features?: {
    feature_whatsapp: boolean;
    feature_ai_assistant: boolean;
  };
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [expandedCliente, setExpandedCliente] = useState<number | null>(null);
  const [showClienteDialog, setShowClienteDialog] = useState(false);
  const [showEmpresaDialog, setShowEmpresaDialog] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Partial<Cliente> | null>(null);
  const [empresasLoading, setEmpresasLoading] = useState<number | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nome: '',
    nome_fantasia: '',
    documento: '',
    email: '',
    telefone: '',
    cidade: '',
    estado: '',
    status: 'ATIVO',
    observacoes: '',
  });

  const [empresaFormData, setEmpresaFormData] = useState({
    cliente_id: 0,
    razao_social: '',
    nome_fantasia: '',
    cnpj_cpf: '',
    plano: 'essencial',
    email: '',
    telefone: '',
    cidade: '',
    estado: '',
  });

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'todos') params.append('status', statusFilter);

      const response = await api.get(`/superadmin/clientes?${params.toString()}`);
      setClientes(response.data.data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar clientes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmpresas = async (clienteId: number) => {
    if (expandedCliente === clienteId) {
      setExpandedCliente(null);
      return;
    }

    try {
      setEmpresasLoading(clienteId);
      const response = await api.get(`/superadmin/clientes/${clienteId}/empresas`);
      setClientes((prev) =>
        prev.map((c) =>
          c.Cliente_ID === clienteId ? { ...c, empresas: response.data.data } : c
        )
      );
      setExpandedCliente(clienteId);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar empresas',
        variant: 'destructive',
      });
    } finally {
      setEmpresasLoading(null);
    }
  };

  const handleSalvarCliente = async () => {
    try {
      if (!formData.nome.trim()) {
        toast({
          title: 'Nome é obrigatório',
          variant: 'destructive',
        });
        return;
      }

      if (editingCliente?.Cliente_ID) {
        await api.patch(`/superadmin/clientes/${editingCliente.Cliente_ID}`, formData);
        toast({ title: 'Cliente atualizado com sucesso' });
      } else {
        await api.post('/superadmin/clientes', formData);
        toast({ title: 'Cliente criado com sucesso' });
      }

      setShowClienteDialog(false);
      setEditingCliente(null);
      setFormData({
        nome: '',
        nome_fantasia: '',
        documento: '',
        email: '',
        telefone: '',
        cidade: '',
        estado: '',
        status: 'ATIVO',
        observacoes: '',
      });

      await fetchClientes();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar cliente',
        description: error?.response?.data?.error,
        variant: 'destructive',
      });
    }
  };

  const handleSalvarEmpresa = async () => {
    try {
      if (!empresaFormData.cnpj_cpf.trim() || !empresaFormData.email.trim()) {
        toast({
          title: 'CNPJ/CPF e Email são obrigatórios',
          variant: 'destructive',
        });
        return;
      }

      await api.post('/superadmin/empresas', empresaFormData);
      toast({ title: 'Empresa criada com sucesso' });

      setShowEmpresaDialog(false);
      setEmpresaFormData({
        cliente_id: 0,
        razao_social: '',
        nome_fantasia: '',
        cnpj_cpf: '',
        plano: 'essencial',
        email: '',
        telefone: '',
        cidade: '',
        estado: '',
      });

      if (expandedCliente) {
        await fetchEmpresas(expandedCliente);
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao criar empresa',
        description: error?.response?.data?.error,
        variant: 'destructive',
      });
    }
  };

  const handleToggleFeature = async (
    empresaId: number,
    feature: 'feature_whatsapp' | 'feature_ai_assistant',
    enabled: boolean
  ) => {
    try {
      await api.patch(`/superadmin/empresas/${empresaId}/features`, {
        [feature]: !enabled,
      });
      toast({ title: 'Feature atualizada com sucesso' });

      if (expandedCliente) {
        await fetchEmpresas(expandedCliente);
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar feature',
        variant: 'destructive',
      });
    }
  };

  const statusColor: Record<string, string> = {
    ATIVO: 'bg-emerald-100 text-emerald-800',
    INATIVO: 'bg-slate-100 text-slate-800',
    SUSPENSO: 'bg-amber-100 text-amber-800',
  };

  const planoColor: Record<string, string> = {
    essencial: 'bg-slate-100 text-slate-800',
    profissional: 'bg-indigo-100 text-indigo-800',
    premium: 'bg-violet-100 text-violet-800',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const filteredClientes = clientes.filter((c) => {
    const matchSearch = !search || c.nome.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'todos' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-slate-200">
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-xs">
              <Input
                placeholder="Buscar por nome..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  fetchClientes();
                }}
                className="bg-white"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ATIVO">Ativo</SelectItem>
                <SelectItem value="INATIVO">Inativo</SelectItem>
                <SelectItem value="SUSPENSO">Suspenso</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => {
                setEditingCliente(null);
                setFormData({
                  nome: '',
                  nome_fantasia: '',
                  documento: '',
                  email: '',
                  telefone: '',
                  cidade: '',
                  estado: '',
                  status: 'ATIVO',
                  observacoes: '',
                });
                setShowClienteDialog(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Clientes Table */}
      <Card className="border-slate-200">
        <CardContent className="pt-6">
          {filteredClientes.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Nenhum cliente encontrado
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClientes.map((cliente) => (
                <div key={cliente.Cliente_ID}>
                  {/* Cliente Row */}
                  <div className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fetchEmpresas(cliente.Cliente_ID)}
                      className="p-0 h-auto"
                    >
                      {expandedCliente === cliente.Cliente_ID ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </Button>

                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{cliente.nome}</p>
                      <p className="text-sm text-slate-500">{cliente.documento}</p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-600">
                        {cliente.cidade}/{cliente.estado}
                      </p>
                    </div>

                    <Badge className={statusColor[cliente.status]}>
                      {cliente.status}
                    </Badge>

                    <Badge variant="outline">
                      {cliente.empresas?.length || 0} empresas
                    </Badge>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingCliente(cliente);
                        setFormData({
                          nome: cliente.nome || '',
                          nome_fantasia: cliente.nome_fantasia || '',
                          documento: cliente.documento || '',
                          email: cliente.email || '',
                          telefone: cliente.telefone || '',
                          cidade: cliente.cidade || '',
                          estado: cliente.estado || '',
                          status: cliente.status,
                          observacoes: '',
                        });
                        setShowClienteDialog(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Empresas Expanded */}
                  {expandedCliente === cliente.Cliente_ID && (
                    <div className="ml-12 mt-2 space-y-2 border-l-2 border-slate-200 pl-4">
                      {empresasLoading === cliente.Cliente_ID ? (
                        <div className="flex items-center gap-2 text-slate-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Carregando empresas...
                        </div>
                      ) : cliente.empresas && cliente.empresas.length > 0 ? (
                        <>
                          {cliente.empresas.map((empresa) => (
                            <div
                              key={empresa.id}
                              className="p-3 bg-slate-50 rounded border border-slate-200"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-sm text-slate-900">
                                    {empresa.nome_fantasia}
                                  </p>
                                  <div className="flex gap-2 mt-1">
                                    <Badge className={planoColor[empresa.plano]}>
                                      {empresa.plano}
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className={empresa.cliente_features?.feature_whatsapp ? 'bg-emerald-50' : ''}
                                    >
                                      WhatsApp:{' '}
                                      {empresa.cliente_features?.feature_whatsapp ? '✓' : '✗'}
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className={empresa.cliente_features?.feature_ai_assistant ? 'bg-violet-50' : ''}
                                    >
                                      IA: {empresa.cliente_features?.feature_ai_assistant ? '✓' : '✗'}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Switch
                                    checked={empresa.cliente_features?.feature_whatsapp || false}
                                    onCheckedChange={() =>
                                      handleToggleFeature(
                                        empresa.id,
                                        'feature_whatsapp',
                                        empresa.cliente_features?.feature_whatsapp || false
                                      )
                                    }
                                  />
                                  <Switch
                                    checked={empresa.cliente_features?.feature_ai_assistant || false}
                                    onCheckedChange={() =>
                                      handleToggleFeature(
                                        empresa.id,
                                        'feature_ai_assistant',
                                        empresa.cliente_features?.feature_ai_assistant || false
                                      )
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEmpresaFormData({
                                ...empresaFormData,
                                cliente_id: cliente.Cliente_ID,
                              });
                              setShowEmpresaDialog(true);
                            }}
                            className="mt-2"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Nova Empresa
                          </Button>
                        </>
                      ) : (
                        <p className="text-sm text-slate-500">Nenhuma empresa</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cliente Dialog */}
      <Dialog open={showClienteDialog} onOpenChange={setShowClienteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>
            <div>
              <Label>Nome Fantasia</Label>
              <Input
                value={formData.nome_fantasia}
                onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATIVO">Ativo</SelectItem>
                  <SelectItem value="INATIVO">Inativo</SelectItem>
                  <SelectItem value="SUSPENSO">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClienteDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarCliente}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Empresa Dialog */}
      <Dialog open={showEmpresaDialog} onOpenChange={setShowEmpresaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Empresa</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>CNPJ/CPF *</Label>
              <Input
                value={empresaFormData.cnpj_cpf}
                onChange={(e) =>
                  setEmpresaFormData({ ...empresaFormData, cnpj_cpf: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={empresaFormData.email}
                onChange={(e) =>
                  setEmpresaFormData({ ...empresaFormData, email: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Plano *</Label>
              <Select
                value={empresaFormData.plano}
                onValueChange={(v) =>
                  setEmpresaFormData({ ...empresaFormData, plano: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="essencial">Essencial</SelectItem>
                  <SelectItem value="profissional">Profissional</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmpresaDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarEmpresa}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
