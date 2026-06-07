import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { useTags } from '@/hooks/useTags';
import api from '@/lib/api';

interface CampanhaSimples {
  id: number;
  nome_campanha: string;
  campanha_status: string;
}

interface CanalOrigem {
  id: number;
  nome: string;
  icone: string;
}

interface LeadFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filterStatus: string;
  onStatusChange: (status: string) => void;
  filterOrigin: string;
  onOriginChange: (origin: string) => void;
  filterTag: string;
  onTagChange: (tag: string) => void;
  filterCampanha: string;
  onCampanhaChange: (campanha: string) => void;
}

export function LeadFilters({
  searchTerm,
  onSearchChange,
  filterStatus,
  onStatusChange,
  filterOrigin,
  onOriginChange,
  filterTag,
  onTagChange,
  filterCampanha,
  onCampanhaChange,
}: LeadFiltersProps) {
  const { tags } = useTags();
  const [campanhas, setCampanhas] = useState<CampanhaSimples[]>([]);
  const [canais, setCanais] = useState<CanalOrigem[]>([]);

  useEffect(() => {
    api.get('/campanhas')
      .then(res => {
        const data = res.data?.data ?? res.data;
        setCampanhas(Array.isArray(data) ? data : []);
      })
      .catch(() => setCampanhas([]));
  }, []);

  useEffect(() => {
    api.get('/campanhas/canais')
      .then(res => {
        const data = res.data?.data ?? res.data;
        setCanais(Array.isArray(data) ? data : []);
      })
      .catch(() => setCanais([]));
  }, []);
  return (
    <div className="flex flex-col md:flex-row gap-2 md:gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, telefone ou email..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-2 md:contents gap-2 md:gap-0">
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
          {canais.map(canal => (
            <SelectItem key={canal.id} value={canal.nome}>
              <span className="flex items-center gap-2">
                <span>{canal.icone}</span>
                <span>{canal.nome}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filterTag} onValueChange={onTagChange}>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Tag" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas as tags</SelectItem>
          {tags.map(tag => (
            <SelectItem key={tag.id} value={tag.id}>
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: tag.cor }}
                />
                {tag.nome}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filterCampanha} onValueChange={onCampanhaChange}>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Campanha" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas as campanhas</SelectItem>
          {campanhas.map(c => (
            <SelectItem key={c.id} value={String(c.id)}>
              {c.nome_campanha}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      </div>
    </div>
  );
}
