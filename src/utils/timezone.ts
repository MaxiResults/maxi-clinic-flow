/**
 * Utilitários de Timezone para Frontend
 * 
 * REGRAS:
 * 1. Backend trabalha SEMPRE em UTC
 * 2. Frontend converte Local ↔ UTC
 * 3. Timezone padrão: America/Sao_Paulo (UTC-3)
 */

export const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

/**
 * Converte data/hora local (BRT) para UTC (para enviar ao backend)
 * 
 * @param dateString - Data no formato "YYYY-MM-DD"
 * @param timeString - Hora no formato "HH:MM"
 * @returns ISO string em UTC
 * 
 * @example
 * localToUTC("2025-11-28", "08:00")
 * // Returns: "2025-11-28T11:00:00.000Z" (08:00 BRT = 11:00 UTC)
 */
export function localToUTC(
  dateString: string,
  timeString: string
): string {
  // Cria string no formato ISO local e converte para UTC
  const localDateTime = `${dateString}T${timeString}:00`;
  
  // Parse como horário local do navegador (que deve estar em America/Sao_Paulo)
  const date = new Date(localDateTime);
  
  // Retorna em UTC
  return date.toISOString();
}

/**
 * Formata timestamp UTC para data brasileira
 * 
 * @param isoString - Data em formato ISO UTC
 * @returns Data formatada (dd/MM/yyyy)
 */
export function formatDateBR(isoString: string): string {
  if (!isoString) return '';
  
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  
  return date.toLocaleDateString('pt-BR', {
    timeZone: DEFAULT_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Formata timestamp UTC para hora brasileira
 * 
 * @param isoString - Data em formato ISO UTC
 * @returns Hora formatada (HH:mm)
 */
export function formatTimeBR(isoString: string): string {
  if (!isoString) return '';
  
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  
  return date.toLocaleTimeString('pt-BR', {
    timeZone: DEFAULT_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Formata timestamp UTC para data e hora completa
 * 
 * @param isoString - Data em formato ISO UTC
 * @returns Data e hora formatadas (dd/MM/yyyy às HH:mm)
 */
export function formatDateTimeBR(isoString: string): string {
  if (!isoString) return '';
  
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  
  const datePart = date.toLocaleDateString('pt-BR', {
    timeZone: DEFAULT_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  const timePart = date.toLocaleTimeString('pt-BR', {
    timeZone: DEFAULT_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return `${datePart} às ${timePart}`;
}

/**
 * Converte UTC para Date local (para edição)
 * 
 * @param isoString - Data em formato ISO UTC
 * @returns Date object no timezone local
 */
export function utcToLocalDate(isoString: string): Date {
  return new Date(isoString);
}

/**
 * Extrai horário local (HH:mm) de um timestamp UTC
 * 
 * @param isoString - Data em formato ISO UTC
 * @returns String no formato "HH:mm"
 */
export function extractLocalTime(isoString: string): string {
  if (!isoString) return '';
  
  const date = new Date(isoString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Detecta timezone do navegador do usuário
 * 
 * @returns Timezone (ex: "America/Sao_Paulo")
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
