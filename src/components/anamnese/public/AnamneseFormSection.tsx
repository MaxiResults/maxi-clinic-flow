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
import { AnamneseSecao, AnamneseCampo } from '@/types/anamnese.types';
import { AssinaturaTexto } from './AssinaturaTexto';  

interface AnamneseFormSectionProps {
  secao: AnamneseSecao;
  campos: AnamneseCampo[];
  respostas: Record<string, any>;
  erros: Record<string, string>;
  onChange: (respostas: Record<string, any>) => void;
}

export function AnamneseFormSection({
  secao,
  campos,
  respostas,
  erros,
  onChange
}: AnamneseFormSectionProps) {
  const handleChange = (campoId: string, valor: any) => {
    onChange({
      ...respostas,
      [campoId]: valor
    });
  };

  const renderCampo = (campo: AnamneseCampo) => {
    const valor = respostas[campo.id] || '';
    const erro = erros[campo.id];
    const larguraClass = {
      full: 'col-span-12',
      half: 'col-span-12 md:col-span-6',
      third: 'col-span-12 md:col-span-4'
    }[campo.largura];

    return (
      <div key={campo.id} className={larguraClass}>
        <Label htmlFor={campo.id} className="mb-2 block">
          {campo.label}
          {campo.obrigatorio && <span className="text-destructive ml-1">*</span>}
        </Label>

        {campo.ajuda && (
          <p className="text-xs text-muted-foreground mb-2">{campo.ajuda}</p>
        )}

        {renderInput(campo, valor, erro)}

        {erro && (
          <p className="text-xs text-destructive mt-1">{erro}</p>
        )}
      </div>
    );
  };

  const renderInput = (campo: AnamneseCampo, valor: any, erro?: string) => {
    switch (campo.tipo_campo) {
      case 'text':
        return (
          <Input
            id={campo.id}
            type="text"
            placeholder={campo.placeholder || ''}
            value={valor}
            onChange={(e) => handleChange(campo.id, e.target.value)}
            className={erro ? 'border-destructive' : ''}
          />
        );

      case 'email':
        return (
          <Input
            id={campo.id}
            type="email"
            placeholder={campo.placeholder || 'seu@email.com'}
            value={valor}
            onChange={(e) => handleChange(campo.id, e.target.value)}
            className={erro ? 'border-destructive' : ''}
          />
        );

      case 'phone':
        return (
          <Input
            id={campo.id}
            type="tel"
            placeholder={campo.placeholder || '(00) 00000-0000'}
            value={valor}
            onChange={(e) => handleChange(campo.id, e.target.value)}
            className={erro ? 'border-destructive' : ''}
          />
        );

      case 'cpf':
        return (
          <Input
            id={campo.id}
            type="text"
            placeholder={campo.placeholder || '000.000.000-00'}
            value={valor}
            onChange={(e) => handleChange(campo.id, e.target.value)}
            maxLength={14}
            className={erro ? 'border-destructive' : ''}
          />
        );

      case 'textarea':
        return (
          <Textarea
            id={campo.id}
            placeholder={campo.placeholder || ''}
            value={valor}
            onChange={(e) => handleChange(campo.id, e.target.value)}
            rows={4}
            className={erro ? 'border-destructive' : ''}
          />
        );

      case 'number':
        return (
          <Input
            id={campo.id}
            type="number"
            placeholder={campo.placeholder || ''}
            value={valor}
            onChange={(e) => handleChange(campo.id, e.target.value)}
            className={erro ? 'border-destructive' : ''}
          />
        );

      case 'date':
        return (
          <Input
            id={campo.id}
            type="date"
            value={valor}
            onChange={(e) => handleChange(campo.id, e.target.value)}
            className={erro ? 'border-destructive' : ''}
          />
        );

      case 'select':
        return (
          <Select
            value={valor}
            onValueChange={(value) => handleChange(campo.id, value)}
          >
            <SelectTrigger className={erro ? 'border-destructive' : ''}>
              <SelectValue placeholder={campo.placeholder || 'Selecione uma opção'} />
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
            onValueChange={(value) => handleChange(campo.id, value)}
            className="space-y-3"
          >
            {campo.opcoes?.map((opcao, index) => (
              <div key={index} className="flex items-center space-x-3">
                <RadioGroupItem value={opcao} id={`${campo.id}-${index}`} />
                <Label
                  htmlFor={`${campo.id}-${index}`}
                  className="font-normal cursor-pointer"
                >
                  {opcao}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'checkbox':
        const checkboxValues = Array.isArray(valor) ? valor : [];
        return (
          <div className="space-y-3">
            {campo.opcoes?.map((opcao, index) => {
              const isChecked = checkboxValues.includes(opcao);
              return (
                <div key={index} className="flex items-center space-x-3">
                  <Checkbox
                    id={`${campo.id}-${index}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      const newValues = checked
                        ? [...checkboxValues, opcao]
                        : checkboxValues.filter((v: string) => v !== opcao);
                      handleChange(campo.id, newValues);
                    }}
                  />
                  <Label
                    htmlFor={`${campo.id}-${index}`}
                    className="font-normal cursor-pointer"
                  >
                    {opcao}
                  </Label>
                </div>
              );
            })}
          </div>
        );

      case 'signature':
        return (
          <AssinaturaTexto
            value={valor}
            onChange={(base64) => handleChange(campo.id, base64)}
            erro={erro}
          />
        );

      default:
        return (
          <Input
            id={campo.id}
            type="text"
            placeholder={campo.placeholder || ''}
            value={valor}
            onChange={(e) => handleChange(campo.id, e.target.value)}
            className={erro ? 'border-destructive' : ''}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Título e descrição da seção */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          {secao.titulo}
          {secao.obrigatorio && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
              Obrigatória
            </span>
          )}
        </h2>
        {secao.descricao && (
          <p className="text-muted-foreground mt-2">{secao.descricao}</p>
        )}
      </div>

      {/* Campos em grid */}
      <div className="grid grid-cols-12 gap-6">
        {campos.map(renderCampo)}
      </div>
    </div>
  );
}