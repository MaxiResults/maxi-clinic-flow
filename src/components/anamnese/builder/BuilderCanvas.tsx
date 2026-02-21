import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/EmptyState';
import { Plus, FileText } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { AnamneseSecao, AnamneseCampo, TipoCampo } from '@/types/anamnese.types';
import { CriarSecaoDialog } from './CriarSecaoDialog';
import { SortableSecao } from './SortableSecao';
import { useToast } from '@/hooks/use-toast';

interface BuilderCanvasProps {
  secoes: AnamneseSecao[];
  campos: Record<string, AnamneseCampo[]>;
  secaoSelecionada: string | null;
  campoSelecionado: string | null;
  onSecaoSelect: (id: string | null) => void;
  onCampoSelect: (id: string | null) => void;
  onCriarSecao: (dados: any) => Promise<any>;
  onCriarCampo: (secaoId: string, tipo: TipoCampo) => Promise<any>;
  onExcluirSecao: (id: string) => Promise<void>;
  onExcluirCampo: (secaoId: string, campoId: string) => Promise<void>;
  onDuplicarCampo: (campoId: string) => Promise<void>;
  onReordenarSecoes: (secoes: Array<{ id: string; ordem: number }>) => Promise<void>;
  onReordenarCampos: (secaoId: string, campos: Array<{ id: string; ordem: number }>) => Promise<void>;
}

export function BuilderCanvas({
  secoes,
  campos,
  secaoSelecionada,
  campoSelecionado,
  onSecaoSelect,
  onCampoSelect,
  onCriarSecao,
  onCriarCampo,
  onExcluirSecao,
  onExcluirCampo,
  onDuplicarCampo,
  onReordenarSecoes,
  onReordenarCampos
}: BuilderCanvasProps) {
  const { toast } = useToast();
  const [secoesExpandidas, setSecoesExpandidas] = useState<Set<string>>(
    new Set(secoes.map(s => s.id))
  );
  const [dialogCriarSecao, setDialogCriarSecao] = useState(false);
  const [dragOverSecao, setDragOverSecao] = useState<string | null>(null);

  // Estado local otimista para drag & drop
  const [secoesLocais, setSecoesLocais] = useState<AnamneseSecao[]>(secoes);
  const [camposLocais, setCamposLocais] = useState<Record<string, AnamneseCampo[]>>(campos);

  // Sincronizar com props quando mudam
  useEffect(() => {
    setSecoesLocais(secoes);
  }, [secoes]);

  useEffect(() => {
    setCamposLocais(campos);
  }, [campos]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleSecao = (secaoId: string) => {
    const novasExpandidas = new Set(secoesExpandidas);
    if (novasExpandidas.has(secaoId)) {
      novasExpandidas.delete(secaoId);
    } else {
      novasExpandidas.add(secaoId);
    }
    setSecoesExpandidas(novasExpandidas);
  };

  const handleCriarSecao = async (dados: {
    titulo: string;
    descricao?: string;
    obrigatorio: boolean;
  }) => {
    const resultado = await onCriarSecao({
      ...dados,
      ordem: secoes.length
    });

    if (resultado) {
      setDialogCriarSecao(false);
      setSecoesExpandidas(prev => new Set([...prev, resultado.id]));
    }
  };

  const handleDragOver = (e: React.DragEvent, secaoId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverSecao(secaoId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSecao(null);
  };

  const handleDrop = async (e: React.DragEvent, secaoId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSecao(null);

    const campoTipo = e.dataTransfer.getData('campo-tipo') as TipoCampo;
    
    if (campoTipo) {
      await onCriarCampo(secaoId, campoTipo);
    }
  };

  const handleExcluirSecao = async (secaoId: string) => {
    if (campos[secaoId]?.length > 0) {
      toast({
        title: 'Não é possível excluir',
        description: 'Remova todos os campos desta seção primeiro.',
        variant: 'destructive'
      });
      return;
    }

    if (confirm('Tem certeza que deseja excluir esta seção?')) {
      await onExcluirSecao(secaoId);
    }
  };

  const handleDragEndSecoes = (event: DragEndEvent) => {  // ✅ SEM async
  const { active, over } = event;

  if (over && active.id !== over.id) {
    const oldIndex = secoesLocais.findIndex(s => s.id === active.id);
    const newIndex = secoesLocais.findIndex(s => s.id === over.id);

    // Reordenar manualmente
    const reordenadas = [...secoesLocais];
    const [item] = reordenadas.splice(oldIndex, 1);
    reordenadas.splice(newIndex, 0, item);

    // Atualizar estado local IMEDIATAMENTE
    setSecoesLocais(reordenadas);

    // Enviar para API em background (não await!)
    onReordenarSecoes(
      reordenadas.map((s, index) => ({ id: s.id, ordem: index }))
    ).catch(err => {
      console.error('Erro ao reordenar seções:', err);
      // Reverter em caso de erro
      setSecoesLocais(secoesLocais);
    });
  }
};

  const handleDragEndCampos = (secaoId: string) => {
  return (event: DragEndEvent) => {  // ✅ SEM async aqui
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const camposSecao = camposLocais[secaoId] || [];
      const oldIndex = camposSecao.findIndex(c => c.id === active.id);
      const newIndex = camposSecao.findIndex(c => c.id === over.id);

      // Reordenar manualmente
      const reordenados = [...camposSecao];
      const [item] = reordenados.splice(oldIndex, 1);
      reordenados.splice(newIndex, 0, item);

      // Atualizar estado local IMEDIATAMENTE
      setCamposLocais(prev => ({
        ...prev,
        [secaoId]: reordenados
      }));

      // Enviar para API em background (não await aqui!)
      onReordenarCampos(
        secaoId,
        reordenados.map((c, index) => ({ id: c.id, ordem: index }))
      ).catch(err => {
        console.error('Erro ao reordenar campos:', err);
        // Reverter em caso de erro
        setCamposLocais(prev => ({
          ...prev,
          [secaoId]: camposSecao
        }));
      });
    }
  };
};

  if (secoesLocais.length === 0) {
    return (
      <>
        <div className="flex-1 flex items-center justify-center bg-background">
          <EmptyState
            icon={FileText}
            title="Nenhuma seção criada"
            description="Comece criando uma seção para organizar os campos do formulário."
            action={{
              label: 'Criar Primeira Seção',
              onClick: () => setDialogCriarSecao(true)
            }}
          />
        </div>

        <CriarSecaoDialog
          open={dialogCriarSecao}
          onOpenChange={setDialogCriarSecao}
          onCriar={handleCriarSecao}
          proximaOrdem={0}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex-1 bg-background">
        {/* Header do Canvas */}
        <div className="border-b bg-muted/30 px-6 py-3 flex items-center justify-between">
          <h3 className="font-semibold">Estrutura do Formulário</h3>
          <Button size="sm" variant="outline" onClick={() => setDialogCriarSecao(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Seção
          </Button>
        </div>

        {/* Seções (Sortable) */}
        <ScrollArea className="h-[calc(100vh-340px)]">
          <div className="p-6">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEndSecoes}
            >
              <SortableContext
                items={secoesLocais.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {secoesLocais.map((secao, index) => {
                    const camposSecao = camposLocais[secao.id] || [];
                    const isExpanded = secoesExpandidas.has(secao.id);
                    const isSelected = secaoSelecionada === secao.id;
                    const isDragOver = dragOverSecao === secao.id;

                    return (
                      <DndContext
                        key={secao.id}
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEndCampos(secao.id)}
                      >
                        <SortableContext
                          items={camposSecao.map(c => c.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <SortableSecao
                            secao={secao}
                            index={index}
                            campos={camposSecao}
                            isExpanded={isExpanded}
                            isSelected={isSelected}
                            isDragOver={isDragOver}
                            onToggle={() => toggleSecao(secao.id)}
                            onSelect={() => onSecaoSelect(secao.id)}
                            onEdit={() => onSecaoSelect(secao.id)}
                            onDelete={() => handleExcluirSecao(secao.id)}
                            onDragOver={(e) => handleDragOver(e, secao.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, secao.id)}
                            onCampoSelect={onCampoSelect}
                            campoSelecionado={campoSelecionado}
                            onCampoEdit={onCampoSelect}
                            onCampoDelete={(campoId) => onExcluirCampo(secao.id, campoId)}
                            onCampoDuplicate={onDuplicarCampo}
                          />
                        </SortableContext>
                      </DndContext>
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </ScrollArea>
      </div>

      <CriarSecaoDialog
        open={dialogCriarSecao}
        onOpenChange={setDialogCriarSecao}
        onCriar={handleCriarSecao}
        proximaOrdem={secoesLocais.length}
      />
    </>
  );
}