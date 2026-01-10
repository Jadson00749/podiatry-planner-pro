import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isPastDate,
  isHolidayDate,
  isWorkingDay,
  disablePastDates,
  disableNonWorkingDays,
} from '@/lib/calendar';

describe('calendar utilities', () => {
  beforeEach(() => {
    // Mock da data atual para testes consistentes
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('isPastDate', () => {
    it('deve retornar true para datas passadas', () => {
      const pastDate = new Date('2025-01-10T00:00:00');
      expect(isPastDate(pastDate)).toBe(true);
    });

    it('deve retornar false para data atual', () => {
      const today = new Date('2025-01-15T12:00:00');
      expect(isPastDate(today)).toBe(false);
    });

    it('deve retornar false para datas futuras', () => {
      const futureDate = new Date('2025-01-20T00:00:00');
      expect(isPastDate(futureDate)).toBe(false);
    });
  });

  describe('isHolidayDate', () => {
    it('deve retornar true para feriados', () => {
      // Natal - 25 de dezembro de 2025
      const holiday = new Date(2025, 11, 25); // mês 11 = dezembro (0-indexed)
      expect(isHolidayDate(holiday)).toBe(true);
    });

    it('deve retornar false para datas comuns', () => {
      const normalDate = new Date('2025-01-15');
      expect(isHolidayDate(normalDate)).toBe(false);
    });
  });

  describe('isWorkingDay', () => {
    it('deve retornar true se não houver configuração de dias de trabalho', () => {
      const date = new Date('2025-01-15T12:00:00');
      expect(isWorkingDay(date, null)).toBe(true);
      expect(isWorkingDay(date, undefined)).toBe(true);
      expect(isWorkingDay(date, [])).toBe(true);
    });

    it('deve retornar true se a data estiver nos dias de trabalho', () => {
      // 13 de janeiro de 2025 é uma segunda-feira (dia 1)
      const monday = new Date('2025-01-13T12:00:00');
      expect(isWorkingDay(monday, [1, 2, 3, 4, 5])).toBe(true);
    });

    it('deve retornar false se a data não estiver nos dias de trabalho', () => {
      // 12 de janeiro de 2025 é um domingo (dia 0)
      const sunday = new Date('2025-01-12T12:00:00');
      expect(isWorkingDay(sunday, [1, 2, 3, 4, 5])).toBe(false);
    });

    it('deve funcionar com diferentes dias da semana', () => {
      // 11 de janeiro de 2025 é um sábado (dia 6)
      const saturday = new Date('2025-01-11T12:00:00');
      expect(isWorkingDay(saturday, [6])).toBe(true);
      expect(isWorkingDay(saturday, [1, 2, 3, 4, 5])).toBe(false);
    });
  });

  describe('disablePastDates', () => {
    it('deve desabilitar datas passadas', () => {
      const pastDate = new Date('2025-01-10T00:00:00');
      expect(disablePastDates(pastDate)).toBe(true);
    });

    it('não deve desabilitar data atual', () => {
      const today = new Date('2025-01-15T12:00:00');
      expect(disablePastDates(today)).toBe(false);
    });

    it('não deve desabilitar datas futuras', () => {
      const futureDate = new Date('2025-01-20T00:00:00');
      expect(disablePastDates(futureDate)).toBe(false);
    });
  });

  describe('disableNonWorkingDays', () => {
    it('deve retornar função que desabilita dias não trabalhados', () => {
      const disableFn = disableNonWorkingDays([1, 2, 3, 4, 5]); // Segunda a Sexta
      
      const monday = new Date('2025-01-13T12:00:00'); // Segunda-feira
      const sunday = new Date('2025-01-12T12:00:00'); // Domingo
      
      expect(disableFn(monday)).toBe(false); // Não desabilita segunda
      expect(disableFn(sunday)).toBe(true); // Desabilita domingo
    });

    it('deve permitir todos os dias se não houver configuração', () => {
      const disableFn = disableNonWorkingDays(null);
      const anyDay = new Date('2025-01-15T12:00:00');
      
      expect(disableFn(anyDay)).toBe(false);
    });
  });
});
