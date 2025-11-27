import { useFormatDate } from '@/hooks/useFormatDate';
import { type DateInput } from '@/utils/date';

/**
 * Formatos disponíveis para exibição de data
 */
export type DateFormatType = 'full' | 'short' | 'relative';

/**
 * Props do componente FormattedDate
 */
interface FormattedDateProps {
  /** Valor da data a ser formatada */
  value: DateInput;
  /** Formato de exibição (default: 'full') */
  format?: DateFormatType;
  /** Texto exibido quando data é inválida (default: '-') */
  fallback?: string;
  /** Classes CSS adicionais */
  className?: string;
}

/**
 * Componente para renderizar datas formatadas de forma segura
 * 
 * @example
 * ```tsx
 * <FormattedDate value={lead.created_at} format="short" />
 * <FormattedDate value={mensagem.timestamp} format="relative" />
 * <FormattedDate value={agendamento.data} format="full" fallback="Sem data" />
 * ```
 */
export function FormattedDate({
  value,
  format = 'full',
  fallback = '-',
  className,
}: FormattedDateProps) {
  const { formatarData, formatarDataCurta, formatarDataRelativa, validarData } = useFormatDate();

  // Se valor inválido, retorna fallback
  if (!validarData(value)) {
    return <span className={className}>{fallback}</span>;
  }

  // Seleciona formato baseado na prop
  let formattedValue: string;
  
  switch (format) {
    case 'short':
      formattedValue = formatarDataCurta(value);
      break;
    case 'relative':
      formattedValue = formatarDataRelativa(value);
      break;
    case 'full':
    default:
      formattedValue = formatarData(value);
      break;
  }

  return <span className={className}>{formattedValue}</span>;
}
