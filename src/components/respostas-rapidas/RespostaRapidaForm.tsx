import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';

const respostaRapidaSchema = z.object({
  atalho: z
    .string()
    .min(1, 'Atalho é obrigatório')
    .max(50, 'Atalho deve ter no máximo 50 caracteres')
    .toLowerCase()
    .regex(/^[a-z0-9_-]+$/, 'Use apenas letras minúsculas, números, - e _'),
  titulo: z
    .string()
    .min(3, 'Título deve ter no mínimo 3 caracteres')
    .max(200, 'Título deve ter no máximo 200 caracteres'),
  conteudo: z.string().min(10, 'Conteúdo deve ter no mínimo 10 caracteres'),
  ativo: z.boolean().default(true),
});

type RespostaRapidaFormData = z.infer<typeof respostaRapidaSchema>;

interface RespostaRapidaFormProps {
  mode: 'create' | 'edit';
  respostaId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function RespostaRapidaForm({
  mode,
  respostaId,
  onSuccess,
  onCancel,
}: RespostaRapidaFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<RespostaRapidaFormData>({
    resolver: zodResolver(respostaRapidaSchema),
    defaultValues: {
      atalho: '',
      titulo: '',
      conteudo: '',
      ativo: true,
    },
  });

  useEffect(() => {
    if (mode === 'edit' && respostaId) {
      setLoading(true);
      api
        .get(`/respostas-rapidas/${respostaId}`)
        .then((res) => {
          form.reset(res.data);
        })
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, respostaId]);

  const onSubmit = async (data: RespostaRapidaFormData) => {
    setLoading(true);
    try {
      if (mode === 'create') {
        await api.post('/respostas-rapidas', data);
      } else {
        await api.patch(`/respostas-rapidas/${respostaId}`, data);
      }
      onSuccess();
    } catch (error) {
      // tratado pelo interceptor
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'edit' && loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="atalho"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Atalho *</FormLabel>
              <FormControl>
                <Input placeholder="ex: oi" {...field} />
              </FormControl>
              <FormDescription>
                Use apenas letras minúsculas, números, - e _
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="titulo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título *</FormLabel>
              <FormControl>
                <Input placeholder="Saudação inicial" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="conteudo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conteúdo *</FormLabel>
              <FormControl>
                <Textarea
                  rows={5}
                  placeholder="Texto que será enviado..."
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Texto que será enviado quando o atalho for usado
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ativo"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>Ativo</FormLabel>
                <FormDescription>
                  Respostas inativas não aparecem na busca
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Criar' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}