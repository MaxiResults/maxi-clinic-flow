import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface LeadFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filterStatus: string;
  onStatusChange: (status: string) => void;
  filterOrigin: string;
  onOriginChange: (origin: string) => void;
}

export function LeadFilters({
  searchTerm,
  onSearchChange,
  filterStatus,
  onStatusChange,
  filterOrigin,
  onOriginChange,
}: LeadFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, telefone ou email..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <Select value={filterStatus} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os status</SelectItem>
          <SelectItem value="novo">Novo</SelectItem>
          <SelectItem value="qualificado">Qualificado</SelectItem>
          <SelectItem value="convertido">Convertido</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filterOrigin} onValueChange={onOriginChange}>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Canal" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os canais</SelectItem>
          <SelectItem value="Instagram">Instagram</SelectItem>
          <SelectItem value="WhatsApp">WhatsApp</SelectItem>
          <SelectItem value="Site">Site</SelectItem>
          <SelectItem value="Facebook">Facebook</SelectItem>
          <SelectItem value="Google">Google</SelectItem>
          <SelectItem value="Indicação">Indicação</SelectItem>
          <SelectItem value="Outro">Outro</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
