import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface TemplateButton {
  type: 'quick_reply' | 'url' | 'phone';
  text: string;
  url?: string;
  phone?: string;
}

export interface WhatsAppTemplate {
  id: string;
  cliente_id: number;
  empresa_id: number;
  name: string;
  category: 'marketing' | 'utility' | 'authentication';
  language: string;
  status: 'pending' | 'approved' | 'rejected' | 'paused';
  header_type?: 'text' | 'image' | 'video' | 'document';
  header_content?: string;
  body: string;
  footer?: string;
  buttons?: TemplateButton[];
  meta_template_id?: string;
  rejection_reason?: string;
  created_at: string;
  approved_at?: string;
}

export interface CreateTemplatePayload {
  name: string;
  category: string;
  language: string;
  header_type?: string;
  header_content?: string;
  body: string;
  footer?: string;
  buttons?: TemplateButton[];
}

export function useWhatsAppTemplates() {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/whatsapp/templates');
      setTemplates(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Erro ao carregar templates';
      setError(errorMsg);
      toast({ title: 'Erro', description: errorMsg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async (data: CreateTemplatePayload) => {
    try {
      await api.post('/whatsapp/templates', data);
      toast({
        title: 'Template enviado!',
        description: 'Template enviado para aprovação da Meta. Aguarde até 24h.',
      });
      await fetchTemplates();
      return true;
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.response?.data?.error || 'Erro ao criar template',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      await api.delete(`/whatsapp/templates/${id}`);
      toast({ title: 'Sucesso', description: 'Template removido com sucesso' });
      await fetchTemplates();
      return true;
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.response?.data?.error || 'Erro ao remover template',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { templates, loading, error, fetchTemplates, createTemplate, deleteTemplate };
}