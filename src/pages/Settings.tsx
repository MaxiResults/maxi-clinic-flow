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
  Settings as SettingsIcon
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
    </DashboardLayout>
  );
}
