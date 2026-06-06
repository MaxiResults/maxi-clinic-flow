import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingUp, Building2, UserPlus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface DashboardData {
  mrr: number;
  total_empresas: number;
  total_clientes: number;
  por_plano: {
    essencial: number;
    profissional: number;
    premium: number;
  };
  churn_mes: number;
  novas_mes: number;
  inadimplentes: number;
}

const MetricCardSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="h-4 bg-slate-200 rounded w-24"></div>
    </CardHeader>
    <CardContent>
      <div className="h-8 bg-slate-200 rounded w-32 mb-2"></div>
      <div className="h-3 bg-slate-200 rounded w-20"></div>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/superadmin/dashboard');
        setData(response.data.data);
      } catch (error: any) {
        toast({
          title: 'Erro ao carregar dashboard',
          description: error?.response?.data?.error || 'Tente novamente',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [toast]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-500">Erro ao carregar dados</p>
      </div>
    );
  }

  const totalPlanos = data.por_plano.essencial + data.por_plano.profissional + data.por_plano.premium;
  const churnPercentage = totalPlanos > 0 ? (data.churn_mes / totalPlanos) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center justify-between">
              MRR
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">
              R$ {(data.mrr / 1000).toFixed(1)}k
            </div>
            <p className="text-xs text-slate-500 mt-1">Receita mensal estimada</p>
          </CardContent>
        </Card>

        {/* Total Empresas */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center justify-between">
              Empresas
              <Building2 className="h-5 w-5 text-indigo-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">{data.total_empresas}</div>
            <p className="text-xs text-slate-500 mt-1">Ativas no sistema</p>
          </CardContent>
        </Card>

        {/* Novas Este Mês */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center justify-between">
              Novas
              <UserPlus className="h-5 w-5 text-violet-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-violet-600">+{data.novas_mes}</div>
            <p className="text-xs text-slate-500 mt-1">Este mês</p>
          </CardContent>
        </Card>

        {/* Inadimplentes */}
        <Card className={`border-slate-200 ${data.inadimplentes > 0 ? 'border-amber-200 bg-amber-50' : ''}`}>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center justify-between">
              Inadimplentes
              <AlertCircle className={`h-5 w-5 ${data.inadimplentes > 0 ? 'text-amber-600' : 'text-emerald-600'}`} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${data.inadimplentes > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {data.inadimplentes}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {data.inadimplentes === 0 ? '100% em dia' : 'Requer atenção'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Plano */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Distribuição por Plano</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: 'Essencial', count: data.por_plano.essencial, color: 'slate', colorClass: 'bg-slate-100' },
              { name: 'Profissional', count: data.por_plano.profissional, color: 'indigo', colorClass: 'bg-indigo-100' },
              { name: 'Premium', count: data.por_plano.premium, color: 'violet', colorClass: 'bg-violet-100' },
            ].map((plano) => {
              const percentage = totalPlanos > 0 ? (plano.count / totalPlanos) * 100 : 0;
              return (
                <div key={plano.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">{plano.name}</span>
                    <Badge variant="outline">{plano.count}</Badge>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${plano.colorClass} transition-all duration-300`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Resumo Operacional */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Resumo Operacional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 mb-2">Churn este mês</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{data.churn_mes}</span>
                <span className="text-sm text-slate-500">cancelamentos</span>
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-600 mb-2">Cancelamentos</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{churnPercentage.toFixed(1)}%</span>
                <span className="text-sm text-slate-500">do total</span>
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-600 mb-2">Status Geral</p>
              <Badge
                className={`text-white ${
                  churnPercentage < 5
                    ? 'bg-emerald-600'
                    : churnPercentage < 10
                      ? 'bg-amber-600'
                      : 'bg-red-600'
                }`}
              >
                {churnPercentage < 5 ? '✓ Saudável' : churnPercentage < 10 ? '⚠ Atenção' : '✗ Crítico'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
