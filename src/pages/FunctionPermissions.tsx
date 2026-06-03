import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle, Loader2, Zap, CheckCircle,
  XCircle, Clock, BarChart3, Activity,
  ChevronDown, ChevronUp, Settings2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────

type ConfigField = {
  key: string;
  label: string;
  type: 'number' | 'boolean';
  placeholder?: string;
  hint?: string;
};

type FunctionMeta = {
  name: string;
  label: string;
  descricao: string;
  icone: string;
  configFields: ConfigField[];
  risco: 'baixo' | 'medio' | 'alto';
};

type Permission = {
  function_name: string;
  enabled: boolean;
  config: Record<string, any>;
};

type Execution = {
  id: string;
  function_name: string;
  execution_status: string;
  execution_time_ms: number;
  error_message?: string;
  created_at: string;
};

type FunctionStats = {
  total: number;
  executacoesHoje: number;
  sucessos: number;
  erros: number;
  taxaSucesso: number;
  tempoMedio: number;
  funcaoMaisUsada: string | null;
  porFuncao: Array<{
    function_name: string;
    total: number;
    sucessos: number;
    erros: number;
  }>;
};

// ─── Metadata das funções ─────────────────────────────────────────────────

const FUNCTIONS_META: FunctionMeta[] = [
  {
    name: 'buscarHorariosDisponiveis',
    label: 'Buscar Horários',
    descricao: 'IA consulta horários disponíveis na agenda antes de sugerir agendamentos ao paciente.',
    icone: '🔍',
    configFields: [],
    risco: 'baixo',
  },
  {
    name: 'criarAgendamento',
    label: 'Criar Agendamento',
    descricao: 'IA cria agendamentos automaticamente sem intervenção do atendente.',
    icone: '📅',
    configFields: [
      {
        key: 'max_valor_automatico',
        label: 'Valor máximo para criação automática (R$)',
        type: 'number',
        placeholder: '2000',
        hint: 'Agendamentos acima deste valor são encaminhados para atendente.',
      },
    ],
    risco: 'alto',
  },
  {
    name: 'buscarAgendamentos',
    label: 'Buscar Agendamentos',
    descricao: 'IA consulta os agendamentos existentes do paciente quando solicitado.',
    icone: '📋',
    configFields: [],
    risco: 'baixo',
  },
  {
    name: 'reagendarAgendamento',
    label: 'Reagendar Consulta',
    descricao: 'IA reagenda automaticamente consultas existentes mediante solicitação.',
    icone: '🔄',
    configFields: [],
    risco: 'medio',
  },
  {
    name: 'cancelarAgendamento',
    label: 'Cancelar Agendamento',
    descricao: 'IA cancela agendamentos mediante solicitação do paciente.',
    icone: '❌',
    configFields: [
      {
        key: 'permitir_cancelamento_tardio',
        label: 'Permitir cancelamento com menos de 24h',
        type: 'boolean',
        hint: 'Se desativado, cancelamentos próximos são encaminhados para atendente.',
      },
    ],
    risco: 'medio',
  },
];

const RISCO_CONFIG = {
  baixo: { cor: '#10B981', bg: '#ECFDF5', text: '#065F46', label: 'Risco baixo' },
  medio: { cor: '#F59E0B', bg: '#FFFBEB', text: '#B45309', label: 'Risco médio' },
  alto:  { cor: '#EF4444', bg: '#FEF2F2', text: '#991B1B', label: 'Risco alto'  },
};

const FUNCTION_LABELS: Record<string, string> = {
  buscarHorariosDisponiveis: 'Buscar Horários',
  criarAgendamento: 'Criar Agendamento',
  buscarAgendamentos: 'Buscar Agendamentos',
  reagendarAgendamento: 'Reagendar',
  cancelarAgendamento: 'Cancelar Agendamento',
};

// ─── Componente principal ─────────────────────────────────────────────────

export default function FunctionPermissions() {
  const { toast } = useToast();
  const [localConfigs, setLocalConfigs] = useState<Record<string, Record<string, any>>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Query: permissões
  const { data: permissions, isLoading, refetch } = useQuery({
    queryKey: ['function-permissions'],
    queryFn: async () => {
      const res = await api.get('/ai/function-permissions');
      const data = (res.data?.data ?? res.data) as Permission[];
      const configs: Record<string, Record<string, any>> = {};
      data.forEach(p => { configs[p.function_name] = p.config || {}; });
      setLocalConfigs(configs);
      return data;
    },
    retry: false,
    staleTime: 1000 * 60 * 2,
  });

  // Query: stats
  const { data: stats } = useQuery<FunctionStats>({
    queryKey: ['function-stats'],
    queryFn: async () => {
      const res = await api.get('/ai/function-stats?periodo=7');
      return res.data?.data ?? res.data;
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  // Query: execuções recentes
  const { data: execucoes } = useQuery<Execution[]>({
    queryKey: ['function-executions'],
    queryFn: async () => {
      const res = await api.get('/ai/function-executions?limit=10');
      const data = res.data?.data ?? res.data;
      return Array.isArray(data) ? data : [];
    },
    retry: false,
    staleTime: 1000 * 60 * 2,
  });

  const getPermission = (fn: string) =>
    permissions?.find(p => p.function_name === fn);

  const handleToggle = async (functionName: string, enabled: boolean) => {
    setSaving(functionName);
    try {
      await api.patch(`/ai/function-permissions/${functionName}`, { enabled });
      await refetch();
      toast({ title: enabled ? `✅ Função ativada` : `⛔ Função desativada` });
    } catch {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  const handleSaveConfig = async (functionName: string) => {
    setSaving(functionName);
    try {
      await api.patch(`/ai/function-permissions/${functionName}`, {
        config: localConfigs[functionName] || {},
      });
      await refetch();
      toast({ title: '✅ Configuração salva!' });
    } catch {
      toast({ title: 'Erro ao salvar configuração', variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  return (
    <DashboardLayout title="Automações IA">
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="max-w-3xl mx-auto space-y-6 p-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Automações IA
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Controle quais ações a IA pode executar automaticamente no atendimento
            </p>
          </div>
          <div className="p-3 rounded-xl bg-violet-50">
            <Zap className="h-6 w-6 text-violet-600" />
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: 'Execuções hoje',
              value: stats?.executacoesHoje ?? '—',
              icon: Activity,
              color: '#6366F1',
            },
            {
              label: 'Taxa de sucesso',
              value: stats ? `${stats.taxaSucesso}%` : '—',
              icon: CheckCircle,
              color: '#10B981',
            },
            {
              label: 'Erros (7 dias)',
              value: stats?.erros ?? '—',
              icon: XCircle,
              color: '#EF4444',
            },
            {
              label: 'Tempo médio',
              value: stats ? `${stats.tempoMedio}ms` : '—',
              icon: Clock,
              color: '#F59E0B',
            },
          ].map(({ label, value, icon: Icon, color }, idx) => (
            <div
              key={label}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
              style={{
                animation: 'fadeSlideIn 0.35s ease both',
                animationDelay: `${idx * 60}ms`,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-500 truncate">{label}</p>
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${color}18` }}>
                  <Icon className="h-3.5 w-3.5" style={{ color }} />
                </div>
              </div>
              <p className="text-xl font-bold text-gray-900 tabular-nums">{value}</p>
            </div>
          ))}
        </div>

        {/* Alerta */}
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900 text-sm">
              Atenção ao ativar automações de risco alto
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Funções marcadas como risco alto criam ações reais na plataforma.
              Configure os limites antes de ativar.
            </p>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Cards de funções */}
        {!isLoading && FUNCTIONS_META.map((func, idx) => {
          const perm = getPermission(func.name);
          const isEnabled = perm?.enabled ?? true;
          const isSaving = saving === func.name;
          const risco = RISCO_CONFIG[func.risco];
          const isExpanded = expandedCard === func.name;
          const hasConfig = func.configFields.length > 0;
          const execCount = stats?.porFuncao.find(
            f => f.function_name === func.name
          )?.total ?? 0;

          return (
            <div
              key={func.name}
              className="group relative bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
              style={{
                animation: 'fadeSlideIn 0.35s ease both',
                animationDelay: `${(idx + 4) * 60}ms`,
              }}
            >
              {/* Borda lateral colorida por risco */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                style={{ backgroundColor: isEnabled ? risco.cor : '#D1D5DB' }}
              />

              <div className="pl-5 pr-4 py-4">
                {/* Header do card */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xl flex-shrink-0">{func.icone}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-gray-900">
                          {func.label}
                        </span>
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ backgroundColor: risco.bg, color: risco.text }}
                        >
                          {risco.label}
                        </span>
                        {execCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
                            <BarChart3 className="h-2.5 w-2.5" />
                            {execCount}x (7d)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                        {func.descricao}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Toggle */}
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    ) : (
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={v => handleToggle(func.name, v)}
                      />
                    )}
                    {/* Expandir configurações */}
                    {hasConfig && (
                      <button
                        onClick={() => setExpandedCard(
                          isExpanded ? null : func.name
                        )}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        title="Configurações"
                      >
                        {isExpanded
                          ? <ChevronUp className="h-4 w-4" />
                          : <Settings2 className="h-4 w-4" />
                        }
                      </button>
                    )}
                  </div>
                </div>

                {/* Configurações expandidas */}
                {isExpanded && hasConfig && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    {func.configFields.map(field => (
                      <div key={field.key} className="space-y-1.5">
                        <Label className="text-xs">{field.label}</Label>
                        {field.type === 'number' ? (
                          <Input
                            type="number"
                            placeholder={field.placeholder}
                            value={localConfigs[func.name]?.[field.key] ?? ''}
                            onChange={e => setLocalConfigs(prev => ({
                              ...prev,
                              [func.name]: {
                                ...prev[func.name],
                                [field.key]: Number(e.target.value),
                              },
                            }))}
                            className="h-8 text-sm max-w-xs"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={localConfigs[func.name]?.[field.key] ?? true}
                              onCheckedChange={v => setLocalConfigs(prev => ({
                                ...prev,
                                [func.name]: {
                                  ...prev[func.name],
                                  [field.key]: v,
                                },
                              }))}
                            />
                            <span className="text-xs text-gray-500">
                              {localConfigs[func.name]?.[field.key] ? 'Ativado' : 'Desativado'}
                            </span>
                          </div>
                        )}
                        {field.hint && (
                          <p className="text-[10px] text-gray-400">{field.hint}</p>
                        )}
                      </div>
                    ))}
                    <Button
                      size="sm"
                      onClick={() => handleSaveConfig(func.name)}
                      disabled={isSaving}
                      className="h-8 mt-1"
                    >
                      {isSaving
                        ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        : null
                      }
                      Salvar configuração
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Tabela de execuções recentes */}
        {execucoes && execucoes.length > 0 && (
          <div
            className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
            style={{ animation: 'fadeSlideIn 0.35s ease both', animationDelay: '600ms' }}
          >
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Activity className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700">
                Execuções recentes
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Função
                    </th>
                    <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">
                      Tempo
                    </th>
                    <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                      Data/hora
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {execucoes.map(exec => (
                    <tr key={exec.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <span className="text-xs font-medium text-gray-700">
                          {FUNCTION_LABELS[exec.function_name] || exec.function_name}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {exec.execution_status === 'success' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle className="h-2.5 w-2.5" />
                            Sucesso
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full"
                            title={exec.error_message || ''}>
                            <XCircle className="h-2.5 w-2.5" />
                            Erro
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        <span className="text-xs text-gray-400">
                          {exec.execution_time_ms ? `${exec.execution_time_ms}ms` : '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <span className="text-xs text-gray-400">
                          {format(parseISO(exec.created_at), "dd/MM HH:mm", { locale: ptBR })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}