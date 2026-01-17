import { describe, it, expect } from 'vitest';
import { formatPhone } from '@/lib/phone';

describe('formatPhone', () => {
  it('deve retornar string vazia para valores nulos ou undefined', () => {
    expect(formatPhone(null)).toBe('');
    expect(formatPhone(undefined)).toBe('');
  });

  it('deve retornar string vazia para string vazia', () => {
    expect(formatPhone('')).toBe('');
  });

  it('deve formatar telefone fixo corretamente', () => {
    expect(formatPhone('1133334444')).toBe('(11) 3333-4444');
    expect(formatPhone('1133334444')).toBe('(11) 3333-4444');
  });

  it('deve formatar celular corretamente', () => {
    expect(formatPhone('11987654321')).toBe('(11) 98765-4321');
    expect(formatPhone('11987654321')).toBe('(11) 98765-4321');
  });

  it('deve remover caracteres não numéricos antes de formatar', () => {
    expect(formatPhone('(11) 98765-4321')).toBe('(11) 98765-4321');
    expect(formatPhone('11 98765 4321')).toBe('(11) 98765-4321');
    expect(formatPhone('11.98765.4321')).toBe('(11) 98765-4321');
  });

  it('deve limitar a 11 dígitos', () => {
    expect(formatPhone('11987654321123')).toBe('(11) 98765-4321');
  });

  it('deve formatar parcialmente números incompletos', () => {
    expect(formatPhone('11')).toBe('11');
    expect(formatPhone('119')).toBe('(11) 9');
    expect(formatPhone('11987')).toBe('(11) 987');
    expect(formatPhone('1198765')).toBe('(11) 98765');
  });

  it('deve lidar com números já formatados', () => {
    expect(formatPhone('(11) 98765-4321')).toBe('(11) 98765-4321');
    expect(formatPhone('(11) 3333-4444')).toBe('(11) 3333-4444');
  });
});















