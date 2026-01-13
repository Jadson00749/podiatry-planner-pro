/**
 * Utilitário para debug de versão e cache
 * Mostra informações sobre qual versão está rodando
 */

export function getAppVersion(): string {
  // Versão baseada na data/hora do build
  // Isso muda a cada build, forçando atualização
  return import.meta.env.VITE_APP_VERSION || '1.0.0';
}

export function logAppInfo() {
  // Função desabilitada - removido console.log para produção
  // Para ativar novamente, descomente as linhas abaixo
  if (typeof window === 'undefined') return;

  // console.log('🔍 INFORMAÇÕES DO APP:');
  // console.log('📱 User Agent:', navigator.userAgent);
  // console.log('🌐 URL:', window.location.href);
  // console.log('📦 Versão:', getAppVersion());
  // console.log('💾 Service Worker suportado:', 'serviceWorker' in navigator);
  
  // if ('serviceWorker' in navigator) {
  //   navigator.serviceWorker.getRegistrations().then((registrations) => {
  //     console.log('🔧 Service Workers registrados:', registrations.length);
  //     registrations.forEach((reg, index) => {
  //       console.log(`  SW ${index + 1}:`, {
  //         scope: reg.scope,
  //         active: reg.active?.scriptURL,
  //         installing: reg.installing?.scriptURL,
  //         waiting: reg.waiting?.scriptURL,
  //       });
  //     });
  //   });

  //   if (navigator.serviceWorker.controller) {
  //     console.log('🎮 Service Worker ativo:', navigator.serviceWorker.controller.scriptURL);
  //   } else {
  //     console.log('⚠️ Nenhum Service Worker ativo');
  //   }
  // }

  // // Verificar se os arquivos estão sendo servidos corretamente
  // fetch('/sw.js', { cache: 'no-store' })
  //   .then(res => {
  //     console.log('📄 sw.js status:', res.status, res.statusText);
  //     return res.text();
  //   })
  //   .then(text => {
  //     const versionMatch = text.match(/CACHE_NAME = ['"]([^'"]+)['"]/);
  //     if (versionMatch) {
  //       console.log('📌 Versão do SW:', versionMatch[1]);
  //     }
  //   })
  //   .catch(err => {
  //     console.error('❌ Erro ao buscar sw.js:', err);
  //   });

  // fetch('/manifest.json', { cache: 'no-store' })
  //   .then(res => {
  //     console.log('📄 manifest.json status:', res.status, res.statusText);
  //   })
  //   .catch(err => {
  //     console.error('❌ Erro ao buscar manifest.json:', err);
  //   });
}

// Adicionar ao window para acesso fácil (sem console.log)
if (typeof window !== 'undefined') {
  (window as any).debugApp = logAppInfo;
  // console.log removido
}








