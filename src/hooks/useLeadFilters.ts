import { useState, useMemo } from 'react';
import type { Lead } from './useLeadsData';

export function useLeadFilters(leads: Lead[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterOrigin, setFilterOrigin] = useState('todos');
  const [filterTag, setFilterTag] = useState('todas');
  const [filterCampanha, setFilterCampanha] = useState('todas');
  const [sortBy, setSortBy] = useState<'created_at' | 'nome'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredLeads = useMemo(() => {
    let result = [...leads];

    // Busca por nome, telefone, email
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(lead =>
        lead.nome.toLowerCase().includes(search) ||
        lead.telefone.includes(search) ||
        lead.email?.toLowerCase().includes(search)
      );
    }

    // Filtro por status
    if (filterStatus !== 'todos') {
      result = result.filter(lead => lead.status === filterStatus);
    }

    // Filtro por origem
    if (filterOrigin !== 'todos') {
      result = result.filter(lead => lead.canal_origem === filterOrigin);
    }

    // Filtro por tag
    if (filterTag !== 'todas') {
      result = result.filter(lead =>
        lead.tags?.some(t => t.id === filterTag)
      );
    }

    // Filtro por campanha
    if (filterCampanha !== 'todas') {
      result = result.filter(lead =>
        String(lead.campanha_id) === filterCampanha
      );
    }

    // Ordenação
    result.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'created_at') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === 'nome') {
        comparison = a.nome.localeCompare(b.nome);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [leads, searchTerm, filterStatus, filterOrigin, filterTag, filterCampanha, sortBy, sortOrder]);

  return {
    filteredLeads,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filterOrigin,
    setFilterOrigin,
    filterTag,
    setFilterTag,
    filterCampanha,
    setFilterCampanha,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
  };
}
