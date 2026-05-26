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
import { Bot, Lightbulb, Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface AIConfigForm {
  enabled: boolean;
  model: string;
  auto_respond_enabled: boolean;
  confidence_threshold: number;
}

export default function ConfiguracaoIA() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AIConfigForm>({
    enabled: false,
    model: 'claude-haiku-4-5',
    auto_respond_enabled: false,
    confidence_threshold: 85,
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