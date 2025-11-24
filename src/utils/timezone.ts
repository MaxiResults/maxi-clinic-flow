/**
 * Utilitários de Timezone para Frontend
 * 
 * REGRAS:
 * 1. Backend trabalha SEMPRE em UTC
 * 2. Frontend converte Local ↔ UTC
 * 3. Timezone padrão: America/Sao_Paulo
 */

import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';

export const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

/**
 * Converte data/hora local para UTC (para enviar ao backend)
 * 
 * @param dateString - Data no formato "YYYY-MM-DD"
 * @param timeString - Hora no formato "HH:MM"
 * @param timezone - Timezone (default: America/Sao_Paulo)
 * @returns ISO string em UTC
 * 
 * @example
 * localToUTC("2025-11-28", "08:00")
 * // Returns: "2025-11-28T11:00:00.000Z" (08:00 BRT = 11:00 UTC)
 */
export function localToUTC(
  dateString: string,
  timeString: string,
  timezone: string = DEFAULT_TIMEZONE
): string {
  const dateTimeString = `${dateString} ${timeString}:00`;
  const utcDate = fromZonedTime(dateTimeString, timezone);
  return utcDate.toISOString();
}

/**
 * Formata timestamp UTC para data brasileira
 * 
 * @param isoString - Data em formato ISO UTC
 * @param timezone - Timezone (default: America/Sao_Paulo)
 * @returns Data formatada (dd/MM/yyyy)
 */
export function formatDateBR(
  isoString: string,
  timezone: string = DEFAULT_TIMEZONE
): string {
  if (!isoString) return '';
  
  const date = toZonedTime(new Date(isoString), timezone);
  return format(date, 'dd/MM/yyyy', { locale: ptBR });
}

/**
 * Formata timestamp UTC para hora brasileira
 * 
 * @param isoString - Data em formato ISO UTC
 * @param timezone - Timezone (default: America/Sao_Paulo)
 * @returns Hora formatada (HH:mm)
 */
export function formatTimeBR(
  isoString: string,
  timezone: string = DEFAULT_TIMEZONE
): string {
  if (!isoString) return '';
  
  const date = toZonedTime(new Date(isoString), timezone);
  return format(date, 'HH:mm');
}

/**
 * Formata timestamp UTC para data e hora completa
 * 
 * @param isoString - Data em formato ISO UTC
 * @param timezone - Timezone (default: America/Sao_Paulo)
 * @returns Data e hora formatadas
 */
export function formatDateTimeBR(
  isoString: string,
  timezone: string = DEFAULT_TIMEZONE
): string {
  if (!isoString) return '';
  
  const date = toZonedTime(new Date(isoString), timezone);
  return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

/**
 * Detecta timezone do navegador do usuário
 * 
 * @returns Timezone (ex: "America/Sao_Paulo")
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
