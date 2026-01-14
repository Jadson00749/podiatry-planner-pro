import { describe, it, expect } from 'vitest';
import { validateBackup, getBackupStats, type BackupData } from '@/utils/backup';

describe('backup utilities', () => {
  const mockBackupData: BackupData = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    profile: null,
    clients: [
      { id: '1', name: 'Cliente 1', phone: '11999999999', profile_id: 'user1' } as any,
    ],
    appointments: [
      { id: '1', client_id: '1', appointment_date: '2025-01-15', profile_id: 'user1' } as any,
    ],
    procedures: [
      { id: '1', name: 'Procedimento 1', profile_id: 'user1' } as any,
    ],
    anamnesis: [],
  };

  describe('validateBackup', () => {
    it('deve validar backup válido', async () => {
      const jsonString = JSON.stringify(mockBackupData);
      const file = new File([jsonString], 'backup.json', { type: 'application/json' });
      
      const result = await validateBackup(file);
      
      expect(result.valid).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.version).toBe('1.0.0');
    });

    it('deve rejeitar arquivo sem versão', async () => {
      const invalidData = { ...mockBackupData };
      delete (invalidData as any).version;
      const jsonString = JSON.stringify(invalidData);
      const file = new File([jsonString], 'backup.json', { type: 'application/json' });
      
      const result = await validateBackup(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('versão não encontrada');
    });

    it('deve rejeitar arquivo sem data de exportação', async () => {
      const invalidData = { ...mockBackupData };
      delete (invalidData as any).exportDate;
      const jsonString = JSON.stringify(invalidData);
      const file = new File([jsonString], 'backup.json', { type: 'application/json' });
      
      const result = await validateBackup(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('data de exportação não encontrada');
    });

    it('deve rejeitar arquivo com estrutura incorreta', async () => {
      const invalidData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        clients: 'not an array',
        appointments: [],
        procedures: [],
      };
      const jsonString = JSON.stringify(invalidData);
      const file = new File([jsonString], 'backup.json', { type: 'application/json' });
      
      const result = await validateBackup(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('estrutura de dados incorreta');
    });

    it('deve rejeitar arquivo JSON inválido', async () => {
      const file = new File(['invalid json'], 'backup.json', { type: 'application/json' });
      
      const result = await validateBackup(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getBackupStats', () => {
    it('deve retornar estatísticas corretas', () => {
      const stats = getBackupStats(mockBackupData);
      
      expect(stats.clients).toBe(1);
      expect(stats.appointments).toBe(1);
      expect(stats.procedures).toBe(1);
      expect(stats.anamnesis).toBe(0);
      expect(stats.hasProfile).toBe(false);
      expect(stats.exportDate).toBe(mockBackupData.exportDate);
    });

    it('deve detectar quando há perfil', () => {
      const backupWithProfile = {
        ...mockBackupData,
        profile: { id: 'user1', full_name: 'Test User' } as any,
      };
      
      const stats = getBackupStats(backupWithProfile);
      
      expect(stats.hasProfile).toBe(true);
    });
  });
});






