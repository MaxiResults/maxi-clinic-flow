import { useMemo } from 'react';
import {
  formatarData,
  formatarDataCurta,
  formatarDataRelativa,
  validarData,
  parseDataSegura,
  type DateInput,
} from '@/utils/date';

/**
 * Tipo de retorno do hook
 */
interface UseFormatDateReturn {
  formatarData: (data: DateInput) => string;
  formatarDataCurta: (data: DateInput) => string;
  formatarDataRelativa: (data: DateInput) => string;
  validarData: (data: DateInput) => boolean;
  parseDataSegura: (data: DateInput) => Date | null;
}

/**
 * Hook customizado para formatação de datas
 * @returns Objeto com todas as funções de formatação
 */
export const useFormatDate = (): UseFormatDateReturn => {
  return useMemo(
    () => ({
      formatarData,
      formatarDataCurta,
      formatarDataRelativa,
      validarData,
      parseDataSegura,
    }),
    []
  );
};
