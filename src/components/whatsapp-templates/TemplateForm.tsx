import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Trash2, Info } from 'lucide-react';
import { TemplatePreview } from './TemplatePreview';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TemplateButton,
  useWhatsAppTemplates,
} from '@/hooks/useWhatsAppTemplates';

const templateSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(512, 'Nome deve ter no máximo 512 caracteres')
    .regex(/^[a-z0-9_]+$/, 'Use apenas letras minúsculas, números e _'),
  category: z.enum(['marketing', 'utility', 'authentication']),
  language: z.string().default('pt_BR'),
  header_type: z.enum(['text', 'image', 'video', 'document', 'none']).optional(),
  header_content: z.string().max(60, 'Máximo 60 caracteres').optional(),
  body: z
    .string()
    .min(1, 'Corpo é obrigatório')
    .max(1024, 'Corpo deve ter no máximo 1024 caracteres'),
  footer: z.string().max(60, 'Rodapé deve ter no máximo 60 caracteres').optional(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface TemplateFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function TemplateForm({ onSuccess, onCancel }: TemplateFormProps) {
  const [loading, setLoading] = useState(false);
  const [buttons, setButtons] = useState<TemplateButton[]>([]);
  const { createTemplate } = useWhatsAppTemplates();

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      category: 'utility',
      language: 'pt_BR',
      header_type: 'none',
      header_content: '',
      body: '',
      footer: '',
    },
  });

  const watchedValues = form.watch();

  const onSubmit = async (data: TemplateFormData) => {
    setLoading(true);
    try {
      const payload: any = { ...data };
      if (data.header_type === 'none' || !data.header_type) {
        delete payload.header_type;
        delete payload.header_content;
      }
      if (buttons.length > 0) payload.buttons = buttons;

      const ok = await createTemplate(payload);
      if (ok) onSuccess();
    } finally {
      setLoading(false);
    }
  };

  const addButton = () => {
    if (buttons.length < 3) {
      setButtons([...buttons, { type: 'quick_reply', text: '' }]);
    }
  };

  const removeButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div>
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Templates WhatsApp precisam ser aprovados pela Meta antes de serem usados.
            Aprovação pode levar de 15 minutos a 24 horas.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Template *</FormLabel>
                  <FormControl>
                    <Input placeholder="agendamento_confirmacao" {...field} />
                  </FormControl>
                  <FormDescription>
                    Apenas letras minúsculas, números e _
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="utility">
                        Utility — Confirmações, lembretes
                      </SelectItem>
                      <SelectItem value="marketing">
                        Marketing — Ofertas, promoções
                      </SelectItem>
                      <SelectItem value="authentication">
                        Authentication — Códigos OTP
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="header_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cabeçalho (Opcional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Sem cabeçalho</SelectItem>
                      <SelectItem value="text">Texto</SelectItem>
                      <SelectItem value="image">Imagem</SelectItem>
                      <SelectItem value="video">Vídeo</SelectItem>
                      <SelectItem value="document">Documento</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedValues.header_type && watchedValues.header_type !== 'none' && (
              <FormField
                control={form.control}
                name="header_content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conteúdo do Cabeçalho</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          watchedValues.header_type === 'text'
                            ? 'Texto do cabeçalho'
                            : 'URL do arquivo'
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Corpo da Mensagem *</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={6}
                      placeholder="Olá {{1}}, sua consulta está marcada para {{2}}"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Use {'{{1}}'}, {'{{2}}'}, {'{{3}}'} para variáveis dinâmicas
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="footer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rodapé (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Equipe MaxiClínicas" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel>Botões (Opcional)</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addButton}
                  disabled={buttons.length >= 3}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              {buttons.map((btn, idx) => (
                <div key={idx} className="flex gap-2">
                  <Select
                    value={btn.type}
                    onValueChange={(v) => {
                      const next = [...buttons];
                      next[idx] = { ...next[idx], type: v as TemplateButton['type'] };
                      setButtons(next);
                    }}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quick_reply">Resposta</SelectItem>
                      <SelectItem value="url">URL</SelectItem>
                      <SelectItem value="phone">Telefone</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Texto do botão"
                    value={btn.text}
                    onChange={(e) => {
                      const next = [...buttons];
                      next[idx] = { ...next[idx], text: e.target.value };
                      setButtons(next);
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeButton(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar para Aprovação
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <div className="lg:sticky lg:top-4 lg:self-start">
        <h3 className="font-semibold mb-4">Preview</h3>
        <TemplatePreview
          headerType={
            watchedValues.header_type && watchedValues.header_type !== 'none'
              ? watchedValues.header_type
              : undefined
          }
          headerContent={watchedValues.header_content}
          body={watchedValues.body}
          footer={watchedValues.footer}
          buttons={buttons}
        />
      </div>
    </div>
  );
}