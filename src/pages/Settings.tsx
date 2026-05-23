import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  UserCog,
  Package,
  FolderTree,
  Star,
  ArrowRight,
  Building2,
  Users,
  Settings as SettingsIcon,
  Zap,
  MessageSquare,
  FileCode,
} from 'lucide-react';

const configSections = [
  {
    id: 'profissionais',
    title: 'Profissionais',
    description: 'Gerencie profissionais, especialidades e horários',
    icon: UserCog,
    route: '/profissionais',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    count: null, // Será buscado da API depois
  },
  {
    id: 'produtos',
    title: 'Produtos e Serviços',
    description: 'Cadastre produtos, serviços e variações',
    icon: Package,
    route: '/produtos',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    count: null,
  },
  {
    id: 'categorias',
    title: 'Categorias de Produtos',
    description: 'Organize produtos em categorias e grupos',
    icon: FolderTree,
    route: '/categorias',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    count: null,
  },
  {
    id: 'especialidades',
    title: 'Especialidades',
    description: 'Defina especialidades dos profissionais',
    icon: Star,
    route: '/especialidades',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    count: null,
  },
];

export default function Settings() {
  const navigate = useNavigate();

  // Respostas rápidas
  const [respostas, setRespostas] = useState<any[]>([]);
  const [loadingRespostas, setLoadingRespostas] = useState(false);
  const [modalRespostaOpen, setModalRespostaOpen] = useState(false);
  const [respostaEditando, setRespostaEditando] = useState<any>(null);
  const [formResposta, setFormResposta] = useState({
    titulo: '',
    atalho: '',
    conteudo: '',
  });
  const [salvandoResposta, setSalvandoResposta] = useState(false);

  useEffect(() => {
    setLoadingRespostas(true);
    api.get('/respostas-rapidas')
      .then(r => setRespostas(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoadingRespostas(false));
  }, []);

  const abrirNova = () => {
    setRespostaEditando(null);
    setFormResposta({ titulo: '', atalho: '', conteudo: '' });
    setModalRespostaOpen(true);
  };

  const abrirEditar = (r: any) => {
    setRespostaEditando(r);
    setFormResposta({ titulo: r.titulo, atalho: r.atalho, conteudo: r.conteudo });
    setModalRespostaOpen(true);
  };

  const excluirResposta = async (r: any) => {
    if (!confirm('Excluir esta resposta?')) return;
    try {
      await api.delete(`/respostas-rapidas/${r.id}`);
      setRespostas(prev => prev.filter((x: any) => x.id !== r.id));
      toast.success('Resposta excluída');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erro ao excluir');
    }
  };

  const salvarResposta = async () => {
    if (!formResposta.titulo.trim() || !formResposta.atalho.trim() || !formResposta.conteudo.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }
    setSalvandoResposta(true);
    try {
      if (respostaEditando) {
        const r = await api.patch(`/respostas-rapidas/${respostaEditando.id}`, formResposta);
        setRespostas(prev => prev.map((x: any) => (x.id === r.data.id ? r.data : x)));
        toast.success('Resposta atualizada!');
      } else {
        const r = await api.post('/respostas-rapidas', formResposta);
        setRespostas(prev => [...prev, r.data]);
        toast.success('Resposta criada!');
      }
      setModalRespostaOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSalvandoResposta(false);
    }
  };

  return (
    <DashboardLayout title="Configurações">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">⚙️ Configurações</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie cadastros e configurações do seu sistema
          </p>
        </div>

        {/* Seção: Cadastros */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <SettingsIcon className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Cadastros</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {configSections.map((section) => {
              const Icon = section.icon;
              
              return (
                <Card
                  key={section.id}
                  className="hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-primary/50"
                  onClick={() => navigate(section.route)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-lg ${section.bgColor}`}>
                        <Icon className={`h-6 w-6 ${section.color}`} />
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                    <CardTitle className="text-lg mt-4">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {section.count !== null && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {section.count} {section.count === 1 ? 'item' : 'itens'}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Seção: Comunicação */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Comunicação</h2>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Respostas Rápidas
                </CardTitle>
                <CardDescription>
                  Atalhos para mensagens frequentes. Digite / no chat para usar.
                </CardDescription>
              </div>
              <Button size="sm" onClick={abrirNova}>
                <Plus className="h-4 w-4 mr-2" />
                Nova resposta
              </Button>
            </CardHeader>
            <CardContent>
              {loadingRespostas ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : respostas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Zap className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma resposta rápida cadastrada.</p>
                  <p className="text-xs mt-1">Digite / no chat para usar os atalhos.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {respostas.map((r: any) => (
                    <div
                      key={r.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                    >
                      <span className="shrink-0 font-mono text-xs bg-muted px-2 py-1 rounded mt-0.5">
                        /{r.atalho}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{r.titulo}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {r.conteudo}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => abrirEditar(r)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => excluirResposta(r)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Seção: Integrações (futuro) */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Integrações</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="opacity-50">
              <CardHeader>
                <CardTitle className="text-lg">💬 WhatsApp</CardTitle>
                <CardDescription>Em breve</CardDescription>
              </CardHeader>
            </Card>

            <Card className="opacity-50">
              <CardHeader>
                <CardTitle className="text-lg">💳 Pagamentos</CardTitle>
                <CardDescription>Em breve</CardDescription>
              </CardHeader>
            </Card>

            <Card className="opacity-50">
              <CardHeader>
                <CardTitle className="text-lg">📧 E-mail</CardTitle>
                <CardDescription>Em breve</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Seção: Sistema (futuro) */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Sistema</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="opacity-50">
              <CardHeader>
                <CardTitle className="text-lg">👥 Usuários</CardTitle>
                <CardDescription>Em breve</CardDescription>
              </CardHeader>
            </Card>

            <Card className="opacity-50">
              <CardHeader>
                <CardTitle className="text-lg">🏢 Empresa</CardTitle>
                <CardDescription>Em breve</CardDescription>
              </CardHeader>
            </Card>

            <Card className="opacity-50">
              <CardHeader>
                <CardTitle className="text-lg">📊 Relatórios</CardTitle>
                <CardDescription>Em breve</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal criar/editar resposta */}
      <Dialog open={modalRespostaOpen} onOpenChange={setModalRespostaOpen}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>
              {respostaEditando ? 'Editar resposta' : 'Nova resposta rápida'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Título *</label>
              <Input
                placeholder="Ex: Confirmação de consulta"
                value={formResposta.titulo}
                onChange={e => setFormResposta(p => ({ ...p, titulo: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Atalho *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">
                  /
                </span>
                <Input
                  className="pl-7"
                  placeholder="confirmacao"
                  value={formResposta.atalho}
                  onChange={e =>
                    setFormResposta(p => ({
                      ...p,
                      atalho: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                    }))
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Apenas letras minúsculas, números e _.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Conteúdo da mensagem *
              </label>
              <textarea
                className="w-full text-sm border rounded-lg px-3 py-2 bg-background resize-none min-h-[100px]"
                placeholder="Digite o texto completo que será enviado..."
                value={formResposta.conteudo}
                onChange={e => setFormResposta(p => ({ ...p, conteudo: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalRespostaOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarResposta} disabled={salvandoResposta}>
              {respostaEditando ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
