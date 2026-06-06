import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Building2,
  Plus,
  Loader2,
  MapPin,
  Package,
  Settings2,
  Pencil,
  ArrowLeft,
  User,
  Phone,
  UserCheck,
  FileText,
  MessageSquare,
  Bot,
  Briefcase,
  KeyRound,
  LogIn,
  Users,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

type View = 'lista' | 'cadastro' | 'detalhe';

interface Produto {
  id: number;
  codigo: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
}

interface Cliente {
  Cliente_ID: number;
  nome: string;
  nome_fantasia?: string;
  documento?: string;
  email?: string;
  telefone?: string;
  contato?: string;
  contato_telefone?: string;
  contato_email?: string;
  cidade?: string;
  estado?: string;
  status: string;
  tipo_cliente?: string;
  observacoes?: string;
  created_at: string;
  empresas?: Empresa[];
  produtos?: Produto[];
}

interface Empresa {
  id: number;
  cliente_id: number;
  razao_social?: string;
  nome_fantasia: string;
  cnpj_cpf?: string;
  plano: string;
  status: string;
  status_pagamento?: string;
  email?: string;
  telefone?: string;
  cidade?: string;
  estado?: string;
  data_ativacao?: string;
  data_cancelamento?: string;
  cliente_features?: {
    feature_whatsapp: boolean;
    feature_ai_assistant: boolean;
    whatsapp_activated_at?: string;
    ai_activated_at?: string;
  };
}

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

const formatDate = (date: string | null) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('pt-BR');
};

const ESTADOS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
const TIPOS_CLIENTE = ['Clínica', 'Consultório', 'Studio', 'Salão', 'Agência', 'Outros'];

export default function Clientes() {
  const [view, setView] = useState<View>('lista');
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [produtoFilter, setProdutoFilter] = useState('todos');
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Form states
  const [formData, setFormData] = useState({
    nome: '',
    nome_fantasia: '',
    documento: '',
    email: '',
    telefone: '',
    contato: '',
    contato_telefone: '',
    contato_email: '',
    cidade: '',
    estado: '',
    status: 'ATIVO',
    tipo_cliente: 'Clínica',
    observacoes: '',
  });

  const [produtosSelecionados, setProdutosSelecionados] = useState<number[]>([]);
  const [empresasDoCliente, setEmpresasDoCliente] = useState<Empresa[]>([]);
  const [usuariosDoCliente, setUsuariosDoCliente] = useState<Usuario[]>([]);
  const [usuariosLoading, setUsuariosLoading] = useState(false);

  // Dialog/Sheet states
  const [showEmpresaSheet, setShowEmpresaSheet] = useState(false);
  const [showUsuarioDialog, setShowUsuarioDialog] = useState(false);
  const [empresaAtualSelecionada, setEmpresaAtualSelecionada] = useState<Empresa | null>(null);

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

  const [usuarioFormData, setUsuarioFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    cliente_id: 0,
    empresa_id: 0,
    role: 'admin',
  });

  // ─── Fetch inicial ───────────────────────────────────────────────────────

  useEffect(() => {
    fetchProdutos();
    fetchClientes();
  }, []);

  const fetchProdutos = async () => {
    try {
      const data = await api.get('/superadmin/produtos');
      setProdutos(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Erro ao buscar produtos:', error);
      setProdutos([]);
    }
  };

  const fetchClientes = async (s = search, st = statusFilter, p = produtoFilter) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (s) params.append('search', s);
      // Converter "todos" em string vazia para a API
      const statusForApi = st === 'todos' ? '' : st;
      const produtoForApi = p === 'todos' ? '' : p;
      if (statusForApi) params.append('status', statusForApi);
      if (produtoForApi) params.append('produto', produtoForApi);

      const data = await api.get(`/superadmin/clientes?${params.toString()}`);
      setClientes(Array.isArray(data) ? data : []);
    } catch (error: any) {
      setClientes([]);
      toast({
        title: 'Erro ao carregar clientes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchClientes(value, statusFilter, produtoFilter);
    }, 300);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    const statusForApi = value === 'todos' ? '' : value;
    fetchClientes(search, statusForApi, produtoFilter);
  };

  const handleProdutoFilterChange = (value: string) => {
    setProdutoFilter(value);
    const produtoForApi = value === 'todos' ? '' : value;
    fetchClientes(search, statusFilter, produtoForApi);
  };

  // ─── Handlers VIEW 2 (Cadastro/Edição) ──────────────────────────────────

  const handleEditarCliente = (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    setFormData({
      nome: cliente.nome || '',
      nome_fantasia: cliente.nome_fantasia || '',
      documento: cliente.documento || '',
      email: cliente.email || '',
      telefone: cliente.telefone || '',
      contato: cliente.contato || '',
      contato_telefone: cliente.contato_telefone || '',
      contato_email: cliente.contato_email || '',
      cidade: cliente.cidade || '',
      estado: cliente.estado || '',
      status: cliente.status || 'ATIVO',
      tipo_cliente: cliente.tipo_cliente || '',
      observacoes: cliente.observacoes || '',
    });

    if (cliente.produtos) {
      setProdutosSelecionados(cliente.produtos.map(p => p.id));
    }

    setView('cadastro');
  };

  const handleNovoCliente = () => {
    setClienteSelecionado(null);
    setFormData({
      nome: '',
      nome_fantasia: '',
      documento: '',
      email: '',
      telefone: '',
      contato: '',
      contato_telefone: '',
      contato_email: '',
      cidade: '',
      estado: '',
      status: 'ATIVO',
      tipo_cliente: 'Clínica',
      observacoes: '',
    });
    setProdutosSelecionados([]);
    setView('cadastro');
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

      let clienteId: number;

      if (clienteSelecionado?.Cliente_ID) {
        // Editar
        await api.patch(`/superadmin/clientes/${clienteSelecionado.Cliente_ID}`, formData);
        clienteId = clienteSelecionado.Cliente_ID;
        toast({ title: 'Cliente atualizado com sucesso' });
      } else {
        // Criar
        const response = await api.post('/superadmin/clientes', formData);
        clienteId = response.Cliente_ID;
        toast({ title: 'Cliente criado com sucesso' });
      }

      // Sincronizar produtos
      if (clienteSelecionado?.produtos) {
        const produtosAntigos = clienteSelecionado.produtos.map(p => p.id);

        // Remover produtos desmarcados
        for (const produtoId of produtosAntigos) {
          if (!produtosSelecionados.includes(produtoId)) {
            try {
              await api.delete(`/superadmin/clientes/${clienteId}/produtos/${produtoId}`);
            } catch (error) {
              console.error('Erro ao remover produto:', error);
            }
          }
        }

        // Adicionar produtos novos
        for (const produtoId of produtosSelecionados) {
          if (!produtosAntigos.includes(produtoId)) {
            try {
              await api.post(`/superadmin/clientes/${clienteId}/produtos`, { produto_id: produtoId });
            } catch (error) {
              console.error('Erro ao adicionar produto:', error);
            }
          }
        }
      } else {
        // Novo cliente: adicionar todos os produtos selecionados
        for (const produtoId of produtosSelecionados) {
          try {
            await api.post(`/superadmin/clientes/${clienteId}/produtos`, { produto_id: produtoId });
          } catch (error) {
            console.error('Erro ao adicionar produto:', error);
          }
        }
      }

      setView('lista');
      await fetchClientes();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar cliente',
        description: error?.response?.data?.error,
        variant: 'destructive',
      });
    }
  };

  // ─── Handlers VIEW 3 (Detalhe) ─────────────────────────────────────────

  const handleDetalheCliente = async (cliente: Cliente) => {
    try {
      setClienteSelecionado(cliente);

      // Buscar empresas
      const empresas = await api.get(`/superadmin/clientes/${cliente.Cliente_ID}/empresas`);
      setEmpresasDoCliente(Array.isArray(empresas) ? empresas : []);

      // Buscar usuários
      const usuarios = await api.get(`/superadmin/usuarios?cliente_id=${cliente.Cliente_ID}`);
      setUsuariosDoCliente(Array.isArray(usuarios) ? usuarios : []);

      setView('detalhe');
    } catch (error: any) {
      setEmpresasDoCliente([]);
      setUsuariosDoCliente([]);
      toast({
        title: 'Erro ao carregar detalhes',
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

      setShowEmpresaSheet(false);
      setEmpresaFormData({
        cliente_id: clienteSelecionado?.Cliente_ID || 0,
        razao_social: '',
        nome_fantasia: '',
        cnpj_cpf: '',
        plano: 'essencial',
        email: '',
        telefone: '',
        cidade: '',
        estado: '',
      });

      // Refetch
      if (clienteSelecionado) {
        const empresas = await api.get(`/superadmin/clientes/${clienteSelecionado.Cliente_ID}/empresas`);
        setEmpresasDoCliente(Array.isArray(empresas) ? empresas : []);
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao criar empresa',
        description: error?.response?.data?.error,
        variant: 'destructive',
      });
    }
  };

  const handleAlterarPlano = async (empresaId: number, novoPlano: string) => {
    try {
      await api.patch(`/superadmin/empresas/${empresaId}/plano`, { plano: novoPlano });
      toast({ title: 'Plano alterado com sucesso' });

      if (clienteSelecionado) {
        const empresas = await api.get(`/superadmin/clientes/${clienteSelecionado.Cliente_ID}/empresas`);
        setEmpresasDoCliente(Array.isArray(empresas) ? empresas : []);
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao alterar plano',
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

      if (clienteSelecionado) {
        const empresas = await api.get(`/superadmin/clientes/${clienteSelecionado.Cliente_ID}/empresas`);
        setEmpresasDoCliente(Array.isArray(empresas) ? empresas : []);
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar feature',
        variant: 'destructive',
      });
    }
  };

  const handleSalvarUsuario = async () => {
    try {
      if (!usuarioFormData.nome.trim() || !usuarioFormData.email.trim() || !usuarioFormData.senha.trim()) {
        toast({
          title: 'Nome, Email e Senha são obrigatórios',
          variant: 'destructive',
        });
        return;
      }

      await api.post('/superadmin/usuarios', usuarioFormData);
      toast({ title: 'Usuário criado com sucesso' });

      setShowUsuarioDialog(false);
      setUsuarioFormData({
        nome: '',
        email: '',
        senha: '',
        cliente_id: clienteSelecionado?.Cliente_ID || 0,
        empresa_id: empresaAtualSelecionada?.id || 0,
        role: 'admin',
      });

      if (clienteSelecionado) {
        const usuarios = await api.get(`/superadmin/usuarios?cliente_id=${clienteSelecionado.Cliente_ID}`);
        setUsuariosDoCliente(Array.isArray(usuarios) ? usuarios : []);
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao criar usuário',
        description: error?.response?.data?.error,
        variant: 'destructive',
      });
    }
  };

  const handleResetarSenha = async (usuarioId: string) => {
    // Implementar dialog com nova senha
    toast({ title: 'Reset de senha ainda não implementado' });
  };

  const handleImpersonate = async (usuarioId: string) => {
    try {
      const response = await api.post(`/superadmin/impersonate/${usuarioId}`, {});
      // Armazenar token e redirecionar
      localStorage.setItem('impersonate_token', response.token);
      window.location.href = '/';
    } catch (error: any) {
      toast({
        title: 'Erro ao fazer impersonate',
        variant: 'destructive',
      });
    }
  };

  // ─── Colors & Helpers ───────────────────────────────────────────────────

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ATIVO':
        return { bg: 'bg-emerald-500/10', text: 'text-emerald-600', icon: 'text-emerald-600' };
      case 'INATIVO':
        return { bg: 'bg-slate-500/10', text: 'text-slate-600', icon: 'text-slate-600' };
      case 'SUSPENSO':
        return { bg: 'bg-amber-500/10', text: 'text-amber-600', icon: 'text-amber-600' };
      default:
        return { bg: 'bg-slate-500/10', text: 'text-slate-600', icon: 'text-slate-600' };
    }
  };

  const getPlanoColor = (plano: string) => {
    switch (plano) {
      case 'essencial':
        return 'bg-slate-100 text-slate-700';
      case 'profissional':
        return 'bg-indigo-100 text-indigo-700';
      case 'premium':
        return 'bg-violet-100 text-violet-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getProdutoColor = (codigo: string) => {
    switch (codigo) {
      case 'maxi_clinica':
        return 'bg-indigo-100 text-indigo-700';
      case 'maxi_ia':
        return 'bg-violet-100 text-violet-700';
      case 'projeto_personalizado':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getProdutoNome = (codigo: string) => {
    const produto = produtos.find(p => p.codigo === codigo);
    return produto?.nome || codigo;
  };

  // ─── Render Functions ───────────────────────────────────────────────────

  // VIEW 1: LISTA
  if (view === 'lista') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Clientes</h1>
          <p className="text-slate-600 mt-2">Gerencie os clientes da plataforma</p>
        </div>

        {/* Filters */}
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex gap-4 flex-wrap">
              <Input
                placeholder="Buscar por nome..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="flex-1 min-w-xs bg-white"
              />
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ATIVO">Ativo</SelectItem>
                  <SelectItem value="INATIVO">Inativo</SelectItem>
                  <SelectItem value="SUSPENSO">Suspenso</SelectItem>
                </SelectContent>
              </Select>
              <Select value={produtoFilter} onValueChange={handleProdutoFilterChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {produtos.map((p) => (
                    <SelectItem key={p.id} value={p.codigo}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleNovoCliente}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Grid de Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border-slate-200">
                <CardContent className="pt-6">
                  <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                  <Skeleton className="h-6 w-48 mb-3" />
                  <Skeleton className="h-4 w-32 mb-4" />
                  <div className="space-y-2 mb-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : clientes.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center text-center">
              <Building2 className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-600 font-medium">Nenhum cliente encontrado</p>
              <p className="text-slate-500 text-sm mt-1">Crie o primeiro cliente para começar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientes.map((cliente) => {
              const statusColor = getStatusColor(cliente.status);
              return (
                <Card
                  key={cliente.Cliente_ID}
                  className="hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-blue-300/50 border-slate-200"
                >
                  <CardContent className="pt-6">
                    {/* Header com ícone e status */}
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-3 rounded-lg ${statusColor.bg}`}>
                        <Building2 className={`h-5 w-5 ${statusColor.icon}`} />
                      </div>
                      <Badge className={statusColor.text + ' bg-opacity-10'}>{cliente.status}</Badge>
                    </div>

                    {/* Nome */}
                    <h3 className="font-semibold text-lg text-slate-900 mb-1">{cliente.nome}</h3>
                    {cliente.nome_fantasia && (
                      <p className="text-sm text-slate-500 mb-3">{cliente.nome_fantasia}</p>
                    )}

                    {/* Localização */}
                    {cliente.cidade && cliente.estado && (
                      <div className="flex items-center gap-1 text-sm text-slate-600 mb-3">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        {cliente.cidade}/{cliente.estado}
                      </div>
                    )}

                    {/* Produtos */}
                    {cliente.produtos && cliente.produtos.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {cliente.produtos.map((p) => (
                          <Badge key={p.id} className={getProdutoColor(p.codigo)}>
                            {getProdutoNome(p.codigo)}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-200 mb-4">
                      <span>Cadastrado em {formatDate(cliente.created_at)}</span>
                    </div>

                    {/* Botões */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditarCliente(cliente)}
                        className="flex-1"
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDetalheCliente(cliente)}
                        className="flex-1"
                      >
                        <Settings2 className="h-4 w-4 mr-2" />
                        Gerenciar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // VIEW 2: CADASTRO / EDIÇÃO
  if (view === 'cadastro') {
    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView('lista')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <span className="text-sm text-slate-600">
            Clientes {clienteSelecionado && `→ ${clienteSelecionado.nome} → Editar`}
          </span>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {clienteSelecionado ? 'Editar Cliente' : 'Novo Cliente'}
          </h1>
        </div>

        {/* Seção 1: Identificação */}
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              <CardTitle>Identificação</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2">Tipo de Cliente*</Label>
                <Select value={formData.tipo_cliente} onValueChange={(v) => setFormData({ ...formData, tipo_cliente: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_CLIENTE.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2">Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2">Nome / Razão Social*</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome do cliente"
                />
              </div>
              <div>
                <Label className="mb-2">Nome Fantasia</Label>
                <Input
                  value={formData.nome_fantasia}
                  onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })}
                  placeholder="Nome fantasia"
                />
              </div>
            </div>

            <div>
              <Label className="mb-2">Documento CPF/CNPJ</Label>
              <Input
                value={formData.documento}
                onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                placeholder="000.000.000-00"
              />
            </div>
          </CardContent>
        </Card>

        {/* Seção 2: Contato Principal */}
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-green-600" />
              <CardTitle>Contato Principal</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2">Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label className="mb-2">Telefone</Label>
                <Input
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2">Cidade</Label>
                <Input
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  placeholder="São Paulo"
                />
              </div>
              <div>
                <Label className="mb-2">Estado</Label>
                <Select value={formData.estado} onValueChange={(v) => setFormData({ ...formData, estado: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS.map((e) => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seção 3: Contato Responsável */}
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-purple-600" />
              <CardTitle>Contato Responsável</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2">Nome do Responsável</Label>
              <Input
                value={formData.contato}
                onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
                placeholder="Nome completo"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2">Telefone do Responsável</Label>
                <Input
                  value={formData.contato_telefone}
                  onChange={(e) => setFormData({ ...formData, contato_telefone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <Label className="mb-2">Email do Responsável</Label>
                <Input
                  type="email"
                  value={formData.contato_email}
                  onChange={(e) => setFormData({ ...formData, contato_email: e.target.value })}
                  placeholder="responsavel@example.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seção 4: Produtos Contratados */}
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-600" />
              <CardTitle>Produtos Contratados</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {produtos.map((produto) => (
                <Card
                  key={produto.id}
                  className={`border-2 cursor-pointer transition-all ${
                    produtosSelecionados.includes(produto.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => {
                    setProdutosSelecionados((prev) =>
                      prev.includes(produto.id)
                        ? prev.filter((p) => p !== produto.id)
                        : [...prev, produto.id]
                    );
                  }}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-100 rounded flex-shrink-0">
                        <Package className="h-4 w-4 text-slate-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{produto.nome}</p>
                        {produto.descricao && (
                          <p className="text-xs text-slate-500 mt-1">{produto.descricao}</p>
                        )}
                      </div>
                      <div className={`h-4 w-4 rounded border-2 flex-shrink-0 ${
                        produtosSelecionados.includes(produto.id)
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-slate-300'
                      }`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Seção 5: Observações */}
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-600" />
              <CardTitle>Observações</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Anotações internas sobre o cliente"
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Botões */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setView('lista')}>
            Cancelar
          </Button>
          <Button onClick={handleSalvarCliente}>Salvar Cliente</Button>
        </div>
      </div>
    );
  }

  // VIEW 3: DETALHE
  if (view === 'detalhe' && clienteSelecionado) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView('lista')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <span className="text-sm text-slate-600">Clientes → {clienteSelecionado.nome}</span>
        </div>

        {/* Header */}
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{clienteSelecionado.nome}</h1>
                {clienteSelecionado.nome_fantasia && (
                  <p className="text-slate-600 mt-1">{clienteSelecionado.nome_fantasia}</p>
                )}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <Badge className={getStatusColor(clienteSelecionado.status).text + ' bg-opacity-10'}>
                    {clienteSelecionado.status}
                  </Badge>
                  {(clienteSelecionado.produtos ?? []).map((p) => (
                    <Badge key={p.id} className={getProdutoColor(p.codigo)}>
                      {getProdutoNome(p.codigo)}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button onClick={() => handleEditarCliente(clienteSelecionado)}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar Cadastro
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="empresas" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="empresas">Empresas</TabsTrigger>
            <TabsTrigger value="modulos">Módulos</TabsTrigger>
            <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          </TabsList>

          {/* ABA 1: EMPRESAS */}
          <TabsContent value="empresas" className="space-y-4">
            <EmpresaSheet
              open={showEmpresaSheet}
              onOpenChange={setShowEmpresaSheet}
              formData={empresaFormData}
              onFormDataChange={setEmpresaFormData}
              onSalvar={handleSalvarEmpresa}
            />

            <Button
              onClick={() => {
                setEmpresaFormData({
                  cliente_id: clienteSelecionado.Cliente_ID,
                  razao_social: '',
                  nome_fantasia: '',
                  cnpj_cpf: '',
                  plano: 'essencial',
                  email: '',
                  telefone: '',
                  cidade: '',
                  estado: '',
                });
                setShowEmpresaSheet(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Empresa
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {empresasDoCliente.map((empresa) => (
                <Card key={empresa.id} className="border-slate-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle>{empresa.nome_fantasia}</CardTitle>
                        <div className="flex gap-2 mt-2">
                          <Badge className={getPlanoColor(empresa.plano)}>
                            {empresa.plano}
                          </Badge>
                          {empresa.status_pagamento && (
                            <Badge variant="outline">{empresa.status_pagamento}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pb-4">
                    {empresa.email && <p className="text-sm text-slate-600">{empresa.email}</p>}
                    {empresa.telefone && <p className="text-sm text-slate-600">{empresa.telefone}</p>}
                    {empresa.cidade && empresa.estado && (
                      <p className="text-sm text-slate-600">{empresa.cidade}/{empresa.estado}</p>
                    )}

                    <div className="pt-3 border-t border-slate-200">
                      <Label className="text-xs">Alterar Plano</Label>
                      <Select defaultValue={empresa.plano} onValueChange={(v) => handleAlterarPlano(empresa.id, v)}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="essencial">Essencial</SelectItem>
                          <SelectItem value="profissional">Profissional</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ABA 2: MÓDULOS */}
          <TabsContent value="modulos" className="space-y-4">
            {empresasDoCliente.map((empresa) => (
              <div key={empresa.id}>
                <h3 className="font-semibold text-lg text-slate-900 mb-3">{empresa.nome_fantasia}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Card WhatsApp */}
                  <Card className={`border-2 transition-all ${
                    empresa.cliente_features?.feature_whatsapp
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-slate-200'
                  }`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <MessageSquare className={`h-6 w-6 ${
                          empresa.cliente_features?.feature_whatsapp
                            ? 'text-emerald-600'
                            : 'text-slate-400'
                        }`} />
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
                      </div>
                      <h4 className="font-semibold text-slate-900 mb-1">WhatsApp Business</h4>
                      <p className="text-sm text-slate-600 mb-3">
                        Atendimento via WhatsApp oficial Meta
                      </p>
                      {empresa.cliente_features?.whatsapp_activated_at ? (
                        <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                          Ativo desde {formatDate(empresa.cliente_features.whatsapp_activated_at)}
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-700 text-xs">Inativo</Badge>
                      )}
                    </CardContent>
                  </Card>

                  {/* Card IA */}
                  <Card className={`border-2 transition-all ${
                    empresa.cliente_features?.feature_ai_assistant
                      ? 'border-violet-300 bg-violet-50'
                      : 'border-slate-200'
                  }`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <Bot className={`h-6 w-6 ${
                          empresa.cliente_features?.feature_ai_assistant
                            ? 'text-violet-600'
                            : 'text-slate-400'
                        }`} />
                        <Switch
                          checked={empresa.cliente_features?.feature_ai_assistant || false}
                          disabled={!empresa.cliente_features?.feature_whatsapp}
                          onCheckedChange={() =>
                            handleToggleFeature(
                              empresa.id,
                              'feature_ai_assistant',
                              empresa.cliente_features?.feature_ai_assistant || false
                            )
                          }
                        />
                      </div>
                      <h4 className="font-semibold text-slate-900 mb-1">Assistente IA</h4>
                      <p className="text-sm text-slate-600 mb-3">
                        Atendimento automático com Inteligência Artificial
                      </p>
                      {!empresa.cliente_features?.feature_whatsapp && (
                        <p className="text-xs text-amber-600 mb-2">⚠️ Requer WhatsApp ativo</p>
                      )}
                      {empresa.cliente_features?.ai_activated_at ? (
                        <Badge className="bg-violet-100 text-violet-700 text-xs">
                          Ativo desde {formatDate(empresa.cliente_features.ai_activated_at)}
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-700 text-xs">Inativo</Badge>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* ABA 3: USUÁRIOS */}
          <TabsContent value="usuarios" className="space-y-4">
            <UsuarioDialog
              open={showUsuarioDialog}
              onOpenChange={setShowUsuarioDialog}
              formData={usuarioFormData}
              onFormDataChange={setUsuarioFormData}
              onSalvar={handleSalvarUsuario}
              empresas={empresasDoCliente}
            />

            <Button
              onClick={() => {
                if (empresasDoCliente.length > 0) {
                  setEmpresaAtualSelecionada(empresasDoCliente[0]);
                  setUsuarioFormData({
                    nome: '',
                    email: '',
                    senha: '',
                    cliente_id: clienteSelecionado.Cliente_ID,
                    empresa_id: empresasDoCliente[0].id,
                    role: 'admin',
                  });
                  setShowUsuarioDialog(true);
                } else {
                  toast({
                    title: 'Nenhuma empresa disponível',
                    description: 'Crie uma empresa para adicionar usuários',
                    variant: 'destructive',
                  });
                }
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>

            <Card className="border-slate-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Último Login</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuariosDoCliente.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                        Nenhum usuário
                      </TableCell>
                    </TableRow>
                  ) : (
                    usuariosDoCliente.map((usuario) => (
                      <TableRow key={usuario.id}>
                        <TableCell className="font-medium">{usuario.nome}</TableCell>
                        <TableCell>{usuario.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{usuario.role}</Badge>
                        </TableCell>
                        <TableCell>{usuario.ultimo_login ? formatDate(usuario.ultimo_login) : '—'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResetarSenha(usuario.id)}
                            >
                              <KeyRound className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleImpersonate(usuario.id)}
                            >
                              <LogIn className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return null;
}

// Sheet: Nova Empresa
function EmpresaSheet({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onSalvar,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: any;
  onFormDataChange: (data: any) => void;
  onSalvar: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full md:w-2/3 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Nova Empresa</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Seção A: Tipo e Identificação */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              Tipo e Identificação
            </h3>
            <div className="space-y-4">
              <div>
                <Label className="mb-2">Razão Social</Label>
                <Input
                  value={formData.razao_social}
                  onChange={(e) => onFormDataChange({ ...formData, razao_social: e.target.value })}
                  placeholder="Razão social completa"
                />
              </div>
              <div>
                <Label className="mb-2">Nome Fantasia</Label>
                <Input
                  value={formData.nome_fantasia}
                  onChange={(e) => onFormDataChange({ ...formData, nome_fantasia: e.target.value })}
                  placeholder="Nome comercial"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2">CNPJ/CPF*</Label>
                  <Input
                    value={formData.cnpj_cpf}
                    onChange={(e) => onFormDataChange({ ...formData, cnpj_cpf: e.target.value })}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div>
                  <Label className="mb-2">Plano*</Label>
                  <Select value={formData.plano} onValueChange={(v) => onFormDataChange({ ...formData, plano: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="essencial">Essencial - R$ 229</SelectItem>
                      <SelectItem value="profissional">Profissional - R$ 399</SelectItem>
                      <SelectItem value="premium">Premium - R$ 699</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Seção B: Contato */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Phone className="h-5 w-5 text-green-600" />
              Contato
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2">Email*</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => onFormDataChange({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label className="mb-2">Telefone</Label>
                <Input
                  value={formData.telefone}
                  onChange={(e) => onFormDataChange({ ...formData, telefone: e.target.value })}
                  placeholder="(11) 3333-3333"
                />
              </div>
            </div>
          </div>

          {/* Seção C: Endereço */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-purple-600" />
              Endereço
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2">Cidade</Label>
                <Input
                  value={formData.cidade}
                  onChange={(e) => onFormDataChange({ ...formData, cidade: e.target.value })}
                  placeholder="São Paulo"
                />
              </div>
              <div>
                <Label className="mb-2">Estado</Label>
                <Select value={formData.estado} onValueChange={(v) => onFormDataChange({ ...formData, estado: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS.map((e) => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSalvar}>Criar Empresa</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// Dialog: Novo Usuário
function UsuarioDialog({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onSalvar,
  empresas,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: any;
  onFormDataChange: (data: any) => void;
  onSalvar: () => void;
  empresas: Empresa[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Usuário</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-2">Nome*</Label>
            <Input
              value={formData.nome}
              onChange={(e) => onFormDataChange({ ...formData, nome: e.target.value })}
              placeholder="Nome completo"
            />
          </div>
          <div>
            <Label className="mb-2">Email*</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => onFormDataChange({ ...formData, email: e.target.value })}
              placeholder="email@example.com"
            />
          </div>
          <div>
            <Label className="mb-2">Senha*</Label>
            <Input
              type="password"
              value={formData.senha}
              onChange={(e) => onFormDataChange({ ...formData, senha: e.target.value })}
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div>
            <Label className="mb-2">Empresa*</Label>
            <Select
              value={String(formData.empresa_id)}
              onValueChange={(v) => onFormDataChange({ ...formData, empresa_id: Number(v) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar empresa" />
              </SelectTrigger>
              <SelectContent>
                {empresas.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.nome_fantasia}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2">Role</Label>
            <Select value={formData.role} onValueChange={(v) => onFormDataChange({ ...formData, role: v })}>
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSalvar}>Criar Usuário</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
