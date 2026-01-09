// Service Worker para PWA e Notificações Push
// IMPORTANTE: Incremente a versão quando fizer mudanças significativas
const CACHE_NAME = 'podoagenda-v2'; // ← Mude para v2, v3, etc quando atualizar
const NOTIFICATION_CHECK_INTERVAL = 15 * 60 * 1000; // 15 minutos

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker instalado - Versão:', CACHE_NAME);
  // Força atualização imediata
  self.skipWaiting();
  
  // Limpa caches antigos
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker ativado - Versão:', CACHE_NAME);
  // Força controle imediato de todas as páginas
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Removendo cache antigo na ativação:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

// Interceptar requisições para cache
self.addEventListener('fetch', (event) => {
  // Não fazer cache por enquanto, apenas passar adiante
  event.respondWith(fetch(event.request));
});

// Verificar notificações periodicamente
let notificationCheckInterval;

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'START_NOTIFICATION_CHECK') {
    // Iniciar verificação periódica de notificações
    startNotificationCheck();
  } else if (event.data && event.data.type === 'STOP_NOTIFICATION_CHECK') {
    // Parar verificação
    if (notificationCheckInterval) {
      clearInterval(notificationCheckInterval);
    }
  } else if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    // Mostrar notificação imediatamente
    showNotification(event.data.notification);
  }
});

function startNotificationCheck() {
  // Verificar imediatamente
  checkForNotifications();
  
  // Depois verificar a cada 15 minutos
  notificationCheckInterval = setInterval(() => {
    checkForNotifications();
  }, NOTIFICATION_CHECK_INTERVAL);
}

async function checkForNotifications() {
  try {
    // Enviar mensagem para o cliente (app) verificar notificações
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'CHECK_NOTIFICATIONS'
      });
    });
  } catch (error) {
    console.error('Erro ao verificar notificações:', error);
  }
}

function showNotification(data) {
  const options = {
    body: data.message || data.body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: data.id || 'notification',
    requireInteraction: false,
    data: {
      url: data.url || '/',
      appointmentId: data.appointmentId
    }
  };

  self.registration.showNotification(data.title || 'Nova Notificação', options);
}

// Quando o usuário clica na notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Se já tem uma janela aberta, focar nela
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then(() => {
            // Navegar para a URL se necessário
            if (client.url !== urlToOpen) {
              return client.navigate(urlToOpen);
            }
          });
        }
      }
      // Se não tem janela aberta, abrir nova
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

