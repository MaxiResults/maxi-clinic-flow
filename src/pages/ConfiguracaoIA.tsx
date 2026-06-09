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
import { Bot, Lightbulb, Loader2, Save, Clock, CalendarDays, Zap, Sparkles, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';

interface AIConfigForm {
  enabled: boolean;
  model: string;
  auto_respond_enabled: boolean;
  confidence_threshold: number;
  horario_inicio: string;
  horario_fim: string;
  dias_semana: string[];
  horario_por_dia: Record<string, HorarioDia>;
  intents_bloqueados: string[];
  intents_auto_respond: string[];
  nome_assistente: string;
  tom_voz: 'formal' | 'descontraido' | 'neutro';
  saudacao_inicial: string;
  instrucoes_adicionais: string;
}

const DIAS_SEMANA = [
  { key: 'segunda-feira', label: 'Seg', labelFull: 'Segunda' },
  { key: 'terça-feira', label: 'Ter', labelFull: 'Terça' },
  { key: 'quarta-feira', label: 'Qua', labelFull: 'Quarta' },
  { key: 'quinta-feira', label: 'Qui', labelFull: 'Quinta' },
  { key: 'sexta-feira', label: 'Sex', labelFull: 'Sexta' },
  { key: 'sábado', label: 'Sáb', labelFull: 'Sábado' },
  { key: 'domingo', label: 'Dom', labelFull: 'Domingo' },
];

interface HorarioDia {
  ativo: boolean;
  inicio: string;
  fim: string;
}

const HORARIO_PADRAO_POR_DIA: Record<string, HorarioDia> = {
  'segunda-feira': { ativo: true,  inicio: '08:00', fim: '18:00' },
  'terça-feira':   { ativo: true,  inicio: '08:00', fim: '18:00' },
  'quarta-feira':  { ativo: true,  inicio: '08:00', fim: '18:00' },
  'quinta-feira':  { ativo: true,  inicio: '08:00', fim: '18:00' },
  'sexta-feira':   { ativo: true,  inicio: '08:00', fim: '18:00' },
  'sábado':        { ativo: false, inicio: '08:00', fim: '18:00' },
  'domingo':       { ativo: false, inicio: '08:00', fim: '18:00' },
};

const ALL_INTENTS = [
  { key: 'saudacao', label: '👋 Saudação', descricao: 'Cumprimentos iniciais' },
  { key: 'informacao_procedimento', label: '💉 Info Procedimento', descricao: 'Dúvidas sobre serviços e preços' },
  { key: 'informacao_horario', label: '🕐 Horário Funcionamento', descricao: 'Quando a clínica abre/fecha' },
  { key: 'informacao_localizacao', label: '📍 Localização', descricao: 'Endereço da clínica' },
  { key: 'duvida_geral', label: '❓ Dúvida Geral', descricao: 'Perguntas diversas' },
  { key: 'agendamento_novo', label: '📅 Agendar', descricao: 'Novo agendamento' },
  { key: 'agendamento_reagendar', label: '🔄 Reagendar', descricao: 'Mudar data/hora' },
  { key: 'agendamento_cancelar', label: '❌ Cancelar', descricao: 'Cancelar agendamento' },
  { key: 'reclamacao', label: '😤 Reclamação', descricao: 'Cliente insatisfeito' },
  { key: 'emergencia', label: '🚨 Emergência', descricao: 'Urgência médica' },
  { key: 'falar_com_atendente', label: '🧑 Falar com Atendente', descricao: 'Pedir humano' },
];

export default function ConfiguracaoIA() {
  const { toast } = useToast();
  const { user } = useAuth();
  const nomeClinica = user?.empresa_nome || 'sua clínica';
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
    horario_por_dia: HORARIO_PADRAO_POR_DIA,
    intents_bloqueados: ['agendamento_novo', 'agendamento_reagendar', 'agendamento_cancelar', 'reclamacao', 'emergencia'],
    intents_auto_respond: ['informacao_procedimento', 'informacao_horario', 'informacao_localizacao', 'duvida_geral'],
    nome_assistente: 'Assistente Virtual',
    tom_voz: 'neutro',
    saudacao_inicial: '',
    instrucoes_adicionais: '',
  });

  const queryClient = useQueryClient();

  const { data: serverData, isLoading } = useQuery({
    queryKey: ['ai-config'],
    queryFn: async () => {
      const res = await api.get('/ai/config');
      // O interceptor já extrai response.data.data automaticamente
      // res.data já é o objeto final: { enabled, model, horario_inicio, ... }
      return res.data ?? {};
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!isLoading && !formInitialized) {
      const data = serverData || {};
      setForm({
        enabled: data.enabled ?? false,
        model: data.model ?? 'claude-haiku-4-5',
        auto_respond_enabled: data.auto_respond_enabled ?? false,
        confidence_threshold: data.confidence_threshold ?? 85,
        horario_inicio: (data.horario_inicio ?? '08:00').substring(0, 5),
        horario_fim: (data.horario_fim ?? '18:00').substring(0, 5),
        dias_semana: data.dias_semana ?? ['segunda-feira', 'terça-feira',
          'quarta-feira', 'quinta-feira', 'sexta-feira'],
        horario_por_dia: data.horario_por_dia ?? HORARIO_PADRAO_POR_DIA,
        intents_bloqueados: data.intents_bloqueados ?? [],
        intents_auto_respond: data.intents_auto_respond ?? [],
        nome_assistente: data.nome_assistente ?? 'Assistente Virtual',
        tom_voz: (data.tom_voz as AIConfigForm['tom_voz']) ?? 'neutro',
        saudacao_inicial: data.saudacao_inicial ?? '',
        instrucoes_adicionais: data.instrucoes_adicionais ?? '',
      });
      setFormInitialized(true);
    }
  }, [isLoading, serverData, formInitialized]);

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

  const generatePromptPreview = (): string => {
    const tom = {
      formal: 'Use linguagem formal e profissional.',
      descontraido: 'Use linguagem descontraída e amigável.',
      neutro: 'Use linguagem neutra e objetiva.',
    }[form.tom_voz];

    let preview = `Você é ${form.nome_assistente || 'Assistente Virtual'}, `;
    preview += `assistente virtual de ${nomeClinica}.\n\n`;
    preview += tom;

    if (form.saudacao_inicial) {
      preview += `\n\nSaudação: "${form.saudacao_inicial}"`;
    }

    if (form.instrucoes_adicionais) {
      const linhas = form.instrucoes_adicionais.split('\n').slice(0, 3);
      preview += `\n\nInstruções: ${linhas.join(' | ')}`;
      if (form.instrucoes_adicionais.split('\n').length > 3) {
        preview += '...';
      }
    }

    return preview;
  };

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
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Personalidade do Assistente</CardTitle>
                    <CardDescription>
                      Defina como o assistente se apresenta e se comunica com os pacientes
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="nome_assistente">Nome do assistente</Label>
                  <Input
                    id="nome_assistente"
                    maxLength={50}
                    value={form.nome_assistente}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, nome_assistente: e.target.value }))
                    }
                    placeholder="Ex: Lara"
                  />
                  <p className="text-xs text-muted-foreground">
                    Como o assistente se apresenta ao paciente
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Tom de voz</Label>
                  <RadioGroup
                    value={form.tom_voz}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, tom_voz: v as AIConfigForm['tom_voz'] }))
                    }
                    className="grid grid-cols-1 sm:grid-cols-3 gap-2"
                  >
                    {[
                      { value: 'formal', label: 'Formal' },
                      { value: 'descontraido', label: 'Descontraído' },
                      { value: 'neutro', label: 'Neutro' },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        htmlFor={`tom-${opt.value}`}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          form.tom_voz === opt.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <RadioGroupItem value={opt.value} id={`tom-${opt.value}`} />
                        <span className="text-sm font-medium">{opt.label}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="saudacao_inicial">Saudação inicial</Label>
                  <Textarea
                    id="saudacao_inicial"
                    rows={3}
                    maxLength={300}
                    value={form.saudacao_inicial}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, saudacao_inicial: e.target.value }))
                    }
                    placeholder="Olá! Sou a Lara, assistente virtual..."
                    className="resize-y"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Deixe vazio para usar saudação padrão</span>
                    <span>{form.saudacao_inicial.length}/300</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instrucoes_adicionais">Instruções adicionais</Label>
                  <Textarea
                    id="instrucoes_adicionais"
                    rows={6}
                    maxLength={3000}
                    value={form.instrucoes_adicionais}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, instrucoes_adicionais: e.target.value }))
                    }
                    placeholder={'- Nunca informar preços pelo WhatsApp\n- Sempre perguntar o nome do paciente'}
                    className="resize-y"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Regras específicas, restrições e orientações</span>
                    <span>{form.instrucoes_adicionais.length}/3000</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Eye className="h-4 w-4" />
                    Preview do prompt gerado
                  </div>
                  <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground whitespace-pre-wrap font-mono">
                    {generatePromptPreview()}
                  </div>
                </div>
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

            {/* Seção 4 — Grade de Horários por Dia */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <div>
                    <CardTitle>Horários de Atendimento da IA</CardTitle>
                    <CardDescription>
                      Configure os dias e horários em que a IA responderá automaticamente.
                      Para atendimento overnight, defina início maior que fim (ex: 18:00 às 08:00).
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center px-2 pb-1 border-b">
                    <span className="text-xs font-medium text-muted-foreground">Dia</span>
                    <span className="text-xs font-medium text-muted-foreground w-16 text-center">Ativo</span>
                    <span className="text-xs font-medium text-muted-foreground w-24 text-center">Início</span>
                    <span className="text-xs font-medium text-muted-foreground w-24 text-center">Fim</span>
                  </div>

                  {DIAS_SEMANA.map((dia) => {
                    const config = form.horario_por_dia[dia.key] ?? {
                      ativo: false, inicio: '08:00', fim: '18:00'
                    };
                    const isOvernight = config.inicio > config.fim && config.ativo;

                    return (
                      <div
                        key={dia.key}
                        className={`grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center px-2 py-1 rounded-lg transition-colors ${
                          config.ativo ? 'bg-muted/30' : 'opacity-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{dia.labelFull}</span>
                          {isOvernight && (
                            <span className="text-xs text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">
                              overnight
                            </span>
                          )}
                        </div>

                        <div className="flex justify-center w-16">
                          <button
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                horario_por_dia: {
                                  ...prev.horario_por_dia,
                                  [dia.key]: { ...config, ativo: !config.ativo },
                                },
                              }))
                            }
                            className={`w-10 h-5 rounded-full transition-colors relative ${
                              config.ativo ? 'bg-purple-500' : 'bg-muted'
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                config.ativo ? 'translate-x-5' : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                        </div>

                        <input
                          type="time"
                          value={config.inicio}
                          disabled={!config.ativo}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              horario_por_dia: {
                                ...prev.horario_por_dia,
                                [dia.key]: { ...config, inicio: e.target.value },
                              },
                            }))
                          }
                          className="w-24 border rounded-lg px-2 py-1 text-sm bg-background disabled:opacity-40 disabled:cursor-not-allowed"
                        />

                        <input
                          type="time"
                          value={config.fim}
                          disabled={!config.ativo}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              horario_por_dia: {
                                ...prev.horario_por_dia,
                                [dia.key]: { ...config, fim: e.target.value },
                              },
                            }))
                          }
                          className="w-24 border rounded-lg px-2 py-1 text-sm bg-background disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                      </div>
                    );
                  })}
                </div>

                <p className="text-xs text-muted-foreground mt-3">
                  💡 Para atender 24h: ative o dia e defina 00:00 às 23:59.
                  Para overnight: defina início maior que fim (ex: 18:00 às 08:00).
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