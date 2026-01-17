import { describe, it, expect } from 'vitest';
import { formatCNPJ } from '@/lib/cnpj';

describe('formatCNPJ', () => {
  it('deve retornar string vazia para valores nulos ou undefined', () => {
    expect(formatCNPJ(null)).toBe('');
    expect(formatCNPJ(undefined)).toBe('');
  });

  it('deve retornar string vazia para string vazia', () => {
    expect(formatCNPJ('')).toBe('');
  });

  it('deve formatar CNPJ completo corretamente', () => {
    expect(formatCNPJ('12345678000190')).toBe('12.345.678/0001-90');
  });

  it('deve remover caracteres não numéricos antes de formatar', () => {
    expect(formatCNPJ('12.345.678/0001-90')).toBe('12.345.678/0001-90');
    expect(formatCNPJ('12 345 678 0001 90')).toBe('12.345.678/0001-90');
    expect(formatCNPJ('12-345-678-0001-90')).toBe('12.345.678/0001-90');
  });

  it('deve limitar a 14 dígitos', () => {
    expect(formatCNPJ('12345678000190123')).toBe('12.345.678/0001-90');
  });

  it('deve formatar parcialmente números incompletos', () => {
    expect(formatCNPJ('12')).toBe('12');
    expect(formatCNPJ('123')).toBe('12.3');
    expect(formatCNPJ('12345')).toBe('12.345');
    expect(formatCNPJ('12345678')).toBe('12.345.678');
    expect(formatCNPJ('123456780001')).toBe('12.345.678/0001');
  });

  it('deve lidar com CNPJ já formatado', () => {
    expect(formatCNPJ('12.345.678/0001-90')).toBe('12.345.678/0001-90');
  });
});















