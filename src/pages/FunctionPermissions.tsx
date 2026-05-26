import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

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

const FUNCTIONS_META: FunctionMeta[] = [
  {
    name: 'buscarHorariosDisponiveis',
    label: '🔍 Buscar Horários',
    descricao: 'IA consulta horários disponíveis na agenda antes de sugerir agendamentos',
    icone: '🔍',
    configFields: [],
    risco: 'baixo',
  },
  {
    name: 'criarAgendamento',
    label: '📅 Criar Agendamento',
    descricao: 'IA cria agendamentos automaticamente sem precisar de atendente',
    icone: '📅',
    configFields: [
      {
        key: 'max_valor_automatico',
        label: 'Valor máximo para criação automática (R$)',
        type: 'number',
        placeholder: '2000',
        hint: 'Agendamentos acima deste valor serão encaminhados para atendente',
      },
    ],
    risco: 'alto',
  },
  {
    name: 'buscarAgendamentos',
    label: '📋 Buscar Agendamentos',
    descricao: 'IA consulta agendamentos existentes do paciente',
    icone: '📋',
    configFields: [],
    risco: 'baixo',
  },
  {
    name: 'reagendarAgendamento',
    label: '🔄 Reagendar',
    descricao: 'IA reagenda automaticamente consultas existentes',
    icone: '🔄',
    configFields: [],
    risco: 'medio',
  },
  {
    name: 'cancelarAgendamento',
    label: '❌ Cancelar Agendamento',
    descricao: 'IA cancela agendamentos mediante solicitação do paciente',
    icone: '❌',
    configFields: [
      {
        key: 'permitir_cancelamento_tardio',
        label: 'Permitir cancelamento tardio (menos de 24h)',
        type: 'boolean',
        hint: 'Se desativado, cancelamentos próximos são encaminhados para atendente',
      },
    ],
    risco: 'medio',
  },
];

type Permission = {
  function_name: string;
  enabled: boolean;
  config: Record<string, any>;
};

const RISCO_BADGE: Record<FunctionMeta['risco'], { label: string; className: string }> = {
  baixo: { label: 'Risco baixo', className: 'bg-green-100 text-green-700' },
  medio: { label: 'Risco médio', className: 'bg-yellow-100 text-yellow-700' },
  alto: { label: 'Risco alto', className: 'bg-red-100 text-red-700' },
};

export default function FunctionPermissions() {
  const { toast } = useToast();
  const [localConfigs, setLocalConfigs] = useState<Record<string, Record<string, any>>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const { data: permissions, isLoading, refetch } = useQuery({
    queryKey: ['function-permissions'],
    queryFn: async () => {
      const res = await api.get('/ai/function-permissions');
      const data = (res.data?.data ?? res.data) as Permission[];
      const configs: Record<string, Record<string, any>> = {};
      data.forEach((p) => {
        configs[p.function_name] = p.config || {};
      });
      setLocalConfigs(configs);
      return data;
    },
  });

  const getPermission = (functionName: string) =>
    permissions?.find((p) => p.function_name === functionName);

  const handleToggle = async (functionName: string, enabled: boolean) => {
    setSaving(functionName);
    try {
      await api.patch(`/ai/function-permissions/${functionName}`, { enabled });
      await refetch();
      toast({
        title: enabled ? `✅ ${functionName} ativada` : `⛔ ${functionName} desativada`,
      });
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
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">⚡ Automações IA</h1>
          <p className="text-muted-foreground mt-2">
            Controle quais ações a IA pode executar automaticamente
          </p>
        </div>

        {/* Alerta */}
        <div className="flex gap-3 rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900 p-4">
          <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-900 dark:text-yellow-200">
              Atenção ao ativar automações
            </p>
            <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
              Functions com risco alto criam ações reais na plataforma. Configure limites antes de
              ativar.
            </p>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        )}

        {/* Lista */}
        {!isLoading &&
          FUNCTIONS_META.map((func) => {
            const perm = getPermission(func.name);
            const isEnabled = perm?.enabled ?? true;
            const isSaving = saving === func.name;
            const riscoBadge = RISCO_BADGE[func.risco];

            return (
              <Card key={func.name}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-lg">{func.label}</CardTitle>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${riscoBadge.className}`}
                        >
                          {riscoBadge.label}
                        </span>
                      </div>
                      <CardDescription className="mt-1">{func.descricao}</CardDescription>
                    </div>
                    <Switch
                      checked={isEnabled}
                      disabled={isSaving}
                      onCheckedChange={(checked) => handleToggle(func.name, checked)}
                    />
                  </div>
                </CardHeader>

                {isEnabled && func.configFields.length > 0 && (
                  <CardContent>
                    <div className="border-t pt-4 space-y-4">
                      {func.configFields.map((field) => (
                        <div key={field.key} className="space-y-2">
                          <label className="text-sm font-medium block">{field.label}</label>

                          {field.type === 'number' && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">R$</span>
                              <input
                                type="number"
                                value={localConfigs[func.name]?.[field.key] ?? ''}
                                onChange={(e) =>
                                  setLocalConfigs((prev) => ({
                                    ...prev,
                                    [func.name]: {
                                      ...prev[func.name],
                                      [field.key]: Number(e.target.value),
                                    },
                                  }))
                                }
                                placeholder={field.placeholder}
                                className="border rounded-lg px-3 py-1.5 text-sm bg-background w-32"
                              />
                            </div>
                          )}

                          {field.type === 'boolean' && (
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={!!localConfigs[func.name]?.[field.key]}
                                onCheckedChange={(checked) =>
                                  setLocalConfigs((prev) => ({
                                    ...prev,
                                    [func.name]: {
                                      ...prev[func.name],
                                      [field.key]: checked,
                                    },
                                  }))
                                }
                              />
                              <span className="text-sm text-muted-foreground">
                                {localConfigs[func.name]?.[field.key] ? 'Permitido' : 'Bloqueado'}
                              </span>
                            </div>
                          )}

                          {field.hint && (
                            <p className="text-xs text-muted-foreground">{field.hint}</p>
                          )}
                        </div>
                      ))}

                      <Button
                        size="sm"
                        onClick={() => handleSaveConfig(func.name)}
                        disabled={isSaving}
                        className="mt-1"
                      >
                        {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                        Salvar configuração
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
      </div>
    </DashboardLayout>
  );
}