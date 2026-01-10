import { describe, it, expect } from 'vitest';
import {
  formatPhoneForWhatsApp,
  generateWhatsAppLink,
  generateAppointmentReminderMessage,
  generateAppointmentConfirmationMessage,
} from '@/lib/whatsapp';

describe('WhatsApp utilities', () => {
  describe('formatPhoneForWhatsApp', () => {
    it('deve adicionar código do país 55 se não começar com 55', () => {
      expect(formatPhoneForWhatsApp('11987654321')).toBe('5511987654321');
      expect(formatPhoneForWhatsApp('11987654321')).toBe('5511987654321');
    });

    it('deve manter código do país se já começar com 55', () => {
      expect(formatPhoneForWhatsApp('5511987654321')).toBe('5511987654321');
    });

    it('deve remover caracteres não numéricos', () => {
      expect(formatPhoneForWhatsApp('(11) 98765-4321')).toBe('5511987654321');
      expect(formatPhoneForWhatsApp('11 98765 4321')).toBe('5511987654321');
    });
  });

  describe('generateWhatsAppLink', () => {
    it('deve gerar link do WhatsApp corretamente', () => {
      const link = generateWhatsAppLink('11987654321', 'Olá!');
      expect(link).toContain('wa.me/5511987654321');
      expect(link).toContain('text=');
      expect(decodeURIComponent(link.split('text=')[1])).toBe('Olá!');
    });

    it('deve codificar mensagem corretamente', () => {
      const link = generateWhatsAppLink('11987654321', 'Mensagem com espaços');
      expect(link).toContain('text=');
      expect(decodeURIComponent(link.split('text=')[1])).toBe('Mensagem com espaços');
    });
  });

  describe('generateAppointmentReminderMessage', () => {
    it('deve gerar mensagem de lembrete corretamente', () => {
      const message = generateAppointmentReminderMessage(
        'João Silva',
        '2025-01-15',
        '14:30:00',
        'Clínica Podológica'
      );

      expect(message).toContain('João Silva');
      expect(message).toContain('14:30');
      expect(message).toContain('Clínica Podológica');
      expect(message).toContain('lembrete');
      expect(message).toContain('confirme sua presença');
    });

    it('deve funcionar sem nome da clínica', () => {
      const message = generateAppointmentReminderMessage(
        'João Silva',
        '2025-01-15',
        '14:30'
      );

      expect(message).toContain('João Silva');
      expect(message).not.toContain('Local:');
    });

    it('deve formatar data corretamente', () => {
      const message = generateAppointmentReminderMessage(
        'João',
        '2025-01-15',
        '14:30'
      );

      expect(message).toContain('2025');
      expect(message).toContain('janeiro');
    });
  });

  describe('generateAppointmentConfirmationMessage', () => {
    it('deve gerar mensagem de confirmação corretamente', () => {
      const message = generateAppointmentConfirmationMessage(
        'Maria Santos',
        '2025-01-20',
        '10:00',
        'Clínica Podológica'
      );

      expect(message).toContain('Maria Santos');
      expect(message).toContain('10:00');
      expect(message).toContain('Clínica Podológica');
      expect(message).toContain('confirmado');
      expect(message).toContain('✅');
    });

    it('deve funcionar sem nome da clínica', () => {
      const message = generateAppointmentConfirmationMessage(
        'Maria Santos',
        '2025-01-20',
        '10:00'
      );

      expect(message).toContain('Maria Santos');
      expect(message).not.toContain('Local:');
    });
  });
});
