import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import {
  GripVertical,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Copy
} from 'lucide-react';
import { AnamneseSecao, AnamneseCampo } from '@/types/anamnese.types';
import { SortableCampo } from './SortableCampo';

interface SortableSecaoProps {
  secao: AnamneseSecao;
  index: number;
  campos: AnamneseCampo[];
  isExpanded: boolean;
  isSelected: boolean;
  isDragOver: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onCampoSelect: (id: string) => void;
  campoSelecionado: string | null;
  onCampoEdit: (id: string) => void;
  onCampoDelete: (id: string) => void;
  onCampoDuplicate: (id: string) => void;
}

export function SortableSecao({
  secao,
  index,
  campos,
  isExpanded,
  isSelected,
  isDragOver,
  onToggle,
  onSelect,
  onEdit,
  onDelete,
  onDragOver,
  onDragLeave,
  onDrop,
  onCampoSelect,
  campoSelecionado,
  onCampoEdit,
  onCampoDelete,
  onCampoDuplicate
}: SortableSecaoProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: secao.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg overflow-hidden transition-all ${
        isSelected ? 'ring-2 ring-primary' : ''
      } ${isDragging ? 'z-50 shadow-lg' : ''}`}
    >
      {/* Header da Seção */}
      <div
        className={`flex items-center gap-3 p-4 bg-card cursor-pointer hover:bg-accent/50 transition-colors ${
          isSelected ? 'bg-accent' : ''
        }`}
        onClick={onSelect}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="hover:bg-accent rounded p-1"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        <div
          {...attributes}
          {...listeners}
          className="cursor-move touch-none"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">
              {index + 1}. {secao.titulo}
            </h4>
            {secao.obrigatorio && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                Obrigatória
              </span>
            )}
          </div>
          {secao.descricao && (
            <p className="text-sm text-muted-foreground mt-1">
              {secao.descricao}
            </p>
          )}
        </div>

        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Campos da Seção */}
      {isExpanded && (
        <div
          className={`border-t transition-colors ${
            isDragOver ? 'bg-primary/10' : 'bg-muted/20'
          }`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          {campos.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                {isDragOver ? '📥 Solte aqui para adicionar' : 'Nenhum campo nesta seção'}
              </p>
              <p className="text-xs text-muted-foreground">
                Arraste campos da barra lateral para adicionar
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {campos.map((campo) => (
                <SortableCampo
                  key={campo.id}
                  campo={campo}
                  isSelected={campoSelecionado === campo.id}
                  onSelect={() => onCampoSelect(campo.id)}
                  onEdit={() => onCampoEdit(campo.id)}
                  onDelete={() => onCampoDelete(campo.id)}
                  onDuplicate={() => onCampoDuplicate(campo.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}