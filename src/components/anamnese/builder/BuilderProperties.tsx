import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings, Save, X } from 'lucide-react';
import { 
  AnamneseSecao, 
  AnamneseCampo,
  CAMPOS_SISTEMA_LABELS,
  CampoSistema
} from '@/types/anamnese.types';

interface BuilderPropertiesProps {
  secaoSelecionada: string | null;
  campoSelecionado: string | null;
  secoes: AnamneseSecao[];
  campos: Record<string, AnamneseCampo[]>;
  onAtualizarCampo?: (campoId: string, dados: any) => Promise<void>;
  onAtualizarSecao?: (secaoId: string, dados: any) => Promise<void>;
}

export function BuilderProperties({
  secaoSelecionada,
  campoSelecionado,
  secoes,
  campos,
  onAtualizarCampo,
  onAtualizarSecao
}: BuilderPropertiesProps) {
  const [editando, setEditando] = useState(false);
  const [formCampo, setFormCampo] = useState<any>(null);
  const [formSecao, setFormSecao] = useState<any>(null);

  // Encontrar seção selecionada
  const secao = secoes.find(s => s.id === secaoSelecionada);
  
  // Encontrar campo selecionado
  let campo: AnamneseCampo | undefined;
  if (campoSelecionado) {
    for (const camposSecao of Object.values(campos)) {
      campo = camposSecao.find(c => c.id === campoSelecionado);
      if (campo) break;
    }
  }

  // Resetar form quando mudar seleção
  useEffect(() => {
    if (campo) {
      setFormCampo({
        label: campo.label,
        placeholder: campo.placeholder || '',
        obrigatorio: campo.obrigatorio,
        largura: campo.largura,
        ajuda: campo.ajuda || '',
        campo_sistema: campo.campo_sistema || 'none'
      });
      setEditando(false);
    }
  }, [campoSelecionado]);

  useEffect(() => {
    if (secao) {
      setFormSecao({
        titulo: secao.titulo,
        descricao: secao.descricao || '',
        obrigatorio: secao.obrigatorio
      });
      setEditando(false);
    }
  }, [secaoSelecionada]);

  const handleSalvarCampo = async () => {
    if (!campo || !onAtualizarCampo) return;

    await onAtualizarCampo(campo.id, {
      label: formCampo.label,
      placeholder: formCampo.placeholder || undefined,
      obrigatorio: formCampo.obrigatorio,
      largura: formCampo.largura,
      ajuda: formCampo.ajuda || undefined,
      campo_sistema: formCampo.campo_sistema === 'none' ? undefined : formCampo.campo_sistema
    });

    setEditando(false);
  };

  const handleSalvarSecao = async () => {
    if (!secao || !onAtualizarSecao) return;

    await onAtualizarSecao(secao.id, {
      titulo: formSecao.titulo,
      descricao: formSecao.descricao || undefined,
      obrigatorio: formSecao.obrigatorio
    });

    setEditando(false);
  };

  const handleCancelar = () => {
    setEditando(false);
    
    // Restaurar valores originais
    if (campo) {
      setFormCampo({
        label: campo.label,
        placeholder: campo.placeholder || '',
        obrigatorio: campo.obrigatorio,
        largura: campo.largura,
        ajuda: campo.ajuda || '',
        campo_sistema: campo.campo_sistema || 'none'
      });
    }

    if (secao) {
      setFormSecao({
        titulo: secao.titulo,
        descricao: secao.descricao || '',
        obrigatorio: secao.obrigatorio
      });
    }
  };

  return (
    <div className="w-80 border-l bg-muted/30 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <h3 className="font-semibold">Propriedades</h3>
          </div>
          {(campo || secao) && !editando && (
            <Button size="sm" variant="outline" onClick={() => setEditando(true)}>
              Editar
            </Button>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {/* Estado Vazio */}
          {!secaoSelecionada && !campoSelecionado && (
            <div className="text-center py-12">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                Selecione uma seção ou campo para editar suas propriedades
              </p>
            </div>
          )}

          {/* Editar Campo */}
          {campo && formCampo && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">Campo</h4>
                <p className="text-sm text-muted-foreground">{campo.label}</p>
              </div>

              {editando ? (
                <>
                  {/* Form de Edição */}
                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="label">Label *</Label>
                      <Input
                        id="label"
                        value={formCampo.label}
                        onChange={(e) =>
                          setFormCampo({ ...formCampo, label: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="placeholder">Placeholder</Label>
                      <Input
                        id="placeholder"
                        value={formCampo.placeholder}
                        onChange={(e) =>
                          setFormCampo({ ...formCampo, placeholder: e.target.value })
                        }
                        placeholder="Ex: Digite seu nome completo"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="largura">Largura</Label>
                      <Select
                        value={formCampo.largura}
                        onValueChange={(value: 'full' | 'half' | 'third') =>
                          setFormCampo({ ...formCampo, largura: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full">Largura Total</SelectItem>
                          <SelectItem value="half">Meia Largura</SelectItem>
                          <SelectItem value="third">Um Terço</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="campo_sistema">Alimenta Campo do Sistema</Label>
                      <Select
                        value={formCampo.campo_sistema}
                        onValueChange={(value) =>
                          setFormCampo({ ...formCampo, campo_sistema: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Nenhum" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="none">Nenhum</SelectItem>
                            {Object.entries(CAMPOS_SISTEMA_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Atualiza automaticamente o cadastro do paciente
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ajuda">Texto de Ajuda</Label>
                      <Textarea
                        id="ajuda"
                        value={formCampo.ajuda}
                        onChange={(e) =>
                          setFormCampo({ ...formCampo, ajuda: e.target.value })
                        }
                        placeholder="Instrução adicional para o paciente..."
                        rows={2}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <Label htmlFor="obrigatorio" className="cursor-pointer">
                        Campo obrigatório
                      </Label>
                      <Switch
                        id="obrigatorio"
                        checked={formCampo.obrigatorio}
                        onCheckedChange={(checked) =>
                          setFormCampo({ ...formCampo, obrigatorio: checked })
                        }
                      />
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={handleCancelar}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={handleSalvarCampo}
                      disabled={!formCampo.label.trim()}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Visualização */}
                  <div className="space-y-3 pt-4 border-t text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Tipo</p>
                      <p className="font-medium">{campo.tipo_campo}</p>
                    </div>

                    {campo.placeholder && (
                      <div>
                        <p className="text-muted-foreground mb-1">Placeholder</p>
                        <p className="font-medium">{campo.placeholder}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-muted-foreground mb-1">Largura</p>
                      <p className="font-medium">
                        {campo.largura === 'full' && 'Largura Total'}
                        {campo.largura === 'half' && 'Meia Largura'}
                        {campo.largura === 'third' && 'Um Terço'}
                      </p>
                    </div>

                    {campo.campo_sistema && (
                      <div>
                        <p className="text-muted-foreground mb-1">Alimenta</p>
                        <p className="font-medium">
                          {CAMPOS_SISTEMA_LABELS[campo.campo_sistema as CampoSistema]}
                        </p>
                      </div>
                    )}

                    {campo.ajuda && (
                      <div>
                        <p className="text-muted-foreground mb-1">Ajuda</p>
                        <p className="font-medium">{campo.ajuda}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-muted-foreground mb-1">Obrigatório</p>
                      <p className="font-medium">{campo.obrigatorio ? 'Sim' : 'Não'}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Editar Seção */}
          {secao && !campo && formSecao && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">Seção</h4>
                <p className="text-sm text-muted-foreground">{secao.titulo}</p>
              </div>

              {editando ? (
                <>
                  {/* Form de Edição */}
                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="titulo">Título *</Label>
                      <Input
                        id="titulo"
                        value={formSecao.titulo}
                        onChange={(e) =>
                          setFormSecao({ ...formSecao, titulo: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="descricao">Descrição</Label>
                      <Textarea
                        id="descricao"
                        value={formSecao.descricao}
                        onChange={(e) =>
                          setFormSecao({ ...formSecao, descricao: e.target.value })
                        }
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <Label htmlFor="sec-obrigatorio" className="cursor-pointer">
                        Seção obrigatória
                      </Label>
                      <Switch
                        id="sec-obrigatorio"
                        checked={formSecao.obrigatorio}
                        onCheckedChange={(checked) =>
                          setFormSecao({ ...formSecao, obrigatorio: checked })
                        }
                      />
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={handleCancelar}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={handleSalvarSecao}
                      disabled={!formSecao.titulo.trim()}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Visualização */}
                  <div className="space-y-3 pt-4 border-t text-sm">
                    {secao.descricao && (
                      <div>
                        <p className="text-muted-foreground mb-1">Descrição</p>
                        <p className="font-medium">{secao.descricao}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-muted-foreground mb-1">Obrigatória</p>
                      <p className="font-medium">{secao.obrigatorio ? 'Sim' : 'Não'}</p>
                    </div>

                    <div>
                      <p className="text-muted-foreground mb-1">Ordem</p>
                      <p className="font-medium">{secao.ordem + 1}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}