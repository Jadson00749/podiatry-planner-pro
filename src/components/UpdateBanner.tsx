import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, X } from 'lucide-react';

export function UpdateBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let reg: ServiceWorkerRegistration | null = null;

    navigator.serviceWorker.ready.then((registration) => {
      reg = registration;
      setRegistration(registration);

      // Verificar se há atualização disponível
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nova versão disponível
              setShowBanner(true);
            }
          });
        }
      });

      // Verificar atualizações periodicamente
      setInterval(() => {
        registration.update();
      }, 60000); // A cada 1 minuto
    });

    // Verificar atualização imediatamente
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg) {
        reg.update();
      }
    });
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      registration.waiting.addEventListener('statechange', () => {
        if (registration.waiting?.state === 'activated') {
          window.location.reload();
        }
      });
    } else {
      window.location.reload();
    }
  };

  if (!showBanner) return null;

  return (
    <div className="bg-primary text-primary-foreground px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4" />
        <span className="text-sm font-medium">
          Nova versão disponível! Atualize para ver as mudanças.
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={handleUpdate}
          className="h-7"
        >
          Atualizar Agora
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowBanner(false)}
          className="h-7 w-7 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}








