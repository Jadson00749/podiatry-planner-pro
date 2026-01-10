import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
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
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signInWithGoogle, resetPasswordForEmail, updatePassword, signOut }}>
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
