import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ConversationFiltersProps {
  filter: "todas" | "minhas";
  onFilterChange: (filter: "todas" | "minhas") => void;
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
      onValueChange={(v) => onFilterChange(v as "todas" | "minhas")}
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="todas">
          Todas {todasCount !== undefined && `(${todasCount})`}
        </TabsTrigger>
        <TabsTrigger value="minhas">
          Minhas {minhasCount !== undefined && `(${minhasCount})`}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
