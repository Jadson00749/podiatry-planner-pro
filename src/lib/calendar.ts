import { format } from 'date-fns';
import { isHoliday } from './holidays';

/**
 * Verifica se uma data é anterior ao dia atual
 * @param date - Data a ser verificada
 * @returns true se a data for anterior ao dia atual
 */
export function isPastDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Verifica se uma data é feriado
 * @param date - Data a ser verificada
 * @returns true se a data for um feriado
 */
export function isHolidayDate(date: Date): boolean {
  const dateString = format(date, 'yyyy-MM-dd');
  return !!isHoliday(dateString);
}

/**
 * Verifica se uma data está em um dia de funcionamento
 * @param date - Data a ser verificada
 * @param workingDays - Array de dias da semana (0=Domingo, 1=Segunda, ..., 6=Sábado)
 * @returns true se a data estiver em um dia de funcionamento
 */
export function isWorkingDay(date: Date, workingDays: number[] | null | undefined): boolean {
  if (!workingDays || workingDays.length === 0) return true; // Se não configurado, permite todos os dias
  const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  return workingDays.includes(dayOfWeek);
}

/**
 * Função para usar como disabled no Calendar component
 * Desabilita datas passadas
 */
export function disablePastDates(date: Date): boolean {
  return isPastDate(date);
}

/**
 * Função para desabilitar datas que não são dias de funcionamento
 * @param workingDays - Array de dias da semana (0=Domingo, 1=Segunda, ..., 6=Sábado)
 * @returns Função para usar como disabled no Calendar component
 */
export function disableNonWorkingDays(workingDays: number[] | null | undefined) {
  return (date: Date): boolean => {
    return !isWorkingDay(date, workingDays);
  };
}





