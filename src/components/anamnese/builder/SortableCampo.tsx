import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { GripVertical, Edit, Trash2, Copy } from 'lucide-react';
import { AnamneseCampo, TIPOS_CAMPO_LABELS } from '@/types/anamnese.types';

interface SortableCampoProps {
  campo: AnamneseCampo;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export function SortableCampo({
  campo,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate
}: SortableCampoProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: campo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-md border bg-card hover:bg-accent/50 cursor-pointer transition-colors ${
        isSelected ? 'ring-2 ring-primary bg-accent' : ''
      } ${isDragging ? 'z-50 shadow-lg' : ''}`}
      onClick={onSelect}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-move touch-none"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{campo.label}</p>
          {campo.obrigatorio && (
            <span className="text-xs text-destructive">*</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {TIPOS_CAMPO_LABELS[campo.tipo_campo]}
          {campo.campo_sistema && (
            <> • Alimenta: {campo.campo_sistema}</>
          )}
        </p>
      </div>

      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          title="Duplicar campo"
        >
          <Copy className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Edit className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}