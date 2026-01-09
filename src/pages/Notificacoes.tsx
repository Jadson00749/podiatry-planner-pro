import { AppLayout } from '@/components/AppLayout';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationRead } from '@/hooks/useNotificationRead';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bell, Calendar, Clock, User, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function Notificacoes() {
  const { data: notifications, isLoading } = useNotifications();
  const { markAsRead } = useNotificationRead();
  const navigate = useNavigate();

  const handleNotificationClick = (notificationId: string, date: string) => {
    markAsRead(notificationId);
    navigate(`/agenda?date=${date}`);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Carregando notificações...</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in max-w-4xl">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
            <Bell className="h-8 w-8 text-primary" />
            Notificações
          </h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe seus agendamentos próximos e lembretes
          </p>
        </div>

        {!notifications || notifications.length === 0 ? (
          <div className="rounded-2xl bg-card border border-border p-12 text-center">
            <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma notificação
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Quando houver agendamentos próximos, você receberá notificações aqui
            </p>
            <Link to="/agenda">
              <Button variant="outline">Ver Agenda</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {notifications.length} {notifications.length === 1 ? 'notificação' : 'notificações'}
              </p>
            </div>

            <div className="space-y-3">
              {notifications.map((notification) => {
                const appointmentDateTime = parseISO(`${notification.appointment_date}T${notification.appointment_time}`);
                const formattedDate = format(appointmentDateTime, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
                const formattedTime = notification.appointment_time.slice(0, 5);

                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification.id, notification.appointment_date)}
                    className={cn(
                      "block w-full text-left rounded-2xl border p-6 transition-all hover:shadow-md cursor-pointer",
                      !notification.read 
                        ? "bg-primary/5 border-primary/20" 
                        : "bg-card border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      {/* Ícone de status ou indicador de não lida */}
                      {notification.appointment_status === 'completed' ? (
                        <div className="mt-1 flex-shrink-0">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        </div>
                      ) : notification.appointment_status === 'cancelled' ? (
                        <div className="mt-1 flex-shrink-0">
                          <XCircle className="h-5 w-5 text-red-500" />
                        </div>
                      ) : notification.appointment_status === 'no_show' ? (
                        <div className="mt-1 flex-shrink-0">
                          <AlertCircle className="h-5 w-5 text-orange-500" />
                        </div>
                      ) : (
                        <div className={cn(
                          "mt-1 h-3 w-3 rounded-full flex-shrink-0",
                          !notification.read ? "bg-primary" : "bg-muted"
                        )} />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <h3 className="font-semibold text-foreground mb-1">
                              {notification.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {notification.message}
                            </p>
                          </div>
                          {!notification.read && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                              Nova
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium text-foreground">{notification.client_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span className="capitalize">{formattedDate}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{formattedTime}</span>
                          </div>
                          {notification.hours_before > 0 && (
                            <div className="flex items-center gap-2">
                              <Bell className="h-4 w-4" />
                              <span>Lembrete {notification.hours_before}h antes</span>
                            </div>
                          )}
                          {notification.appointment_status && (
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "px-2 py-1 text-xs font-medium rounded-full",
                                notification.appointment_status === 'completed' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                                notification.appointment_status === 'cancelled' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                                notification.appointment_status === 'no_show' && "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
                                notification.appointment_status === 'scheduled' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                              )}>
                                {notification.appointment_status === 'completed' && 'Concluída'}
                                {notification.appointment_status === 'cancelled' && 'Cancelada'}
                                {notification.appointment_status === 'no_show' && 'Não Compareceu'}
                                {notification.appointment_status === 'scheduled' && 'Agendada'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

