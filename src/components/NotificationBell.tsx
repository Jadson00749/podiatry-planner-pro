import { Bell, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationRead } from '@/hooks/useNotificationRead';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from 'lucide-react';
import { useState, useCallback, useRef } from 'react';

export function NotificationBell() {
  const { data: notifications, isLoading } = useNotifications();
  const { markAsRead } = useNotificationRead();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  
  // Todos os hooks devem ser chamados antes de qualquer return condicional
  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen);
  }, []);

  const handleNotificationClick = useCallback((notificationId: string) => {
    markAsRead(notificationId);
    setOpen(false);
    navigate('/notificacoes');
  }, [markAsRead, navigate]);

  // Evita renderização durante carregamento ou se não houver dados
  if (isLoading || notifications === undefined) {
    return null;
  }

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="ghost"
          size="icon"
          className="relative text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 z-[100] rounded-2xl" 
        align="end"
        onPointerDownOutside={(e) => {
          // Previne fechamento se clicar no trigger (badge)
          const target = e.target as HTMLElement;
          // Verifica se o clique foi no botão do badge
          if (triggerRef.current && (triggerRef.current.contains(target) || target === triggerRef.current)) {
            e.preventDefault();
          }
        }}
      >
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Notificações</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {unreadCount} {unreadCount === 1 ? 'não lida' : 'não lidas'}
              </span>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          <div className="p-1">
            {!notifications || notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">
                Nenhuma notificação no momento
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => {
                const appointmentDateTime = parseISO(`${notification.appointment_date}T${notification.appointment_time}`);
                const formattedDate = format(appointmentDateTime, "EEEE, dd 'de' MMMM", { locale: ptBR });
                const formattedTime = notification.appointment_time.slice(0, 5);

                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification.id)}
                    className={cn(
                      "block w-full text-left p-4 hover:bg-accent transition-colors cursor-pointer rounded-lg mx-1",
                      !notification.read && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Ícone de status ou indicador de não lida */}
                      {notification.appointment_status === 'completed' ? (
                        <div className="mt-1 flex-shrink-0">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </div>
                      ) : notification.appointment_status === 'cancelled' ? (
                        <div className="mt-1 flex-shrink-0">
                          <XCircle className="h-4 w-4 text-red-500" />
                        </div>
                      ) : notification.appointment_status === 'no_show' ? (
                        <div className="mt-1 flex-shrink-0">
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                        </div>
                      ) : (
                        <div className={cn(
                          "mt-1 h-2 w-2 rounded-full",
                          !notification.read ? "bg-primary" : "bg-muted"
                        )} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {notification.client_name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.hours_before === 0 
                            ? notification.appointment_status === 'completed' 
                              ? 'Consulta concluída'
                              : notification.appointment_status === 'cancelled'
                              ? 'Consulta cancelada'
                              : notification.appointment_status === 'no_show'
                              ? 'Não compareceu'
                              : 'Consulta realizada'
                            : `Consulta em ${notification.hours_before}h`}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span className="capitalize">{formattedDate}</span>
                          <span>às {formattedTime}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          </div>
        </ScrollArea>

        {notifications && notifications.length > 0 && (
          <div className="p-3 border-t border-border">
            <Link
              to="/notificacoes"
              className="block text-center text-sm text-primary hover:underline font-medium"
            >
              Ver todas as notificações
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

