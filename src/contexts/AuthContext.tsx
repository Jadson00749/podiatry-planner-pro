import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface LoginAttemptInfo {
  isBlocked: boolean;
  blockedUntil: string | null;
  attemptsRemaining: number;
  failedAttempts: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ 
    error: Error | null; 
    attemptInfo?: LoginAttemptInfo;
  }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  checkLoginBlocked: (email: string) => Promise<LoginAttemptInfo | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Função helper para registrar acesso do usuário
async function logUserAccess(userId: string, email: string) {
  try {
    // Obter User Agent do navegador
    const userAgent = navigator.userAgent || null;

    // Chamar função RPC do Supabase para registrar acesso
    // @ts-ignore - função RPC não está nos tipos gerados
    const { error } = await supabase.rpc('log_user_access', {
      p_user_id: userId,
      p_email: email,
      p_ip_address: null, // IP não disponível no frontend
      p_user_agent: userAgent,
    });

    if (error) {
      console.error('Erro ao registrar acesso:', error);
      // Não bloquear o login se falhar o registro
    }
  } catch (error) {
    console.error('Erro ao registrar acesso:', error);
    // Não bloquear o login se falhar o registro
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkLoginBlocked = async (email: string): Promise<LoginAttemptInfo | null> => {
    try {
      // @ts-ignore - função RPC não está nos tipos gerados
      const { data, error } = await supabase.rpc('check_login_blocked', {
        p_email: email.toLowerCase(),
      });

      if (error) {
        console.error('Erro ao verificar bloqueio:', error);
        return null;
      }

      if (data && Array.isArray(data) && (data as any[]).length > 0) {
        const result = (data as any[])[0] as any;
        return {
          isBlocked: result.is_blocked,
          blockedUntil: result.blocked_until,
          attemptsRemaining: result.attempts_remaining,
          failedAttempts: result.failed_attempts,
        };
      }

      return null;
    } catch (error) {
      console.error('Erro ao verificar bloqueio:', error);
      return null;
    }
  };

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = email.toLowerCase();
    const userAgent = navigator.userAgent || null;

    // Verificar se está bloqueado antes de tentar login
    const blockedInfo = await checkLoginBlocked(normalizedEmail);
    
    if (blockedInfo?.isBlocked) {
      return {
        error: new Error('BLOCKED') as Error,
        attemptInfo: blockedInfo,
      };
    }

    // Tentar fazer login
    const { error } = await supabase.auth.signInWithPassword({ 
      email: normalizedEmail, 
      password 
    });

    // Se login falhou, registrar tentativa falha
    if (error) {
      try {
        // @ts-ignore - função RPC não está nos tipos gerados
        const { data: attemptData, error: recordError } = await supabase.rpc('record_failed_login', {
          p_email: normalizedEmail,
          p_ip_address: null, // IP não disponível no frontend
          p_user_agent: userAgent,
        });

        if (!recordError && attemptData && Array.isArray(attemptData) && (attemptData as any[]).length > 0) {
          const result = (attemptData as any[])[0] as any;
          const attemptInfo: LoginAttemptInfo = {
            isBlocked: result.is_blocked,
            blockedUntil: result.blocked_until,
            attemptsRemaining: result.attempts_remaining,
            failedAttempts: result.failed_attempts,
          };

          return {
            error: error as Error,
            attemptInfo,
          };
        }
      } catch (recordError) {
        console.error('Erro ao registrar tentativa falha:', recordError);
      }
    } else {
      // Login bem-sucedido: resetar tentativas
      try {
        // @ts-ignore - função RPC não está nos tipos gerados
        await supabase.rpc('reset_login_attempts', {
          p_email: normalizedEmail,
        });
      } catch (resetError) {
        console.error('Erro ao resetar tentativas:', resetError);
      }
    }

    return { 
      error: error as Error | null,
      attemptInfo: blockedInfo || undefined,
    };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    // Usa variável de ambiente se disponível, senão usa a URL de produção
    const siteUrl = import.meta.env.VITE_SITE_URL || 'https://mediumturquoise-jackal-808195.hostingersite.com';
    const redirectUrl = `${siteUrl}/auth`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName }
      }
    });
    return { error: error as Error | null };
  };

  const resetPasswordForEmail = async (email: string) => {
    
    const siteUrl = import.meta.env.VITE_SITE_URL || 'https://mediumturquoise-jackal-808195.hostingersite.com';
    const redirectUrl = `${siteUrl}/auth/reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    
    return { error: error as Error | null };
  };

  const signInWithGoogle = async () => {
    // Detecta automaticamente se está em localhost ou produção
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const siteUrl = isLocalhost 
      ? `${window.location.protocol}//${window.location.hostname}:${window.location.port || '8080'}`
      : (import.meta.env.VITE_SITE_URL || 'https://mediumturquoise-jackal-808195.hostingersite.com');
    const redirectUrl = `${siteUrl}/auth`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });
    
    return { error: error as Error | null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    try {
      // Limpar dados locais primeiro
      localStorage.clear();
      sessionStorage.clear();
      
      // Fazer logout do Supabase
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      
      if (error) {
        console.error('Erro ao fazer logout:', error);
        // Mesmo com erro, limpar estado local
        setUser(null);
        setSession(null);
        // Redirecionar para login
        window.location.href = '/auth';
        return;
      }
      
      // Limpar estado
      setUser(null);
      setSession(null);
      
      // Redirecionar para login
      window.location.href = '/auth';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Mesmo com erro, limpar estado e redirecionar
      setUser(null);
      setSession(null);
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/auth';
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      signIn, 
      signUp, 
      signInWithGoogle, 
      resetPasswordForEmail, 
      updatePassword, 
      signOut,
      checkLoginBlocked,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
