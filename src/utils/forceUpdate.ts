/**
 * Utilitário para forçar atualização do Service Worker e limpar cache
 * Use quando o app não atualizar no celular
 */

export async function forceServiceWorkerUpdate(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker não suportado');
    return false;
  }

  try {
    // 1. Desregistrar todos os Service Workers
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(reg => reg.unregister()));
    console.log('✅ Service Workers antigos desregistrados');

    // 2. Limpar todos os caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('✅ Caches limpos');
    }

    // 3. Limpar localStorage e sessionStorage (opcional, cuidado!)
    // localStorage.clear();
    // sessionStorage.clear();

    // 4. Recarregar a página
    console.log('🔄 Recarregando página...');
    window.location.reload();

    return true;
  } catch (error) {
    console.error('❌ Erro ao forçar atualização:', error);
    return false;
  }
}

/**
 * Adiciona um botão de "Forçar Atualização" no console para debug
 */
export function addForceUpdateButton() {
  if (typeof window !== 'undefined') {
    (window as any).forceUpdate = forceServiceWorkerUpdate;
    console.log('💡 Digite forceUpdate() no console para forçar atualização');
  }
}

