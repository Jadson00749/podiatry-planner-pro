import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface UseInactivityLogoutOptions {
  enabled: boolean; // Se o logout por inatividade está habilitado
  inactivityTimeout: number; // Tempo em milissegundos (ex: 2 horas = 2 * 60 * 60 * 1000)
  warningTimeout: number; // Tempo do aviso antes de deslogar (ex: 1 minuto = 60 * 1000)
  onLogout?: () => void; // Callback quando logout acontecer
}

export function useInactivityLogout({
  enabled,
  inactivityTimeout = 2 * 60 * 60 * 1000, // 2 horas padrão
  warningTimeout = 60 * 1000, // 1 minuto de aviso
  onLogout,
}: UseInactivityLogoutOptions) {
  const { signOut } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(warningTimeout);
  const lastActivityRef = useRef<number>(Date.now());
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Função para fazer logout
  const handleLogout = async () => {
    // Limpar todos os timers
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    setShowWarning(false);

    // Chamar callback se fornecido
    if (onLogout) {
      onLogout();
    }

    await signOut();
  };

  // Detectar atividade do usuário
  const resetTimer = () => {
    if (!enabled) return;

    lastActivityRef.current = Date.now();
    setShowWarning(false);
    setTimeRemaining(warningTimeout);

    // Limpar timers existentes
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    // Configurar novo timer de inatividade
    inactivityTimerRef.current = setTimeout(() => {
      // Mostrar aviso
      setShowWarning(true);
      setTimeRemaining(warningTimeout);

      // Iniciar countdown
      countdownIntervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1000) {
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);

      // Timer para logout automático
      warningTimerRef.current = setTimeout(() => {
        handleLogout();
      }, warningTimeout);
    }, inactivityTimeout);
  };

  const handleContinue = () => {
    resetTimer();
  };

  useEffect(() => {
    if (!enabled) {
      // Limpar timers se desabilitado
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      setShowWarning(false);
      return;
    }

    // Eventos que indicam atividade
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      resetTimer();
    };

    // Adicionar listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Iniciar timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });

      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, inactivityTimeout, warningTimeout, signOut]);

  // Formatar tempo restante
  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return {
    showWarning,
    timeRemaining: formatTime(timeRemaining),
    handleContinue,
    handleLogout,
  };
}

