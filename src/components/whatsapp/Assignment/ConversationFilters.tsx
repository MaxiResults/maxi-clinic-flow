import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type ConversationFilter = "todas" | "minhas" | "fila" | "resolvidas";

interface ConversationFiltersProps {
  filter: ConversationFilter;
  onFilterChange: (filter: ConversationFilter) => void;
  minhasCount?: number;
  todasCount?: number;
  filaCount?: number;
}

export function ConversationFilters({
  filter,
  onFilterChange,
  minhasCount,
  todasCount,
  filaCount,
}: ConversationFiltersProps) {
  return (
    <Tabs
      value={filter}
      onValueChange={(v) => onFilterChange(v as ConversationFilter)}
    >
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="todas">
          Todas {todasCount !== undefined && `(${todasCount})`}
        </TabsTrigger>
        <TabsTrigger value="minhas">
          Minhas {minhasCount !== undefined && `(${minhasCount})`}
        </TabsTrigger>
        <TabsTrigger value="fila">
          Fila {filaCount !== undefined && `(${filaCount})`}
        </TabsTrigger>
        <TabsTrigger value="resolvidas">Resolvidas</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
