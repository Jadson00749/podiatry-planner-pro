import { useState, useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useProfile } from '@/hooks/useProfile';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell, X } from 'lucide-react';

export function PushNotificationPrompt() {
  const { isSupported, permission, requestPermission } = usePushNotifications();
  const { data: profile } = useProfile();
  const [showPrompt, setShowPrompt] = useState(false);
  const [hasSeenPrompt, setHasSeenPrompt] = useState(false);

  useEffect(() => {
    // Verificar se já viu o prompt antes
    const seen = localStorage.getItem('push-notification-prompt-seen');
    if (seen === 'true') {
      setHasSeenPrompt(true);
      return;
    }

    // Mostrar prompt se:
    // 1. Notificações são suportadas
    // 2. Permissão ainda não foi concedida ou negada
    // 3. Notificações estão habilitadas no perfil
    // 4. Usuário está logado (tem profile)
    if (
      isSupported &&
      permission === 'default' &&
      profile?.notifications_enabled &&
      profile?.id
    ) {
      // Aguardar um pouco após o login para melhor UX
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000); // 2 segundos após login

      return () => clearTimeout(timer);
    }
  }, [isSupported, permission, profile?.notifications_enabled, profile?.id]);

  const handleAllow = async () => {
    const granted = await requestPermission();
    if (granted) {
      localStorage.setItem('push-notification-prompt-seen', 'true');
      setShowPrompt(false);
      setHasSeenPrompt(true);
    } else {
      // Se negou, marcar como visto para não mostrar novamente
      localStorage.setItem('push-notification-prompt-seen', 'true');
      setShowPrompt(false);
      setHasSeenPrompt(true);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('push-notification-prompt-seen', 'true');
    setShowPrompt(false);
    setHasSeenPrompt(true);
  };

  // Não mostrar se já viu ou se não atende aos critérios
  if (!showPrompt || hasSeenPrompt || permission !== 'default') {
    return null;
  }

  return (
    <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4">
            <Bell className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">
            Ativar Notificações Push?
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            Receba notificações na barra do celular sobre agendamentos próximos, 
            mesmo com o app fechado. Você não perderá nenhum lembrete importante!
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-6">
          <Button
            onClick={handleAllow}
            className="w-full"
            size="lg"
          >
            <Bell className="h-4 w-4 mr-2" />
            Ativar Notificações
          </Button>
          <Button
            onClick={handleDismiss}
            variant="ghost"
            className="w-full"
          >
            Agora não
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          Você pode ativar depois nas Configurações
        </p>
      </DialogContent>
    </Dialog>
  );
}






