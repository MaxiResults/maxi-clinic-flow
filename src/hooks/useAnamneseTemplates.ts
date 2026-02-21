import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { anamneseTemplatesApi } from '@/lib/anamneseApi';
import {
  AnamneseTemplate,
  TemplateCompleto,
  CriarTemplateForm
} from '@/types/anamnese.types';

export function useAnamneseTemplates() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<AnamneseTemplate[]>([]);
  const [templateSelecionado, setTemplateSelecionado] = useState<TemplateCompleto | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

 /**
 * Listar templates
 */
const listar = useCallback(async (filtros?: {
  tipo?: string;
  ativo?: boolean;
  busca?: string;
}) => {
  try {
    setLoading(true);
    const response = await anamneseTemplatesApi.listar(filtros);
    
    // A resposta já vem tratada pelo interceptor como { success, data, total }
    if (response.success && response.data) {
      setTemplates(response.data);
    } else {
      // Se não tem data mas tem success, significa array vazio
      if (response.success) {
        setTemplates([]);
      } else {
        throw new Error(response.error || 'Erro ao listar templates');
      }
    }
  } catch (error: any) {
    console.error('Erro ao listar templates:', error);
    toast({
      title: 'Erro ao carregar templates',
      description: error.message,
      variant: 'destructive'
    });
    setTemplates([]);
  } finally {
    setLoading(false);
  }
}, [toast]);

  /**
   * Buscar template completo por ID
   */
  const buscarPorId = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const response = await anamneseTemplatesApi.buscarPorId(id);
      
      if (response.success && response.data) {
        setTemplateSelecionado(response.data);
        return response.data;
      } else {
        throw new Error(response.error || 'Template não encontrado');
      }
    } catch (error: any) {
      console.error('Erro ao buscar template:', error);
      toast({
        title: 'Erro ao carregar template',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Criar novo template
   */
  const criar = useCallback(async (dados: CriarTemplateForm) => {
    try {
      setLoading(true);
      const response = await anamneseTemplatesApi.criar(dados);
      
      if (response.success && response.data) {
        toast({
          title: 'Template criado!',
          description: `Template "${dados.nome}" criado com sucesso.`
        });
        
        // Atualizar lista
        await listar();
        
        return response.data;
      } else {
        throw new Error(response.error || 'Erro ao criar template');
      }
    } catch (error: any) {
      console.error('Erro ao criar template:', error);
      toast({
        title: 'Erro ao criar template',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast, listar]);

  /**
   * Atualizar template
   */
  const atualizar = useCallback(async (id: string, dados: Partial<CriarTemplateForm>) => {
    try {
      setLoading(true);
      const response = await anamneseTemplatesApi.atualizar(id, dados);
      
      if (response.success && response.data) {
        toast({
          title: 'Template atualizado!',
          description: 'As alterações foram salvas.'
        });
        
        // Atualizar lista
        await listar();
        
        return response.data;
      } else {
        throw new Error(response.error || 'Erro ao atualizar template');
      }
    } catch (error: any) {
      console.error('Erro ao atualizar template:', error);
      toast({
        title: 'Erro ao atualizar template',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast, listar]);

  /**
   * Excluir template
   */
  const excluir = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const response = await anamneseTemplatesApi.excluir(id);
      
      if (response.success) {
        toast({
          title: 'Template excluído!',
          description: 'O template foi removido com sucesso.'
        });
        
        // Atualizar lista
        await listar();
        
        return true;
      } else {
        throw new Error(response.error || 'Erro ao excluir template');
      }
    } catch (error: any) {
      console.error('Erro ao excluir template:', error);
      toast({
        title: 'Erro ao excluir template',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast, listar]);

  /**
   * Ativar/Desativar template
   */
  const toggleAtivo = useCallback(async (id: string, ativo: boolean) => {
    try {
      setRefreshing(true);
      const response = await anamneseTemplatesApi.toggleAtivo(id, ativo);
      
      if (response.success && response.data) {
        toast({
          title: ativo ? 'Template ativado!' : 'Template desativado!',
          description: ativo 
            ? 'O template está disponível para uso.'
            : 'O template não aparecerá mais nas opções.'
        });
        
        // Atualizar lista
        await listar();
        
        return response.data;
      } else {
        throw new Error(response.error || 'Erro ao alterar status');
      }
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: 'Erro ao alterar status',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    } finally {
      setRefreshing(false);
    }
  }, [toast, listar]);

  /**
   * Duplicar template
   */
  const duplicar = useCallback(async (id: string, novoNome?: string) => {
    try {
      setLoading(true);
      const response = await anamneseTemplatesApi.duplicar(id, novoNome);
      
      if (response.success && response.data) {
        toast({
          title: 'Template duplicado!',
          description: 'Uma cópia foi criada. Você pode editá-la agora.'
        });
        
        // Atualizar lista
        await listar();
        
        return response.data;
      } else {
        throw new Error(response.error || 'Erro ao duplicar template');
      }
    } catch (error: any) {
      console.error('Erro ao duplicar template:', error);
      toast({
        title: 'Erro ao duplicar template',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast, listar]);

  /**
   * Refresh da lista
   */
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await listar();
    setRefreshing(false);
  }, [listar]);

  return {
    templates,
    templateSelecionado,
    loading,
    refreshing,
    listar,
    buscarPorId,
    criar,
    atualizar,
    excluir,
    toggleAtivo,
    duplicar,
    refresh,
    setTemplateSelecionado
  };
}