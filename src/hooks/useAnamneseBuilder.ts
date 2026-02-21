import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { anamneseSecoesApi, anamneseCamposApi } from '@/lib/anamneseApi';
import {
  AnamneseSecao,
  AnamneseCampo,
  CriarSecaoForm,
  CriarCampoForm,
  TemplateCompleto
} from '@/types/anamnese.types';

export function useAnamneseBuilder(templateId: string) {
  const { toast } = useToast();
  const [secoes, setSecoes] = useState<AnamneseSecao[]>([]);
  const [campos, setCampos] = useState<Record<string, AnamneseCampo[]>>({});
  const [secaoSelecionada, setSecaoSelecionada] = useState<string | null>(null);
  const [campoSelecionado, setCampoSelecionado] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * Carregar template completo
   */
  const carregarTemplate = useCallback((template: TemplateCompleto) => {
    const secoesOrdenadas = template.secoes
      .map(s => s.secao)
      .sort((a, b) => a.ordem - b.ordem);
    
    setSecoes(secoesOrdenadas);

    const camposPorSecao: Record<string, AnamneseCampo[]> = {};
    template.secoes.forEach(secaoData => {
      camposPorSecao[secaoData.secao.id] = secaoData.campos.sort(
        (a, b) => a.ordem - b.ordem
      );
    });
    
    setCampos(camposPorSecao);
  }, []);

  /**
   * Criar seção
   */
  const criarSecao = useCallback(async (dados: CriarSecaoForm) => {
    try {
      setLoading(true);
      const response = await anamneseSecoesApi.criar(templateId, dados);
      
      if (response.success && response.data) {
        setSecoes(prev => [...prev, response.data!].sort((a, b) => a.ordem - b.ordem));
        setCampos(prev => ({ ...prev, [response.data!.id]: [] }));
        
        toast({
          title: 'Seção criada!',
          description: `"${dados.titulo}" foi adicionada ao template.`
        });
        
        return response.data;
      } else {
        throw new Error(response.error || 'Erro ao criar seção');
      }
    } catch (error: any) {
      console.error('Erro ao criar seção:', error);
      toast({
        title: 'Erro ao criar seção',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [templateId, toast]);

  /**
   * Atualizar seção
   */
  const atualizarSecao = useCallback(async (id: string, dados: Partial<CriarSecaoForm>) => {
    try {
      setLoading(true);
      const response = await anamneseSecoesApi.atualizar(id, dados);
      
      if (response.success && response.data) {
        setSecoes(prev =>
          prev.map(s => (s.id === id ? response.data! : s)).sort((a, b) => a.ordem - b.ordem)
        );
        
        toast({
          title: 'Seção atualizada!',
          description: 'As alterações foram salvas.'
        });
        
        return response.data;
      } else {
        throw new Error(response.error || 'Erro ao atualizar seção');
      }
    } catch (error: any) {
      console.error('Erro ao atualizar seção:', error);
      toast({
        title: 'Erro ao atualizar seção',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Excluir seção
   */
  const excluirSecao = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const response = await anamneseSecoesApi.excluir(id);
      
      if (response.success) {
        setSecoes(prev => prev.filter(s => s.id !== id));
        setCampos(prev => {
          const newCampos = { ...prev };
          delete newCampos[id];
          return newCampos;
        });
        
        toast({
          title: 'Seção excluída!',
          description: 'A seção foi removida do template.'
        });
        
        return true;
      } else {
        throw new Error(response.error || 'Erro ao excluir seção');
      }
    } catch (error: any) {
      console.error('Erro ao excluir seção:', error);
      toast({
        title: 'Erro ao excluir seção',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Criar campo
   */
  const criarCampo = useCallback(async (secaoId: string, dados: CriarCampoForm) => {
    try {
      setLoading(true);
      const response = await anamneseCamposApi.criar(secaoId, dados);
      
      if (response.success && response.data) {
        setCampos(prev => ({
          ...prev,
          [secaoId]: [...(prev[secaoId] || []), response.data!].sort(
            (a, b) => a.ordem - b.ordem
          )
        }));
        
        toast({
          title: 'Campo criado!',
          description: `"${dados.label}" foi adicionado à seção.`
        });
        
        return response.data;
      } else {
        throw new Error(response.error || 'Erro ao criar campo');
      }
    } catch (error: any) {
      console.error('Erro ao criar campo:', error);
      toast({
        title: 'Erro ao criar campo',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Atualizar campo
   */
  const atualizarCampo = useCallback(async (id: string, dados: Partial<CriarCampoForm>) => {
    try {
      setLoading(true);
      const response = await anamneseCamposApi.atualizar(id, dados);
      
      if (response.success && response.data) {
        const secaoId = response.data.secao_id;
        setCampos(prev => ({
          ...prev,
          [secaoId]: prev[secaoId]
            .map(c => (c.id === id ? response.data! : c))
            .sort((a, b) => a.ordem - b.ordem)
        }));
        
        toast({
          title: 'Campo atualizado!',
          description: 'As alterações foram salvas.'
        });
        
        return response.data;
      } else {
        throw new Error(response.error || 'Erro ao atualizar campo');
      }
    } catch (error: any) {
      console.error('Erro ao atualizar campo:', error);
      toast({
        title: 'Erro ao atualizar campo',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Excluir campo
   */
  const excluirCampo = useCallback(async (secaoId: string, campoId: string) => {
    try {
      setLoading(true);
      const response = await anamneseCamposApi.excluir(campoId);
      
      if (response.success) {
        setCampos(prev => ({
          ...prev,
          [secaoId]: prev[secaoId].filter(c => c.id !== campoId)
        }));
        
        toast({
          title: 'Campo excluído!',
          description: 'O campo foi removido da seção.'
        });
        
        return true;
      } else {
        throw new Error(response.error || 'Erro ao excluir campo');
      }
    } catch (error: any) {
      console.error('Erro ao excluir campo:', error);
      toast({
        title: 'Erro ao excluir campo',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Duplicar campo
   */
  const duplicarCampo = useCallback(async (campoId: string) => {
    try {
      setLoading(true);
      const response = await anamneseCamposApi.duplicar(campoId);
      
      if (response.success && response.data) {
        const novoCampo = response.data;
        const secaoId = novoCampo.secao_id;
        
        setCampos(prev => ({
          ...prev,
          [secaoId]: [...(prev[secaoId] || []), novoCampo].sort(
            (a, b) => a.ordem - b.ordem
          )
        }));
        
        toast({
          title: 'Campo duplicado!',
          description: `"${novoCampo.label}" foi criado.`
        });
        
        return novoCampo;
      } else {
        throw new Error(response.error || 'Erro ao duplicar campo');
      }
    } catch (error: any) {
      console.error('Erro ao duplicar campo:', error);
      toast({
        title: 'Erro ao duplicar campo',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Reordenar seções
   */
  const reordenarSecoes = useCallback(async (novaOrdem: Array<{ id: string; ordem: number }>) => {
    try {
      setLoading(true);
      const response = await anamneseSecoesApi.reordenar(templateId, novaOrdem);  // ✅ CORRETO
      
      if (response.success && response.data) {
        setSecoes(response.data.sort((a, b) => a.ordem - b.ordem));
        
        toast({
          title: 'Ordem atualizada!',
          description: 'As seções foram reordenadas.'
        });
        
        return true;
      } else {
        throw new Error(response.error || 'Erro ao reordenar seções');
      }
    } catch (error: any) {
      console.error('Erro ao reordenar seções:', error);
      toast({
        title: 'Erro ao reordenar seções',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [templateId, toast]);

  /**
   * Reordenar campos
   */
  const reordenarCampos = useCallback(async (
    secaoId: string,
    novaOrdem: Array<{ id: string; ordem: number }>
  ) => {
    try {
      setLoading(true);
      const response = await anamneseCamposApi.reordenar(secaoId, novaOrdem);  // ✅ CORRETO
      
      if (response.success && response.data) {
        setCampos(prev => ({
          ...prev,
          [secaoId]: response.data!.sort((a, b) => a.ordem - b.ordem)
        }));
        
        toast({
          title: 'Ordem atualizada!',
          description: 'Os campos foram reordenados.'
        });
        
        return true;
      } else {
        throw new Error(response.error || 'Erro ao reordenar campos');
      }
    } catch (error: any) {
      console.error('Erro ao reordenar campos:', error);
      toast({
        title: 'Erro ao reordenar campos',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    secoes,
    campos,
    secaoSelecionada,
    campoSelecionado,
    loading,
    carregarTemplate,
    criarSecao,
    atualizarSecao,
    excluirSecao,
    criarCampo,
    atualizarCampo,
    excluirCampo,
    duplicarCampo,
    reordenarSecoes,
    reordenarCampos,
    setSecaoSelecionada,
    setCampoSelecionado
  };
}