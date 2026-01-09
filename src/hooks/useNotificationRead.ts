import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useProfile } from './useProfile';

const STORAGE_KEY_PREFIX = 'read_notifications_';

/**
 * Função utilitária para obter a chave de armazenamento
 */
function getStorageKey(profileId: string | undefined): string | null {
  return profileId ? `${STORAGE_KEY_PREFIX}${profileId}` : null;
}

/**
 * Função utilitária para obter notificações lidas do localStorage
 * Pode ser usada dentro de queryFn sem depender de hooks
 */
export function getReadNotifications(profileId: string | undefined): string[] {
  const storageKey = getStorageKey(profileId);
  if (!storageKey) return [];

  try {
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Erro ao ler notificações lidas:', error);
    return [];
  }
}

/**
 * Função utilitária para verificar se uma notificação foi lida
 * Pode ser usada dentro de queryFn sem depender de hooks
 */
export function isNotificationRead(notificationId: string, profileId: string | undefined): boolean {
  const readNotifications = getReadNotifications(profileId);
  return readNotifications.includes(notificationId);
}

/**
 * Limpa notificações de agendamentos que já passaram
 * Isso evita acúmulo de dados desnecessários no localStorage
 * 
 * @param activeNotificationIds - IDs das notificações ativas (agendamentos futuros)
 * @param profileId - ID do perfil do usuário
 */
export function cleanupOldNotifications(activeNotificationIds: string[], profileId: string | undefined): void {
  const storageKey = getStorageKey(profileId);
  if (!storageKey) return;

  try {
    const readNotifications = getReadNotifications(profileId);
    
    // Remove apenas as notificações que não estão mais ativas
    // Mantém as que ainda são relevantes (agendamentos futuros)
    const cleanedNotifications = readNotifications.filter(id => 
      activeNotificationIds.includes(id)
    );

    // Só atualiza se houve mudança
    if (cleanedNotifications.length !== readNotifications.length) {
      localStorage.setItem(storageKey, JSON.stringify(cleanedNotifications));
    }
  } catch (error) {
    console.error('Erro ao limpar notificações antigas:', error);
  }
}

/**
 * Hook para gerenciar o estado de leitura das notificações
 */
export function useNotificationRead() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  /**
   * Marca uma notificação como lida
   */
  const markAsRead = useCallback((notificationId: string) => {
    const storageKey = getStorageKey(profile?.id);
    if (!storageKey) return;

    try {
      const readNotifications = getReadNotifications(profile?.id);
      if (!readNotifications.includes(notificationId)) {
        readNotifications.push(notificationId);
        localStorage.setItem(storageKey, JSON.stringify(readNotifications));
        // Invalida a query de notificações para atualizar a UI
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  }, [profile?.id, queryClient]);

  /**
   * Marca múltiplas notificações como lidas
   */
  const markMultipleAsRead = useCallback((notificationIds: string[]) => {
    const storageKey = getStorageKey(profile?.id);
    if (!storageKey) return;

    try {
      const readNotifications = getReadNotifications(profile?.id);
      let updated = false;

      notificationIds.forEach(id => {
        if (!readNotifications.includes(id)) {
          readNotifications.push(id);
          updated = true;
        }
      });

      if (updated) {
        localStorage.setItem(storageKey, JSON.stringify(readNotifications));
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
    } catch (error) {
      console.error('Erro ao marcar notificações como lidas:', error);
    }
  }, [profile?.id, queryClient]);

  /**
   * Verifica se uma notificação foi lida
   */
  const isRead = useCallback((notificationId: string): boolean => {
    return isNotificationRead(notificationId, profile?.id);
  }, [profile?.id]);

  /**
   * Limpa todas as notificações lidas (útil para testes ou reset)
   */
  const clearReadNotifications = useCallback(() => {
    const storageKey = getStorageKey(profile?.id);
    if (!storageKey) return;

    try {
      localStorage.removeItem(storageKey);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (error) {
      console.error('Erro ao limpar notificações lidas:', error);
    }
  }, [profile?.id, queryClient]);

  return {
    markAsRead,
    markMultipleAsRead,
    isRead,
    clearReadNotifications,
  };
}

