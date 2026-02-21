import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Save, 
  Eye,
  Settings,
  Loader2
} from 'lucide-react';
import { useAnamneseTemplates } from '@/hooks/useAnamneseTemplates';
import { useAnamneseBuilder } from '@/hooks/useAnamneseBuilder';
import { useToast } from '@/hooks/use-toast';
import { ListSkeleton } from '@/components/skeletons/ListSkeleton';
import { TipoCampo, TIPOS_CAMPO_LABELS } from '@/types/anamnese.types';

// Componentes do Builder
import { BuilderSidebar } from '@/components/anamnese/builder/BuilderSidebar';
import { BuilderCanvas } from '@/components/anamnese/builder/BuilderCanvas';
import { BuilderProperties } from '@/components/anamnese/builder/BuilderProperties';
import { PreviewDialog } from '@/components/anamnese/builder/PreviewDialog';

export default function AnamneseTemplateBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { buscarPorId, atualizar } = useAnamneseTemplates();
  const {
    secoes,
    campos,
    secaoSelecionada,
    campoSelecionado,
    loading,
    carregarTemplate,
    criarSecao,
    atualizarSecao,
    criarCampo,
    atualizarCampo,
    excluirSecao,
    excluirCampo,
    duplicarCampo,
    reordenarSecoes,
    reordenarCampos,
    setSecaoSelecionada,
    setCampoSelecionado
  } = useAnamneseBuilder(id!);

  const [template, setTemplate] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('builder');
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (id) {
      carregarTemplateData();
    }
  }, [id]);

  // Atualizar contadores quando secoes/campos mudarem
  useEffect(() => {
    if (template) {
      setTemplate((prev: any) => ({
        ...prev,
        _totalSecoes: secoes.length,
        _totalCampos: Object.values(campos).flat().length
      }));
    }
  }, [secoes, campos]);

  const carregarTemplateData = async () => {
    const resultado = await buscarPorId(id!);
    if (resultado) {
      setTemplate({
        ...resultado,
        _totalSecoes: resultado.secoes?.length || 0,
        _totalCampos: resultado.secoes?.reduce((acc: number, s: any) => acc + (s.campos?.length || 0), 0) || 0
      });
      carregarTemplate(resultado);
    } else {
      toast({
        title: 'Template não encontrado',
        variant: 'destructive'
      });
      navigate('/anamnese/templates');
    }
  };

  const handleCriarSecao = async (dados: any) => {
    return await criarSecao(dados);
  };

  const handleAtualizarSecao = async (secaoId: string, dados: any) => {
    await atualizarSecao(secaoId, dados);
  };

  const handleCriarCampo = async (secaoId: string, tipoCampo: TipoCampo) => {
    const labelPadrao = TIPOS_CAMPO_LABELS[tipoCampo];
    const camposSecao = campos[secaoId] || [];
    const camposMesmoTipo = camposSecao.filter(c => c.tipo_campo === tipoCampo);
    const numero = camposMesmoTipo.length + 1;
    const label = numero > 1 ? `${labelPadrao} ${numero}` : labelPadrao;

    return await criarCampo(secaoId, {
      tipo_campo: tipoCampo,
      label,
      ordem: camposSecao.length,
      obrigatorio: false,
      largura: 'full'
    });
  };

  const handleAtualizarCampo = async (campoId: string, dados: any) => {
    await atualizarCampo(campoId, dados);
  };

  const handleExcluirSecao = async (secaoId: string) => {
    const sucesso = await excluirSecao(secaoId);
    if (sucesso && secaoSelecionada === secaoId) {
      setSecaoSelecionada(null);
    }
  };

  const handleExcluirCampo = async (secaoId: string, campoId: string) => {
    const sucesso = await excluirCampo(secaoId, campoId);
    if (sucesso && campoSelecionado === campoId) {
      setCampoSelecionado(null);
    }
  };

  const handleDuplicarCampo = async (campoId: string) => {
    await duplicarCampo(campoId);
  };

  const handleReordenarSecoes = async (secoes: Array<{ id: string; ordem: number }>) => {
    await reordenarSecoes(secoes);
  };

  const handleReordenarCampos = async (secaoId: string, campos: Array<{ id: string; ordem: number }>) => {
    await reordenarCampos(secaoId, campos);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    toast({
      title: 'Template salvo!',
      description: 'Todas as alterações foram salvas com sucesso.'
    });
    setSaving(false);
  };

  const handlePreview = () => {
    if (secoes.length === 0) {
      toast({
        title: 'Nenhuma seção criada',
        description: 'Crie pelo menos uma seção para visualizar o preview.',
        variant: 'destructive'
      });
      return;
    }
    setPreviewOpen(true);
  };

  const handleGerarLinkTeste = async () => {
    try {
      setSaving(true);
      
      const response = await fetch('https://maxiclinicas.com.br/api/v1/anamnese', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          template_id: id
        })
      });

      const data = await response.json();
      
      if (data.success && data.data.token) {
        const link = `https://maxiclinicas.com.br/anamnese/p/${data.data.token}`;
        navigator.clipboard.writeText(link);
        
        toast({
          title: 'Link gerado!',
          description: 'Link copiado para a área de transferência.',
        });
        
        alert(`Link de teste criado e copiado!\n\n${link}`);
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao gerar link',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !template) {
    return (
      <DashboardLayout title="Construtor de Template">
        <ListSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={template.nome}>
      <div className="border-b bg-background">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/anamnese/templates')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h2 className="text-lg font-semibold">{template.nome}</h2>
              <p className="text-sm text-muted-foreground">
                {template._totalSecoes || 0} seções • {template._totalCampos || 0} campos
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePreview}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button variant="outline" size="sm" onClick={handleGerarLinkTeste}>
              🔗 Gerar Link Teste
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <div className="border-b bg-muted/50">
          <TabsList className="mx-6">
            <TabsTrigger value="builder">
              <Settings className="h-4 w-4 mr-2" />
              Construtor
            </TabsTrigger>
            <TabsTrigger value="settings">
              Configurações
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="builder" className="flex-1 m-0">
          <div className="flex h-[calc(100vh-280px)]">
            <BuilderSidebar />
            <BuilderCanvas
              secoes={secoes}
              campos={campos}
              secaoSelecionada={secaoSelecionada}
              campoSelecionado={campoSelecionado}
              onSecaoSelect={setSecaoSelecionada}
              onCampoSelect={setCampoSelecionado}
              onCriarSecao={handleCriarSecao}
              onCriarCampo={handleCriarCampo}
              onExcluirSecao={handleExcluirSecao}
              onExcluirCampo={handleExcluirCampo}
              onDuplicarCampo={handleDuplicarCampo}
              onReordenarSecoes={handleReordenarSecoes}
              onReordenarCampos={handleReordenarCampos}
            />
            <BuilderProperties
              secaoSelecionada={secaoSelecionada}
              campoSelecionado={campoSelecionado}
              secoes={secoes}
              campos={campos}
              onAtualizarCampo={handleAtualizarCampo}
              onAtualizarSecao={handleAtualizarSecao}
            />
          </div>
        </TabsContent>

        <TabsContent value="settings" className="p-6">
          <div className="max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Configurações do Template</h3>
            <p className="text-muted-foreground">
              Configurações adicionais em desenvolvimento...
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <PreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        secoes={secoes}
        campos={campos}
        templateNome={template.nome}
      />
    </DashboardLayout>
  );
}