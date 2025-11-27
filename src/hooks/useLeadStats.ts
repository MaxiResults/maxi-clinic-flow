import { useMemo } from 'react';
import type { Lead } from './useLeadsData';

export function useLeadStats(leads: Lead[]) {
  return useMemo(() => {
    const total = leads.length;
    const novos = leads.filter(l => l.status === 'novo').length;
    const qualificados = leads.filter(l => l.status === 'qualificado').length;
    const convertidos = leads.filter(l => l.status === 'convertido').length;
    
    const taxaConversao = total > 0 
      ? Number(((convertidos / total) * 100).toFixed(2))
      : 0;

    return {
      total,
      novos,
      qualificados,
      convertidos,
      taxaConversao,
    };
  }, [leads]);
}
