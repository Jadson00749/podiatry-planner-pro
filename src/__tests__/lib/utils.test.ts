import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn (className utility)', () => {
  it('deve combinar classes simples', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('deve mesclar classes do Tailwind corretamente', () => {
    // Quando há conflito, a última classe deve prevalecer
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('deve lidar com valores condicionais', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    expect(cn('foo', true && 'bar')).toBe('foo bar');
  });

  it('deve lidar com arrays', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('deve lidar com objetos', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
  });

  it('deve retornar string vazia quando não há classes', () => {
    expect(cn()).toBe('');
    expect(cn('', null, undefined)).toBe('');
  });

  it('deve combinar múltiplos tipos de entrada', () => {
    expect(cn('foo', ['bar'], { baz: true }, 'qux')).toBe('foo bar baz qux');
  });
});






