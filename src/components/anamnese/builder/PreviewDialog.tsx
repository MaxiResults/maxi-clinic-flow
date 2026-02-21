import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { AnamneseSecao, AnamneseCampo, TIPOS_CAMPO_LABELS } from '@/types/anamnese.types';

interface PreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  secoes: AnamneseSecao[];
  campos: Record<string, AnamneseCampo[]>;
  templateNome: string;
}

export function PreviewDialog({
  open,
  onOpenChange,
  secoes,
  campos,
  templateNome
}: PreviewDialogProps) {
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, any>>({});

  const secaoAtual = secoes[etapaAtual];
  const camposSecao = secaoAtual ? campos[secaoAtual.id] || [] : [];
  const totalEtapas = secoes.length;
  const progresso = totalEtapas > 0 ? ((etapaAtual + 1) / totalEtapas) * 100 : 0;

  const handleProximo = () => {
    if (etapaAtual < totalEtapas - 1) {
      setEtapaAtual(etapaAtual + 1);
    }
  };

  const handleAnterior = () => {
    if (etapaAtual > 0) {
      setEtapaAtual(etapaAtual - 1);
    }
  };

  const handleResposta = (campoId: string, valor: any) => {
    setRespostas(prev => ({
      ...prev,
      [campoId]: valor
    }));
  };

  const renderCampo = (campo: AnamneseCampo) => {
    const larguraClass = {
      full: 'col-span-12',
      half: 'col-span-12 md:col-span-6',
      third: 'col-span-12 md:col-span-4'
    }[campo.largura];

    return (
      <div key={campo.id} className={larguraClass}>
        <Label htmlFor={campo.id}>
          {campo.label}
          {campo.obrigatorio && <span className="text-destructive ml-1">*</span>}
        </Label>
        
        {campo.ajuda && (
          <p className="text-xs text-muted-foreground mt-1 mb-2">{campo.ajuda}</p>
        )}

        {renderCampoInput(campo)}
      </div>
    );
  };

  const renderCampoInput = (campo: AnamneseCampo) => {
    const valor = respostas[campo.id] || '';

    switch (campo.tipo_campo) {
      case 'text':
      case 'email':
      case 'phone':
      case 'cpf':
        return (
          <Input
            id={campo.id}
            type={campo.tipo_campo === 'email' ? 'email' : 'text'}
            placeholder={campo.placeholder || ''}
            value={valor}
            onChange={(e) => handleResposta(campo.id, e.target.value)}
            className="mt-2"
          />
        );

      case 'textarea':
        return (
          <Textarea
            id={campo.id}
            placeholder={campo.placeholder || ''}
            value={valor}
            onChange={(e) => handleResposta(campo.id, e.target.value)}
            className="mt-2"
            rows={4}
          />
        );

      case 'number':
        return (
          <Input
            id={campo.id}
            type="number"
            placeholder={campo.placeholder || ''}
            value={valor}
            onChange={(e) => handleResposta(campo.id, e.target.value)}
            className="mt-2"
          />
        );

      case 'date':
        return (
          <Input
            id={campo.id}
            type="date"
            value={valor}
            onChange={(e) => handleResposta(campo.id, e.target.value)}
            className="mt-2"
          />
        );

      case 'select':
        return (
          <Select
            value={valor}
            onValueChange={(value) => handleResposta(campo.id, value)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Selecione uma opção" />
            </SelectTrigger>
            <SelectContent>
              {campo.opcoes?.map((opcao, index) => (
                <SelectItem key={index} value={opcao}>
                  {opcao}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <RadioGroup
            value={valor}
            onValueChange={(value) => handleResposta(campo.id, value)}
            className="mt-2 space-y-2"
          >
            {campo.opcoes?.map((opcao, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={opcao} id={`${campo.id}-${index}`} />
                <Label htmlFor={`${campo.id}-${index}`} className="font-normal cursor-pointer">
                  {opcao}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'checkbox':
        return (
          <div className="mt-2 space-y-2">
            {campo.opcoes?.map((opcao, index) => {
              const checkboxValues = valor || [];
              const isChecked = checkboxValues.includes(opcao);

              return (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${campo.id}-${index}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      const newValues = checked
                        ? [...checkboxValues, opcao]
                        : checkboxValues.filter((v: string) => v !== opcao);
                      handleResposta(campo.id, newValues);
                    }}
                  />
                  <Label htmlFor={`${campo.id}-${index}`} className="font-normal cursor-pointer">
                    {opcao}
                  </Label>
                </div>
              );
            })}
          </div>
        );

      case 'signature':
        return (
          <div className="mt-2 border-2 border-dashed rounded-lg p-8 text-center bg-muted/50">
            <p className="text-sm text-muted-foreground">
              Área de assinatura digital
            </p>
          </div>
        );

      default:
        return (
          <Input
            id={campo.id}
            placeholder={campo.placeholder || ''}
            value={valor}
            onChange={(e) => handleResposta(campo.id, e.target.value)}
            className="mt-2"
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-2xl">{templateNome}</DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Visualização de como o formulário aparecerá para o paciente
          </p>
        </DialogHeader>

        {/* Barra de Progresso */}
        <div className="px-6 py-3 bg-muted/50 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Etapa {etapaAtual + 1} de {totalEtapas}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progresso)}% completo
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>

        {/* Conteúdo da Seção */}
        <ScrollArea className="flex-1 px-6 py-6 max-h-[50vh]">
          {secaoAtual ? (
            <div className="space-y-6">
              {/* Título e Descrição da Seção */}
              <div>
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  {secaoAtual.titulo}
                  {secaoAtual.obrigatorio && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      Obrigatória
                    </span>
                  )}
                </h3>
                {secaoAtual.descricao && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {secaoAtual.descricao}
                  </p>
                )}
              </div>

              {/* Campos */}
              {camposSecao.length > 0 ? (
                <div className="grid grid-cols-12 gap-4">
                  {camposSecao.map(renderCampo)}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Nenhum campo nesta seção</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhuma seção criada</p>
            </div>
          )}
        </ScrollArea>

        {/* Navegação */}
        <div className="px-6 py-4 border-t bg-muted/50 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleAnterior}
            disabled={etapaAtual === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          {etapaAtual < totalEtapas - 1 ? (
            <Button onClick={handleProximo}>
              Próximo
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={() => onOpenChange(false)}>
              Finalizar Preview
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}