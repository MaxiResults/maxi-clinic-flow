import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot, Lightbulb, Loader2, Save, Clock, CalendarDays, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface AIConfigForm {
  enabled: boolean;
  model: string;
  auto_respond_enabled: boolean;
  confidence_threshold: number;
  horario_inicio: string;
  horario_fim: string;
  dias_semana: string[];
  intents_bloqueados: string[];
  intents_auto_respond: string[];
}

const DIAS_SEMANA = [
  { key: 'segunda-feira', label: 'Seg' },
  { key: 'terça-feira', label: 'Ter' },
  { key: 'quarta-feira', label: 'Qua' },
  { key: 'quinta-feira', label: 'Qui' },
  { key: 'sexta-feira', label: 'Sex' },
  { key: 'sábado', label: 'Sáb' },
  { key: 'domingo', label: 'Dom' },
];

const ALL_INTENTS = [
  { key: 'saudacao', label: '👋 Saudação', descricao: 'Cumprimentos iniciais' },
  { key: 'informacao_procedimento', label: '💉 Info Procedimento', descricao: 'Dúvidas sobre serviços e preços' },
  { key: 'horario_funcionamento', label: '🕐 Horário Funcionamento', descricao: 'Quando a clínica abre/fecha' },
  { key: 'localizacao', label: '📍 Localização', descricao: 'Endereço da clínica' },
  { key: 'duvida_geral', label: '❓ Dúvida Geral', descricao: 'Perguntas diversas' },
  { key: 'agendamento_novo', label: '📅 Agendar', descricao: 'Novo agendamento' },
  { key: 'reagendar', label: '🔄 Reagendar', descricao: 'Mudar data/hora' },
  { key: 'cancelar', label: '❌ Cancelar', descricao: 'Cancelar agendamento' },
  { key: 'reclamacao', label: '😤 Reclamação', descricao: 'Cliente insatisfeito' },
  { key: 'emergencia', label: '🚨 Emergência', descricao: 'Urgência médica' },
  { key: 'falar_com_atendente', label: '🧑 Falar com Atendente', descricao: 'Pedir humano' },
];

export default function ConfiguracaoIA() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);
  const [form, setForm] = useState<AIConfigForm>({
    enabled: false,
    model: 'claude-haiku-4-5',
    auto_respond_enabled: false,
    confidence_threshold: 85,
    horario_inicio: '08:00',
    horario_fim: '18:00',
    dias_semana: ['segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira'],
    intents_bloqueados: ['agendamento_novo', 'reagendar', 'cancelar', 'reclamacao', 'emergencia'],
    intents_auto_respond: ['informacao_procedimento', 'horario_funcionamento', 'localizacao', 'duvida_geral'],
  });

  const queryClient = useQueryClient();

  const { data: serverData, isLoading } = useQuery({
    queryKey: ['ai-config'],
    queryFn: async () => {
      const res = await api.get('/ai/config');
      return res.data?.data ?? {};
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (serverData && !formInitialized) {
      setForm({
        enabled: serverData.enabled ?? false,
        model: serverData.model ?? 'claude-haiku-4-5',
        auto_respond_enabled: serverData.auto_respond_enabled ?? false,
        confidence_threshold: serverData.confidence_threshold ?? 85,
        horario_inicio: serverData.horario_inicio ?? '08:00',
        horario_fim: serverData.horario_fim ?? '18:00',
        dias_semana: serverData.dias_semana ?? ['segunda-feira', 'terça-feira',
          'quarta-feira', 'quinta-feira', 'sexta-feira'],
        intents_bloqueados: serverData.intents_bloqueados ?? [],
        intents_auto_respond: serverData.intents_auto_respond ?? [],
      });
      setFormInitialized(true);
    }
  }, [serverData, formInitialized]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/ai/config', form);
      queryClient.setQueryData(['ai-config'], form);
      toast({ title: 'Configurações salvas com sucesso!' });
    } catch (err) {
      toast({ title: 'Erro ao salvar configurações', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const isHaiku = form.model === 'claude-haiku-4-5';

  const toggleDia = (dia: string) => {
    setForm((prev) => ({
      ...prev,
      dias_semana: prev.dias_semana.includes(dia)
        ? prev.dias_semana.filter((d) => d !== dia)
        : [...prev.dias_semana, dia],
    }));
  };

  const toggleIntent = (intentKey: string, tipo: 'auto_respond' | 'bloqueado') => {
    if (tipo === 'auto_respond') {
      setForm((prev) => ({
        ...prev,
        intents_auto_respond: prev.intents_auto_respond.includes(intentKey)
          ? prev.intents_auto_respond.filter((i) => i !== intentKey)
          : [...prev.intents_auto_respond, intentKey],
        intents_bloqueados: prev.intents_bloqueados.filter((i) => i !== intentKey),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        intents_bloqueados: prev.intents_bloqueados.includes(intentKey)
          ? prev.intents_bloqueados.filter((i) => i !== intentKey)
          : [...prev.intents_bloqueados, intentKey],
        intents_auto_respond: prev.intents_auto_respond.filter((i) => i !== intentKey),
      }));
    }
  };

  if (isLoading || !formInitialized) {
    return (
      <DashboardLayout title="Assistente IA">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando configurações...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Assistente IA">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">🤖 Assistente IA</h1>
          <p className="text-muted-foreground mt-2">
            Configure como o assistente IA irá interagir com seus pacientes
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <>
            {/* Seção 1 — Status */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Assistente IA
                      {form.enabled ? (
                        <Badge className="bg-green-500 hover:bg-green-600">Ativo</Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Ative para que a IA responda mensagens automaticamente
                    </CardDescription>
                  </div>
                  <Switch
                    checked={form.enabled}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))}
                  />
                </div>
              </CardHeader>
            </Card>

            {/* Seção 2 — Modelo */}
            <Card>
              <CardHeader>
                <CardTitle>Modelo de Linguagem</CardTitle>
                <CardDescription>
                  Modelos mais avançados oferecem mais qualidade, porém com maior custo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select
                  value={form.model}
                  onValueChange={(v) => setForm((f) => ({ ...f, model: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claude-haiku-4-5">
                      Claude Haiku 4.5 — Rápido e econômico
                    </SelectItem>
                    <SelectItem value="claude-sonnet-4-6">
                      Claude Sonnet 4.6 — Mais inteligente
                    </SelectItem>
                  </SelectContent>
                </Select>
                {isHaiku ? (
                  <Badge variant="secondary">~R$ 0,01/conversa</Badge>
                ) : (
                  <Badge className="bg-orange-500 hover:bg-orange-600">~R$ 0,05/conversa</Badge>
                )}
              </CardContent>
            </Card>

            {/* Seção 3 — Modo de Operação */}
            <Card>
              <CardHeader>
                <CardTitle>Como a IA deve atuar?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, auto_respond_enabled: true }))}
                  className={`w-full flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all ${
                    form.auto_respond_enabled
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Bot className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium">Resposta Automática</div>
                    <div className="text-sm text-muted-foreground">
                      IA responde automaticamente com base no confidence threshold
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, auto_respond_enabled: false }))}
                  className={`w-full flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all ${
                    !form.auto_respond_enabled
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium">Apenas Sugestões</div>
                    <div className="text-sm text-muted-foreground">
                      IA sugere respostas mas o atendente decide o que enviar
                    </div>
                  </div>
                </button>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      Threshold de Confiança: {form.confidence_threshold}%
                    </label>
                  </div>
                  <Slider
                    min={50}
                    max={100}
                    step={1}
                    value={[form.confidence_threshold]}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, confidence_threshold: v[0] }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    IA só responde automaticamente se confiança ≥ {form.confidence_threshold}%
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Seção 4 — Horário de Funcionamento */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <div>
                    <CardTitle>Horário de Funcionamento</CardTitle>
                    <CardDescription>
                      A IA só responderá automaticamente neste horário
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Início</label>
                    <input
                      type="time"
                      value={form.horario_inicio}
                      onChange={(e) => setForm((prev) => ({ ...prev, horario_inicio: e.target.value }))}
                      className="border rounded-lg px-3 py-2 text-sm bg-background w-32"
                    />
                  </div>
                  <div className="flex items-center pt-5 text-muted-foreground">até</div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Fim</label>
                    <input
                      type="time"
                      value={form.horario_fim}
                      onChange={(e) => setForm((prev) => ({ ...prev, horario_fim: e.target.value }))}
                      className="border rounded-lg px-3 py-2 text-sm bg-background w-32"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  ⏰ Fora deste horário, a IA fica inativa e mensagens ficam aguardando
                </p>
              </CardContent>
            </Card>

            {/* Seção 5 — Dias da Semana */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-purple-500" />
                  <div>
                    <CardTitle>Dias de Atendimento</CardTitle>
                    <CardDescription>Dias em que a IA estará ativa</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {DIAS_SEMANA.map((dia) => {
                    const ativo = form.dias_semana.includes(dia.key);
                    return (
                      <button
                        key={dia.key}
                        type="button"
                        onClick={() => toggleDia(dia.key)}
                        className={`w-12 h-12 rounded-xl text-sm font-semibold transition-all ${
                          ativo
                            ? 'bg-purple-500 text-white shadow-sm'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {dia.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  📅 {form.dias_semana.length} dia{form.dias_semana.length !== 1 ? 's' : ''} selecionado
                  {form.dias_semana.length !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>

            {/* Seção 6 — Intents */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <div>
                    <CardTitle>Comportamento por Intenção</CardTitle>
                    <CardDescription>
                      Defina como a IA reage a cada tipo de mensagem
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4 text-xs flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                    Auto-responde
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />
                    Faz handoff
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-gray-200 inline-block" />
                    Não configurado
                  </span>
                </div>
                <div className="space-y-2">
                  {ALL_INTENTS.map((intent) => {
                    const isAutoRespond = form.intents_auto_respond.includes(intent.key);
                    const isBloqueado = form.intents_bloqueados.includes(intent.key);
                    return (
                      <div
                        key={intent.key}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="text-sm font-medium">{intent.label}</p>
                          <p className="text-xs text-muted-foreground">{intent.descricao}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleIntent(intent.key, 'auto_respond')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                              isAutoRespond
                                ? 'bg-green-500 text-white'
                                : 'bg-muted text-muted-foreground hover:bg-green-100 hover:text-green-700'
                            }`}
                            title="IA responde automaticamente"
                          >
                            Auto
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleIntent(intent.key, 'bloqueado')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                              isBloqueado
                                ? 'bg-orange-500 text-white'
                                : 'bg-muted text-muted-foreground hover:bg-orange-100 hover:text-orange-700'
                            }`}
                            title="Transferir para humano"
                          >
                            Handoff
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  💡 Intents sem configuração são tratados como "Auto" com o threshold de confiança definido acima
                </p>
              </CardContent>
            </Card>

            {/* Botão Salvar */}
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Configurações
            </Button>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}