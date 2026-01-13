import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Client } from '@/hooks/useClients';
import { Appointment } from '@/hooks/useAppointments';
import { Procedure } from '@/hooks/useProcedures';
import { Profile } from '@/hooks/useProfile';
import { Anamnesis } from '@/hooks/useAnamnesis';

export interface BackupData {
  version: string;
  exportDate: string;
  profile: Profile | null;
  clients: Client[];
  appointments: Appointment[];
  procedures: Procedure[];
  anamnesis: Anamnesis[];
}

/**
 * Exporta todos os dados do sistema para backup
 */
export async function exportBackup(data: {
  profile: Profile | null;
  clients: Client[];
  appointments: Appointment[];
  procedures: Procedure[];
  anamnesis: Anamnesis[];
}): Promise<void> {
  const backup: BackupData = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    profile: data.profile,
    clients: data.clients,
    appointments: data.appointments,
    procedures: data.procedures,
    anamnesis: data.anamnesis,
  };

  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `backup_podoagenda_${format(new Date(), 'dd-MM-yyyy_HH-mm-ss', { locale: ptBR })}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Valida se o arquivo de backup é válido
 */
export function validateBackup(file: File): Promise<{ valid: boolean; data?: BackupData; error?: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as BackupData;

        // Validações básicas
        if (!data.version) {
          resolve({ valid: false, error: 'Arquivo de backup inválido: versão não encontrada' });
          return;
        }

        if (!data.exportDate) {
          resolve({ valid: false, error: 'Arquivo de backup inválido: data de exportação não encontrada' });
          return;
        }

        // Verificar estrutura básica
        if (!Array.isArray(data.clients) || !Array.isArray(data.appointments) || !Array.isArray(data.procedures)) {
          resolve({ valid: false, error: 'Arquivo de backup inválido: estrutura de dados incorreta' });
          return;
        }

        resolve({ valid: true, data });
      } catch (error) {
        resolve({ 
          valid: false, 
          error: error instanceof Error ? error.message : 'Erro ao ler arquivo de backup' 
        });
      }
    };

    reader.onerror = () => {
      resolve({ valid: false, error: 'Erro ao ler arquivo' });
    };

    reader.readAsText(file);
  });
}

/**
 * Estatísticas do backup
 */
export function getBackupStats(backup: BackupData) {
  return {
    exportDate: backup.exportDate,
    clients: backup.clients.length,
    appointments: backup.appointments.length,
    procedures: backup.procedures.length,
    anamnesis: backup.anamnesis.length,
    hasProfile: !!backup.profile,
  };
}






