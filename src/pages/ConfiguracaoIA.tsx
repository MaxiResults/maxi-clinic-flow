import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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

  const { isLoading } = useQuery({
    queryKey: ['ai-config'],
    queryFn: async () => {
      const res = await api.get('/ai/config');
      const data = res.data?.data ?? {};
      setForm({
        enabled: data.enabled ?? false,
        model: data.model ?? 'claude-haiku-4-5',
        auto_respond_enabled: data.auto_respond_enabled ?? false,
        confidence_threshold: data.confidence_threshold ?? 85,
        horario_inicio: data.horario_inicio ?? '08:00',
        horario_fim: data.horario_fim ?? '18:00',
        dias_semana: data.dias_semana ?? ['segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira'],
        intents_bloqueados: data.intents_bloqueados ?? ['agendamento_novo', 'reagendar', 'cancelar', 'reclamacao', 'emergencia'],
        intents_auto_respond: data.intents_auto_respond ?? ['informacao_procedimento', 'horario_funcionamento', 'localizacao', 'duvida_geral'],
      });
      return data;
    },
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/ai/config', form);
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