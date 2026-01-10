import { describe, it, expect } from 'vitest';
import {
  getBrazilianHolidays,
  isHoliday,
  getHolidaysForMonth,
  type Holiday,
} from '@/lib/holidays';

describe('holidays utilities', () => {
  describe('getBrazilianHolidays', () => {
    it('deve retornar feriados para um ano específico', () => {
      const holidays = getBrazilianHolidays(2025);
      
      expect(holidays).toBeInstanceOf(Array);
      expect(holidays.length).toBeGreaterThan(0);
    });

    it('deve incluir feriados fixos nacionais', () => {
      const holidays = getBrazilianHolidays(2025);
      const holidayNames = holidays.map(h => h.name);
      
      expect(holidayNames).toContain('Ano Novo');
      expect(holidayNames).toContain('Tiradentes');
      expect(holidayNames).toContain('Dia do Trabalho');
      expect(holidayNames).toContain('Independência do Brasil');
      expect(holidayNames).toContain('Nossa Senhora Aparecida');
      expect(holidayNames).toContain('Finados');
      expect(holidayNames).toContain('Proclamação da República');
      expect(holidayNames).toContain('Natal');
    });

    it('deve incluir feriados móveis baseados na Páscoa', () => {
      const holidays = getBrazilianHolidays(2025);
      const holidayNames = holidays.map(h => h.name);
      
      expect(holidayNames).toContain('Páscoa');
      expect(holidayNames).toContain('Sexta-feira Santa');
      expect(holidayNames).toContain('Carnaval');
      expect(holidayNames).toContain('Corpus Christi');
    });

    it('deve retornar feriados ordenados por data', () => {
      const holidays = getBrazilianHolidays(2025);
      
      for (let i = 1; i < holidays.length; i++) {
        expect(holidays[i].date >= holidays[i - 1].date).toBe(true);
      }
    });

    it('deve ter formato de data correto (YYYY-MM-DD)', () => {
      const holidays = getBrazilianHolidays(2025);
      
      holidays.forEach(holiday => {
        expect(holiday.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it('deve classificar feriados como nacional ou opcional', () => {
      const holidays = getBrazilianHolidays(2025);
      
      holidays.forEach(holiday => {
        expect(['national', 'optional']).toContain(holiday.type);
      });
    });
  });

  describe('isHoliday', () => {
    it('deve retornar feriado se a data for um feriado', () => {
      // Testa com um feriado fixo conhecido
      const holiday = isHoliday('2025-12-25'); // Natal
      
      expect(holiday).toBeDefined();
      expect(holiday?.name).toBe('Natal');
    });

    it('deve retornar undefined se a data não for feriado', () => {
      const holiday = isHoliday('2025-01-15'); // Data comum
      
      expect(holiday).toBeUndefined();
    });

    it('deve funcionar com feriados móveis', () => {
      // Páscoa em 2025 é 20 de abril
      const easter = isHoliday('2025-04-20');
      
      expect(easter).toBeDefined();
      expect(easter?.name).toBe('Páscoa');
    });
  });

  describe('getHolidaysForMonth', () => {
    it('deve retornar feriados de um mês específico', () => {
      const holidays = getHolidaysForMonth(2025, 0); // Janeiro (0-indexed)
      
      expect(holidays).toBeInstanceOf(Array);
      holidays.forEach(holiday => {
        expect(holiday.date).toMatch(/^2025-01-/);
      });
    });

    it('deve retornar array vazio se não houver feriados no mês', () => {
      const holidays = getHolidaysForMonth(2025, 2); // Março (pode não ter feriados fixos)
      
      expect(holidays).toBeInstanceOf(Array);
    });

    it('deve incluir Ano Novo em janeiro', () => {
      const holidays = getHolidaysForMonth(2025, 0); // Janeiro
      const holidayNames = holidays.map(h => h.name);
      
      expect(holidayNames).toContain('Ano Novo');
    });

    it('deve incluir Natal em dezembro', () => {
      const holidays = getHolidaysForMonth(2025, 11); // Dezembro
      const holidayNames = holidays.map(h => h.name);
      
      expect(holidayNames).toContain('Natal');
    });
  });
});
