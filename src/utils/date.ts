import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Tipo aceito pelas funções de formatação
 */
export type DateInput = string | Date | null | undefined;

/**
 * Valida se uma data é válida
 * @param data - String, Date, null ou undefined
 * @returns true se a data é válida
 */
export function validarData(data: DateInput): boolean {
  if (!data) return false;
  
  try {
    const date = typeof data === 'string' ? parseISO(data) : data;
    return isValid(date) && !isNaN(date.getTime());
  } catch {
    return false;
  }
}

/**
 * Converte entrada para Date object de forma segura
 * @param data - String, Date, null ou undefined
 * @returns Date object ou null se inválido
 */
export function parseDataSegura(data: DateInput): Date | null {
  if (!data) return null;
  
  try {
    const date = typeof data === 'string' ? parseISO(data) : data;
    
    if (!isValid(date) || isNaN(date.getTime())) {
      return null;
    }
    
    return date;
  } catch {
    return null;
  }
}

/**
 * Formata data completa com hora
 * @param data - String, Date, null ou undefined
 * @returns Data formatada "dd/MM/yyyy HH:mm" ou "-"
 */
export function formatarData(data: DateInput): string {
  try {
    const date = parseDataSegura(data);
    if (!date) return '-';
    
    return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
  } catch {
    return '-';
  }
}

/**
 * Formata apenas a data sem hora
 * @param data - String, Date, null ou undefined
 * @returns Data formatada "dd/MM/yyyy" ou "-"
 */
export function formatarDataCurta(data: DateInput): string {
  try {
    const date = parseDataSegura(data);
    if (!date) return '-';
    
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return '-';
  }
}

/**
 * Formata data de forma relativa (há X minutos/horas/dias)
 * @param data - String, Date, null ou undefined
 * @returns Data relativa "há X minutos" ou "-"
 */
export function formatarDataRelativa(data: DateInput): string {
  try {
    const date = parseDataSegura(data);
    if (!date) return '-';
    
    return formatDistanceToNow(date, { 
      addSuffix: true, 
      locale: ptBR 
    });
  } catch {
    return '-';
  }
}
