import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ConversationFiltersProps {
  filter: "todas" | "minhas" | "resolvidas";
  onFilterChange: (filter: "todas" | "minhas" | "resolvidas") => void;
  minhasCount?: number;
  todasCount?: number;
}

export function ConversationFilters({
  filter,
  onFilterChange,
  minhasCount,
  todasCount,
}: ConversationFiltersProps) {
  return (
    <Tabs
      value={filter}
      onValueChange={(v) => onFilterChange(v as "todas" | "minhas" | "resolvidas")}
    >
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="todas">
          Todas {todasCount !== undefined && `(${todasCount})`}
        </TabsTrigger>
        <TabsTrigger value="minhas">
          Minhas {minhasCount !== undefined && `(${minhasCount})`}
        </TabsTrigger>
        <TabsTrigger value="resolvidas">
          Resolvidas
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
