import { useState, useEffect, useCallback, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  Users,
  Target,
  ArrowLeft,
  Copy,
  Check,
  Megaphone,
  BarChart3,
  Link,
  Calendar,
  Tag,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Campanha {
  id: number;
  nome_campanha: string;
  slug: string;
  campanha_status: string;
  tipo: 'interna' | 'digital';
  descricao?: string;
  data_inicio?: string;
  data_fim?: string;
  canal_principal?: string;
  plataforma_ads?: string;
  investimento_total: number;
  url_principal?: string;
  publico_alvo?: string;
  meta_leads: number;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  created_at: string;
  ativo?: boolean;
}

interface MetricasCampanha {
  total_leads: number;
  qualificados: number;
  convertidos: number;
  taxa_conversao: number;
  meta_leads: number;
  progresso_meta: number;
  investimento_total: number;
  cpl: number;
}

interface FormCampanha {
  nome_campanha: string;
  tipo: 'interna' | 'digital';
  campanha_status: string;
  descricao: string;
  canal_principal: string;
  data_inicio: string;
  data_fim: string;
  meta_leads: string;
  investimento_total: string;
  publico_alvo: string;
  url_principal: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
}

const STATUS_CONFIG: Record<
  string,
  { cor: string; bg: string; text: string; label: string }
> = {
  Ativo: {
    cor: '#10B981',
    bg: '#ECFDF5',
    text: '#065F46',
    label: 'Ativa',
  },
  Pausado: {
    cor: '#F59E0B',
    bg: '#FFFBEB',
    text: '#B45309',
    label: 'Pausada',
  },
  Encerrado: {
    cor: '#6B7280',
    bg: '#F9FAFB',
    text: '#374151',
    label: 'Encerrada',
  },
  Rascunho: {
    cor: '#3B82F6',
    bg: '#EFF6FF',
    text: '#1D4ED8',
    label: 'Rascunho',
  },
};

const FORM_INITIAL: FormCampanha = {
  nome_campanha: '',
  tipo: 'interna',
  campanha_status: 'Ativo',
  descricao: '',
  canal_principal: '',
  data_inicio: '',
  data_fim: '',
  meta_leads: '',
  investimento_total: '',
  publico_alvo: '',
  url_principal: '',
  utm_source: '',
  utm_medium: '',
  utm_campaign: '',
  utm_content: '',
};

export default function Campanhas() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect if not admin or gestor
  useEffect(() => {
    if (user && !['admin', 'gestor'].includes(user.role)) {
      navigate('/configuracoes');
    }
  }, [user, navigate]);

  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editandoCampanha, setEditandoCampanha] = useState<Campanha | null>(null);
  const [formData, setFormData] = useState<FormCampanha>(FORM_INITIAL);
  const [salvando, setSalvando] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [metricas, setMetricas] = useState<Record<number, MetricasCampanha>>({});
  const [linkCopiado, setLinkCopiado] = useState<number | null>(null);

  const fetchCampanhas = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/campanhas');
      setCampanhas(response.data || []);

      // Fetch metrics for each campaign in parallel
      if (response.data && response.data.length > 0) {
        const metricasPromises = response.data.map((c: Campanha) =>
          api.get(`/campanhas/${c.id}/metricas`).then((res) => ({
            id: c.id,
            metricas: res.data?.metricas,
          }))
        );

        const metricasResults = await Promise.all(metricasPromises);
        const metricasMap: Record<number, MetricasCampanha> = {};
        metricasResults.forEach(({ id, metricas: m }) => {
          if (m) metricasMap[id] = m;
        });
        setMetricas(metricasMap);
      }
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error);
      toast.error('Erro ao carregar campanhas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampanhas();
  }, [fetchCampanhas]);

  const handleAbrirModal = (campanha?: Campanha) => {
    if (campanha) {
      setEditandoCampanha(campanha);
      setFormData({
        nome_campanha: campanha.nome_campanha,
        tipo: campanha.tipo,
        campanha_status: campanha.campanha_status,
        descricao: campanha.descricao || '',
        canal_principal: campanha.canal_principal || '',
        data_inicio: campanha.data_inicio
          ? campanha.data_inicio.split('T')[0]
          : '',
        data_fim: campanha.data_fim ? campanha.data_fim.split('T')[0] : '',
        meta_leads: String(campanha.meta_leads),
        investimento_total: String(campanha.investimento_total),
        publico_alvo: campanha.publico_alvo || '',
        url_principal: campanha.url_principal || '',
        utm_source: campanha.utm_source || '',
        utm_medium: campanha.utm_medium || '',
        utm_campaign: campanha.utm_campaign || '',
        utm_content: campanha.utm_content || '',
      });
    } else {
      setEditandoCampanha(null);
      setFormData(FORM_INITIAL);
    }
    setModalOpen(true);
  };

  const handleSalvar = async () => {
    if (!formData.nome_campanha.trim()) {
      toast.error('Nome da campanha é obrigatório');
      return;
    }

    try {
      setSalvando(true);

      const payload = {
        nome_campanha: formData.nome_campanha,
        tipo: formData.tipo,
        campanha_status: formData.campanha_status,
        descricao: formData.descricao || null,
        canal_principal: formData.canal_principal || null,
        data_inicio: formData.data_inicio || null,
        data_fim: formData.data_fim || null,
        meta_leads: parseInt(formData.meta_leads) || 0,
        investimento_total: parseFloat(formData.investimento_total) || 0,
        publico_alvo: formData.publico_alvo || null,
        url_principal: formData.url_principal || null,
        utm_source: formData.utm_source || null,
        utm_medium: formData.utm_medium || null,
        utm_campaign: formData.utm_campaign || null,
        utm_content: formData.utm_content || null,
      };

      if (editandoCampanha) {
        await api.patch(`/campanhas/${editandoCampanha.id}`, payload);
        toast.success('Campanha atualizada com sucesso');
      } else {
        await api.post('/campanhas', payload);
        toast.success('Campanha criada com sucesso');
      }

      setModalOpen(false);
      setEditandoCampanha(null);
      setFormData(FORM_INITIAL);
      await fetchCampanhas();
    } catch (error: any) {
      console.error('Erro ao salvar campanha:', error);
      toast.error(
        error.response?.data?.error || 'Erro ao salvar campanha'
      );
    } finally {
      setSalvando(false);
    }
  };

  const handleDeletar = (id: number) => {
    setDeleteConfirmId(id);
  };

  const confirmarDeletar = async () => {
    if (!deleteConfirmId) return;

    try {
      await api.delete(`/campanhas/${deleteConfirmId}`);
      toast.success('Campanha excluída com sucesso');
      setDeleteConfirmId(null);
      await fetchCampanhas();
    } catch (error: any) {
      console.error('Erro ao excluir campanha:', error);
      toast.error(
        error.response?.data?.error || 'Erro ao excluir campanha'
      );
      setDeleteConfirmId(null);
    }
  };

  const gerarLink = (campanha: Campanha): string => {
    if (!campanha.url_principal) return '';

    const params = new URLSearchParams();
    if (campanha.utm_source) params.set('utm_source', campanha.utm_source);
    if (campanha.utm_medium) params.set('utm_medium', campanha.utm_medium);
    if (campanha.utm_campaign)
      params.set('utm_campaign', campanha.utm_campaign);
    if (campanha.utm_content) params.set('utm_content', campanha.utm_content);

    const qs = params.toString();
    return qs ? `${campanha.url_principal}?${qs}` : campanha.url_principal;
  };

  const copiarLink = (campanha: Campanha) => {
    const link = gerarLink(campanha);
    if (!link) return;

    navigator.clipboard.writeText(link);
    setLinkCopiado(campanha.id);
    setTimeout(() => setLinkCopiado(null), 2000);
    toast.success('Link copiado!');
  };

  const campanhasFiltradas = useMemo(() => {
    return campanhas.filter((c) => {
      const matchSearch =
        !searchTerm ||
        c.nome_campanha
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchTipo = filterTipo === 'todos' || c.tipo === filterTipo;
      const matchStatus =
        filterStatus === 'todos' || c.campanha_status === filterStatus;

      return matchSearch && matchTipo && matchStatus;
    });
  }, [campanhas, searchTerm, filterTipo, filterStatus]);

  const statCards = useMemo(
    () => [
      {
        label: 'Total de Campanhas',
        value: campanhas.length,
        icon: Megaphone,
        color: '#6366F1',
      },
      {
        label: 'Campanhas Ativas',
        value: campanhas.filter((c) => c.campanha_status === 'Ativo').length,
        icon: Zap,
        color: '#10B981',
      },
      {
        label: 'Leads Gerados',
        value: Object.values(metricas).reduce((s, m) => s + m.total_leads, 0),
        icon: Users,
        color: '#3B82F6',
      },
      {
        label: 'Convertidos',
        value: Object.values(metricas).reduce((s, m) => s + m.convertidos, 0),
        icon: Target,
        color: '#F59E0B',
      },
    ],
    [campanhas, metricas]
  );

  return (
    <DashboardLayout title="Campanhas">
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .campanha-card-anim { animation: fadeSlideIn 0.35s ease both; }
      `}</style>

      <div className="max-w-6xl mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/configuracoes')}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Campanhas</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Gerencie campanhas e acompanhe o desempenho de captação de
                leads
              </p>
            </div>
          </div>
          <Button onClick={() => handleAbrirModal()} className="rounded-lg shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Campanha
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.map(({ label, value, icon: Icon, color }, idx) => (
            <div
              key={label}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
              style={{
                animation: `fadeSlideIn 0.35s ease both`,
                animationDelay: `${idx * 60}ms`,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-gray-500 truncate">
                  {label}
                </p>
                <div
                  className="p-2 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: `${color}18` }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color }} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 tabular-nums leading-none">
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar campanha..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white border-gray-200 rounded-lg"
            />
          </div>
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-full sm:w-40 bg-white border-gray-200">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="interna">🏢 Interna</SelectItem>
              <SelectItem value="digital">📱 Digital</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-44 bg-white border-gray-200">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="Ativo">✅ Ativa</SelectItem>
              <SelectItem value="Pausado">⏸️ Pausada</SelectItem>
              <SelectItem value="Encerrado">🔴 Encerrada</SelectItem>
              <SelectItem value="Rascunho">📝 Rascunho</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Empty state */}
        {campanhasFiltradas.length === 0 && !loading && (
          <div className="text-center py-16">
            <Megaphone className="h-12 w-12 text-gray-200 mx-auto mb-4" />
            <p className="font-semibold text-gray-700">
              Nenhuma campanha encontrada
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {campanhas.length === 0
                ? 'Crie sua primeira campanha para começar a rastrear leads'
                : 'Tente ajustar os filtros'}
            </p>
            {campanhas.length === 0 && (
              <Button onClick={() => handleAbrirModal()} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Nova Campanha
              </Button>
            )}
          </div>
        )}

        {/* Campaigns Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campanhasFiltradas.map((campanha, idx) => {
              const statusCfg =
                STATUS_CONFIG[campanha.campanha_status] ||
                STATUS_CONFIG['Rascunho'];
              const m = metricas[campanha.id];
              const link = gerarLink(campanha);

              return (
                <div
                  key={campanha.id}
                  className="campanha-card-anim group relative bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  {/* Colored left border */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                    style={{ backgroundColor: statusCfg.cor }}
                  />

                  <div className="pl-4 pr-3 pt-4 pb-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate cursor-pointer hover:text-primary transition-colors">
                          {campanha.nome_campanha}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
                            style={{
                              backgroundColor: statusCfg.bg,
                              color: statusCfg.text,
                            }}
                          >
                            {statusCfg.label}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {campanha.tipo === 'interna'
                              ? '🏢 Interna'
                              : '📱 Digital'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Canal */}
                    {campanha.canal_principal && (
                      <p className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
                        <Tag className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">
                          {campanha.canal_principal}
                        </span>
                      </p>
                    )}

                    {/* Metrics */}
                    {m && (
                      <div className="grid grid-cols-3 gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <p className="text-sm font-bold text-gray-900">
                            {m.total_leads}
                          </p>
                          <p className="text-[10px] text-gray-400">Leads</p>
                        </div>
                        <div className="text-center border-x border-gray-200">
                          <p className="text-sm font-bold text-gray-900">
                            {m.convertidos}
                          </p>
                          <p className="text-[10px] text-gray-400">Convert.</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-gray-900">
                            {m.taxa_conversao}%
                          </p>
                          <p className="text-[10px] text-gray-400">Taxa</p>
                        </div>
                      </div>
                    )}

                    {/* Goal progress bar */}
                    {m && m.meta_leads > 0 && (
                      <div className="mb-3">
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                          <span>Meta: {m.meta_leads} leads</span>
                          <span>{m.progresso_meta}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(m.progresso_meta, 100)}%`,
                              backgroundColor: statusCfg.cor,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Footer: date + quick actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                      <p className="text-[10px] text-gray-400">
                        {campanha.data_inicio
                          ? format(parseISO(campanha.data_inicio), 'dd/MM/yy', {
                              locale: ptBR,
                            })
                          : format(parseISO(campanha.created_at), 'dd/MM/yy', {
                              locale: ptBR,
                            })}
                      </p>

                      {/* Quick actions */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {link && (
                          <button
                            onClick={() => copiarLink(campanha)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Copiar link rastreável"
                          >
                            {linkCopiado === campanha.id ? (
                              <Check className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <Link className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleAbrirModal(campanha)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                          title="Editar"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletar(campanha.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Create/Edit */}
      <Dialog open={modalOpen} onOpenChange={(open) => {
        if (!open) setModalOpen(false);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editandoCampanha ? 'Editar Campanha' : 'Nova Campanha'}
            </DialogTitle>
            <DialogDescription>
              {editandoCampanha
                ? 'Atualize os dados da campanha'
                : 'Preencha os dados para criar uma nova campanha'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label>Nome da campanha *</Label>
              <Input
                value={formData.nome_campanha}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    nome_campanha: e.target.value,
                  }))
                }
                placeholder="Ex: Reativação Botox Jun/2026"
              />
            </div>

            {/* Type + Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tipo *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(val) =>
                    setFormData((p) => ({
                      ...p,
                      tipo: val as 'interna' | 'digital',
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interna">
                      🏢 Interna (ativa, sem anúncios)
                    </SelectItem>
                    <SelectItem value="digital">
                      📱 Digital (Meta Ads, Google, etc)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={formData.campanha_status}
                  onValueChange={(val) =>
                    setFormData((p) => ({
                      ...p,
                      campanha_status: val,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rascunho">📝 Rascunho</SelectItem>
                    <SelectItem value="Ativo">✅ Ativa</SelectItem>
                    <SelectItem value="Pausado">⏸️ Pausada</SelectItem>
                    <SelectItem value="Encerrado">🔴 Encerrada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Channel + Meta */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Canal principal</Label>
                <Input
                  value={formData.canal_principal}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      canal_principal: e.target.value,
                    }))
                  }
                  placeholder="Ex: Instagram, WhatsApp"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Meta de leads</Label>
                <Input
                  type="number"
                  value={formData.meta_leads}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      meta_leads: e.target.value,
                    }))
                  }
                  placeholder="Ex: 50"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Data início</Label>
                <Input
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      data_inicio: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Data fim</Label>
                <Input
                  type="date"
                  value={formData.data_fim}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      data_fim: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {/* Investment + Audience */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Investimento (R$)</Label>
                <Input
                  type="number"
                  value={formData.investimento_total}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      investimento_total: e.target.value,
                    }))
                  }
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Público-alvo</Label>
                <Input
                  value={formData.publico_alvo}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      publico_alvo: e.target.value,
                    }))
                  }
                  placeholder="Ex: Mulheres 30-50 anos"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    descricao: e.target.value,
                  }))
                }
                placeholder="Descreva o objetivo da campanha..."
                rows={2}
              />
            </div>

            {/* UTM Section — only for digital type */}
            {formData.tipo === 'digital' && (
              <div className="border rounded-xl p-4 space-y-3 bg-gray-50">
                <div className="flex items-center gap-2">
                  <Link className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-gray-700">
                    Rastreamento UTM & Link
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label>URL da página de destino</Label>
                  <Input
                    value={formData.url_principal}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        url_principal: e.target.value,
                      }))
                    }
                    placeholder="https://seusite.com.br/pagina"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">utm_source</Label>
                    <Input
                      value={formData.utm_source}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          utm_source: e.target.value,
                        }))
                      }
                      placeholder="instagram"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">utm_medium</Label>
                    <Input
                      value={formData.utm_medium}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          utm_medium: e.target.value,
                        }))
                      }
                      placeholder="paid"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">utm_campaign</Label>
                    <Input
                      value={formData.utm_campaign}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          utm_campaign: e.target.value,
                        }))
                      }
                      placeholder="botox-junho-2026"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">utm_content</Label>
                    <Input
                      value={formData.utm_content}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          utm_content: e.target.value,
                        }))
                      }
                      placeholder="banner-1"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {/* Preview of generated link */}
                {formData.url_principal && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500">
                      Link rastreável gerado:
                    </Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-[10px] bg-white border rounded p-2 truncate text-gray-600">
                        {(() => {
                          const params = new URLSearchParams();
                          if (formData.utm_source)
                            params.set('utm_source', formData.utm_source);
                          if (formData.utm_medium)
                            params.set('utm_medium', formData.utm_medium);
                          if (formData.utm_campaign)
                            params.set(
                              'utm_campaign',
                              formData.utm_campaign
                            );
                          if (formData.utm_content)
                            params.set('utm_content', formData.utm_content);
                          const qs = params.toString();
                          return qs
                            ? `${formData.url_principal}?${qs}`
                            : formData.url_principal;
                        })()}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          const params = new URLSearchParams();
                          if (formData.utm_source)
                            params.set('utm_source', formData.utm_source);
                          if (formData.utm_medium)
                            params.set('utm_medium', formData.utm_medium);
                          if (formData.utm_campaign)
                            params.set(
                              'utm_campaign',
                              formData.utm_campaign
                            );
                          if (formData.utm_content)
                            params.set('utm_content', formData.utm_content);
                          const qs = params.toString();
                          navigator.clipboard.writeText(
                            qs
                              ? `${formData.url_principal}?${qs}`
                              : formData.url_principal
                          );
                          toast.success('Link copiado!');
                        }}
                        className="p-2 rounded-lg border bg-white hover:bg-gray-50 transition-colors flex-shrink-0"
                      >
                        <Copy className="h-3.5 w-3.5 text-gray-500" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSalvar}
              disabled={salvando || !formData.nome_campanha.trim()}
            >
              {salvando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editandoCampanha ? 'Salvar Alterações' : 'Criar Campanha'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir campanha?</AlertDialogTitle>
            <AlertDialogDescription>
              Os leads vinculados serão desassociados mas não excluídos. Esta
              ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={confirmarDeletar}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
