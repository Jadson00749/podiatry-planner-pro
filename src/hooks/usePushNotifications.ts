import { useState, useEffect, useCallback, useRef } from 'react';
import { useNotifications } from './useNotifications';
import { useProfile } from './useProfile';

type NotificationPermissionType = 'default' | 'granted' | 'denied';

interface NotificationPermission {
  permission: NotificationPermissionType;
  isSupported: boolean;
  isSubscribed: boolean;
}

export function usePushNotifications() {
  const [notificationState, setNotificationState] = useState<NotificationPermission>({
    permission: 'default',
    isSupported: false,
    isSubscribed: false,
  });
  const { data: notifications } = useNotifications();
  const { data: profile } = useProfile();
  const serviceWorkerRegistration = useRef<ServiceWorkerRegistration | null>(null);
  const lastNotificationIds = useRef<Set<string>>(new Set());
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Verificar suporte e permissão
  useEffect(() => {
    const hasNotification = 'Notification' in window;
    const hasServiceWorker = 'serviceWorker' in navigator;
    const isSupported = hasNotification && hasServiceWorker;
    
    // Logs removidos para produção
    if (isSupported) {
      setNotificationState(prev => ({
        ...prev,
        isSupported: true,
        permission: Notification.permission,
      }));
    }
  }, []);

  // Registrar Service Worker com forçar atualização
  useEffect(() => {
    if ('serviceWorker' in navigator && notificationState.isSupported) {
      // PRIMEIRO: Desregistrar todos os Service Workers antigos
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
        });
        
        // Depois de desregistrar, aguardar um pouco e registrar o novo
        setTimeout(() => {
          // Forçar atualização do Service Worker com timestamp para evitar cache
          const swUrl = `/sw.js?v=${Date.now()}`;
          
          navigator.serviceWorker
            .register('/sw.js', { 
              updateViaCache: 'none', // ← Força sempre buscar nova versão
              scope: '/' 
            })
            .then((registration) => {
              serviceWorkerRegistration.current = registration;
              setNotificationState(prev => ({ ...prev, isSubscribed: true }));
              
              // Forçar atualização imediata
              registration.update();
              
              // Verificar se há nova versão e atualizar
              registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (newWorker) {
                  newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed') {
                      if (navigator.serviceWorker.controller) {
                        // Nova versão disponível, forçar atualização
                        newWorker.postMessage({ type: 'SKIP_WAITING' });
                        // Recarregar após 1 segundo
                        setTimeout(() => {
                          window.location.reload();
                        }, 1000);
                      }
                    }
                  });
                }
              });
              
              // Verificar atualizações a cada 30 segundos
              setInterval(() => {
                registration.update();
              }, 30000);
              
              // Iniciar verificação periódica
              if (registration.active) {
                registration.active.postMessage({ type: 'START_NOTIFICATION_CHECK' });
              } else if (registration.installing) {
                registration.installing.addEventListener('statechange', () => {
                  if (registration.installing?.state === 'activated') {
                    registration.installing.postMessage({ type: 'START_NOTIFICATION_CHECK' });
                  }
                });
              }
            })
            .catch((error) => {
              console.error('Erro ao registrar Service Worker:', error);
            });
        }, 500); // Aguardar 500ms antes de registrar o novo
      });
    }

    return () => {
      // Limpar intervalo ao desmontar
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [notificationState.isSupported]);

  // Verificar novas notificações e mostrar push
  useEffect(() => {
    if (
      !notificationState.isSupported ||
      notificationState.permission !== 'granted' ||
      !notifications ||
      !profile?.notifications_enabled
    ) {
      return;
    }

    // Verificar novas notificações não lidas
    const unreadNotifications = notifications.filter(n => !n.read);
    
    unreadNotifications.forEach((notification) => {
      // Se já mostramos esta notificação, pular
      if (lastNotificationIds.current.has(notification.id)) {
        return;
      }

      // Adicionar ao conjunto de notificações já mostradas
      lastNotificationIds.current.add(notification.id);

      // Mostrar notificação push
      showPushNotification({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        url: `/agenda?date=${notification.appointment_date}`,
        appointmentId: notification.appointment_id,
      });
    });

    // Limpar notificações antigas do conjunto (mais de 1 hora)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    // Manter apenas as últimas 50 notificações
    if (lastNotificationIds.current.size > 50) {
      const idsArray = Array.from(lastNotificationIds.current);
      lastNotificationIds.current = new Set(idsArray.slice(-50));
    }
  }, [notifications, notificationState, profile?.notifications_enabled]);

  // Verificação periódica quando o app está aberto (a cada 5 minutos)
  useEffect(() => {
    if (
      !notificationState.isSupported ||
      notificationState.permission !== 'granted' ||
      !profile?.notifications_enabled
    ) {
      return;
    }

    // Verificar a cada 5 minutos quando o app está aberto
    checkIntervalRef.current = setInterval(() => {
      // O Service Worker já verifica a cada 15 minutos
      // Esta verificação é adicional quando o app está aberto
      if (notifications) {
        const unreadNotifications = notifications.filter(n => !n.read);
        unreadNotifications.forEach((notification) => {
          if (!lastNotificationIds.current.has(notification.id)) {
            lastNotificationIds.current.add(notification.id);
            showPushNotification({
              id: notification.id,
              title: notification.title,
              message: notification.message,
              url: `/agenda?date=${notification.appointment_date}`,
              appointmentId: notification.appointment_id,
            });
          }
        });
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [notifications, notificationState, profile?.notifications_enabled]);

  const showPushNotification = useCallback((data: {
    id: string;
    title: string;
    message: string;
    url?: string;
    appointmentId?: string;
  }) => {
    if (!serviceWorkerRegistration.current) {
      // Fallback: usar Notification API diretamente
      if (Notification.permission === 'granted') {
        new Notification(data.title, {
          body: data.message,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          tag: data.id,
          data: {
            url: data.url || '/',
            appointmentId: data.appointmentId,
          },
        });
      }
      return;
    }

    // Enviar para Service Worker mostrar
    if (serviceWorkerRegistration.current.active) {
      serviceWorkerRegistration.current.active.postMessage({
        type: 'SHOW_NOTIFICATION',
        notification: data,
      });
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!notificationState.isSupported) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationState(prev => ({
        ...prev,
        permission,
        isSubscribed: permission === 'granted',
      }));

      return permission === 'granted';
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      return false;
    }
  }, [notificationState.isSupported]);

  // Função para testar notificação manualmente (útil para debug)
  const testNotification = useCallback(() => {
    if (notificationState.permission !== 'granted') {
      return false;
    }

    showPushNotification({
      id: 'test-' + Date.now(),
      title: 'Teste de Notificação',
      message: 'Esta é uma notificação de teste. Se você está vendo isso, as notificações push estão funcionando!',
      url: '/dashboard',
    });

    return true;
  }, [notificationState.permission, showPushNotification]);

  return {
    ...notificationState,
    requestPermission,
    testNotification,
  };
}

