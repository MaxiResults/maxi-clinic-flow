import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Type,
  AlignLeft,
  Mail,
  Phone,
  Calendar,
  Hash,
  CheckSquare,
  Circle,
  List,
  FileText,
  PenTool,
  Search
} from 'lucide-react';
import { TipoCampo } from '@/types/anamnese.types';

interface CampoDisponivel {
  tipo: TipoCampo;
  label: string;
  icon: any;
  descricao: string;
}

const CAMPOS_DISPONIVEIS: CampoDisponivel[] = [
  {
    tipo: 'text',
    label: 'Texto Curto',
    icon: Type,
    descricao: 'Campo de texto de uma linha'
  },
  {
    tipo: 'textarea',
    label: 'Texto Longo',
    icon: AlignLeft,
    descricao: 'Campo de texto com múltiplas linhas'
  },
  {
    tipo: 'email',
    label: 'E-mail',
    icon: Mail,
    descricao: 'Campo validado para e-mail'
  },
  {
    tipo: 'phone',
    label: 'Telefone',
    icon: Phone,
    descricao: 'Campo com máscara de telefone'
  },
  {
    tipo: 'cpf',
    label: 'CPF',
    icon: FileText,
    descricao: 'Campo com máscara de CPF'
  },
  {
    tipo: 'date',
    label: 'Data',
    icon: Calendar,
    descricao: 'Seletor de data'
  },
  {
    tipo: 'number',
    label: 'Número',
    icon: Hash,
    descricao: 'Campo numérico'
  },
  {
    tipo: 'select',
    label: 'Lista de Seleção',
    icon: List,
    descricao: 'Menu dropdown com opções'
  },
  {
    tipo: 'radio',
    label: 'Escolha Única',
    icon: Circle,
    descricao: 'Botões de opção (radio)'
  },
  {
    tipo: 'checkbox',
    label: 'Múltipla Escolha',
    icon: CheckSquare,
    descricao: 'Caixas de seleção'
  },
  {
    tipo: 'signature',
    label: 'Assinatura Digital',
    icon: PenTool,
    descricao: 'Campo para desenhar assinatura'
  }
];

export function BuilderSidebar() {
  const [busca, setBusca] = useState('');

  const camposFiltrados = CAMPOS_DISPONIVEIS.filter(
    (campo) =>
      campo.label.toLowerCase().includes(busca.toLowerCase()) ||
      campo.descricao.toLowerCase().includes(busca.toLowerCase())
  );

  const handleDragStart = (e: React.DragEvent, campo: CampoDisponivel) => {
    e.dataTransfer.setData('campo-tipo', campo.tipo);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-64 border-r bg-muted/30 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold mb-3">Campos Disponíveis</h3>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar campo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Lista de Campos */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {camposFiltrados.map((campo) => {
            const Icon = campo.icon;
            return (
              <div
                key={campo.tipo}
                draggable
                onDragStart={(e) => handleDragStart(e, campo)}
                className="flex items-start gap-3 p-3 rounded-md border bg-card hover:bg-accent hover:border-primary cursor-move transition-colors group"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-none mb-1">
                    {campo.label}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {campo.descricao}
                  </p>
                </div>
              </div>
            );
          })}

          {camposFiltrados.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Nenhum campo encontrado</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer com dica */}
      <div className="p-4 border-t bg-muted/50">
        <p className="text-xs text-muted-foreground">
          💡 <strong>Dica:</strong> Arraste os campos para o canvas para adicionar ao formulário
        </p>
      </div>
    </div>
  );
}