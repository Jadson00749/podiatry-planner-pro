import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, CalendarCheck, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [attemptInfo, setAttemptInfo] = useState<{ attemptsRemaining: number; failedAttempts: number; blockedUntil: string | null } | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('remember_me_preference') === 'true';
  });
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle, resetPasswordForEmail, checkLoginBlocked } = useAuth();
  const { toast } = useToast();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: '', password: '', confirmPassword: '', fullName: '' },
  });

  const resetPasswordForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: '' },
  });

  const [searchParams] = useSearchParams();
  const { user, loading, session } = useAuth();

  // Redirecionar se já estiver autenticado OU limpar dados se não estiver (exceto durante callback OAuth)
  useEffect(() => {
    // Não fazer nada se estiver carregando
    if (loading) return;
    
    const hash = window.location.hash;
    const hasAuthHash = hash.includes('access_token') || hash.includes('code');
    const code = searchParams.get('code');
    
    // Se é callback OAuth, não fazer nada (deixar o fluxo normal acontecer)
    if (hasAuthHash || code) return;
    
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session: currentSession }, error }) => {
      // Se há sessão válida e usuário autenticado, redirecionar
      if (!error && currentSession && user && session) {
        // Verificar se o token expirou
        if (currentSession.expires_at) {
          const expiresAt = currentSession.expires_at * 1000;
          const now = Date.now();
          
          if (now < expiresAt) {
            // Token válido, redirecionar
            const redirectPath = sessionStorage.getItem('redirectAfterLogin');
            if (redirectPath) {
              sessionStorage.removeItem('redirectAfterLogin');
              navigate(redirectPath, { replace: true });
            } else {
              navigate('/dashboard', { replace: true });
            }
            return;
          }
        } else {
          // Sem expiração definida, redirecionar
          const redirectPath = sessionStorage.getItem('redirectAfterLogin');
          if (redirectPath) {
            sessionStorage.removeItem('redirectAfterLogin');
            navigate(redirectPath, { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
          return;
        }
      }
      
      // Se não há sessão válida OU usuário não está autenticado, limpar dados
      if (error || !currentSession || !user || !session) {
        // Limpar dados de autenticação do localStorage
        // O Supabase armazena em chaves que começam com 'sb-' seguido do project-ref
        const allKeys = Object.keys(localStorage);
        const supabaseKeys = allKeys.filter(key => 
          key.startsWith('sb-') || 
          key.toLowerCase().includes('supabase') ||
          key.toLowerCase().includes('auth-token')
        );
        
        // Limpar todas as chaves do Supabase encontradas
        supabaseKeys.forEach(key => {
          try {
            localStorage.removeItem(key);
          } catch {
            // Ignorar erros ao remover
          }
        });
        
        
        // Limpar sessionStorage relacionado à autenticação
        try {
          sessionStorage.removeItem('login_blocked_message');
        } catch {
          // Ignorar erros
        }
        
        // Fazer logout do Supabase para garantir limpeza completa
        // Isso também limpa qualquer token remanescente
        supabase.auth.signOut({ scope: 'local' }).catch(() => {
          // Ignorar erros, já limpamos o localStorage manualmente
        });
      }
    });
  }, [user, session, loading, navigate, searchParams]);

  // Verificar se há mensagem de bloqueio do Google OAuth
  useEffect(() => {
    const blockedMessage = sessionStorage.getItem('login_blocked_message');
    if (blockedMessage) {
      try {
        const { email, blockedUntil } = JSON.parse(blockedMessage);
        const blockedDate = blockedUntil ? new Date(blockedUntil) : null;
        const now = new Date();
        
        if (blockedDate && blockedDate > now) {
          const minutesRemaining = Math.ceil((blockedDate.getTime() - now.getTime()) / (1000 * 60));
          const isToday = blockedDate.toDateString() === now.toDateString();
          
          toast({
            variant: 'destructive',
            title: '🔒 Conta bloqueada',
            description: `Muitas tentativas de login falhas. Tente novamente em ${minutesRemaining} minuto${minutesRemaining > 1 ? 's' : ''}${isToday ? ` (${blockedDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})` : ` (${blockedDate.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })})`}`,
            duration: 10000,
          });
          
          // Atualizar estado local se o email corresponder
          if (loginForm.getValues('email').toLowerCase() === email.toLowerCase()) {
            setAttemptInfo({
              attemptsRemaining: 0,
              failedAttempts: 5,
              blockedUntil: blockedUntil,
            });
          }
        }
      } catch (error) {
        // Erro ao processar mensagem de bloqueio
      } finally {
        sessionStorage.removeItem('login_blocked_message');
      }
    }
  }, [toast, loginForm]);

  // Tratar redirecionamento após login com Google
  useEffect(() => {
    // Verificar se há hash na URL (callback do Supabase OAuth)
    const hash = window.location.hash;
    const hasAuthHash = hash.includes('access_token') || hash.includes('code');
    
    // Verificar query params também
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao entrar com Google',
        description: 'Não foi possível fazer login com Google. Tente novamente.',
      });
      window.history.replaceState({}, document.title, '/auth');
      return;
    }

    // Se há hash de autenticação ou código, aguardar o Supabase processar
    if (hasAuthHash || code) {
      // O Supabase processa automaticamente o hash via onAuthStateChange
      // Mas vamos forçar uma verificação de sessão também
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          // Limpar hash/query params da URL
          window.history.replaceState({}, document.title, '/auth');
          // Redirecionar para dashboard
          navigate('/dashboard', { replace: true });
        }
      });
      
      // Aguardar o Supabase processar a sessão via onAuthStateChange
      let attempts = 0;
      const maxAttempts = 40;
      
      const checkSession = setInterval(() => {
        attempts++;
        
        if ((user || session) && !loading) {
          clearInterval(checkSession);
          // Limpar hash/query params da URL
          window.history.replaceState({}, document.title, '/auth');
          // Redirecionar para dashboard
          navigate('/dashboard', { replace: true });
        } else if (attempts >= maxAttempts) {
          // Timeout
          clearInterval(checkSession);
          toast({
            variant: 'destructive',
            title: 'Erro ao processar login',
            description: 'Não foi possível completar o login. Tente novamente.',
          });
          window.history.replaceState({}, document.title, '/auth');
        }
      }, 500);
      
      return () => clearInterval(checkSession);
    }
  }, [searchParams, navigate, toast, user, session, loading]);

  // Verificar bloqueio quando email muda (com debounce para evitar muitas chamadas)
  useEffect(() => {
    const email = loginForm.watch('email');
    if (!email || !isLogin) {
      // Se não há email ou não está na tela de login, limpar attemptInfo
      setAttemptInfo(null);
      setShowCaptcha(false);
      setCaptchaVerified(false);
      return;
    }

    // Debounce: aguardar 500ms após parar de digitar
    const timeoutId = setTimeout(() => {
      checkLoginBlocked(email).then((info) => {
        if (info) {
          // Só atualizar attemptInfo se realmente houver bloqueio ativo ou tentativas
          if (info.isBlocked && info.blockedUntil) {
            const blockedDate = new Date(info.blockedUntil);
            const now = new Date();
            if (blockedDate > now) {
              // Só setar se ainda estiver bloqueado
              setAttemptInfo({
                attemptsRemaining: info.attemptsRemaining,
                failedAttempts: info.failedAttempts,
                blockedUntil: info.blockedUntil,
              });
              setShowCaptcha(false); // Não mostrar CAPTCHA se está bloqueado
              setCaptchaVerified(false);
            } else {
              // Bloqueio expirado, limpar
              setAttemptInfo(null);
              setShowCaptcha(false);
              setCaptchaVerified(false);
            }
          } else if (info.failedAttempts > 0) {
            // Há tentativas falhas mas não está bloqueado
            setAttemptInfo({
              attemptsRemaining: info.attemptsRemaining,
              failedAttempts: info.failedAttempts,
              blockedUntil: null, // Não bloqueado
            });
            setShowCaptcha(info.failedAttempts >= 3);
            setCaptchaVerified(false); // Resetar CAPTCHA quando email muda
          } else {
            // Sem tentativas falhas, limpar tudo
            setAttemptInfo(null);
            setShowCaptcha(false);
            setCaptchaVerified(false);
          }
        } else {
          // Sem informações de bloqueio, limpar tudo
          setAttemptInfo(null);
          setShowCaptcha(false);
          setCaptchaVerified(false);
        }
      }).catch(() => {
        // Em caso de erro, não bloquear o login
        setAttemptInfo(null);
        setShowCaptcha(false);
        setCaptchaVerified(false);
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [loginForm.watch('email'), isLogin, checkLoginBlocked]);

  const handleLogin = async (data: LoginFormData) => {
    // Verificar se está bloqueado
    const blockedInfo = await checkLoginBlocked(data.email);
    if (blockedInfo?.isBlocked) {
      const blockedUntil = blockedInfo.blockedUntil 
        ? new Date(blockedInfo.blockedUntil).toLocaleString('pt-BR')
        : '15 minutos';
      
      toast({
        variant: 'destructive',
        title: '🔒 Conta temporariamente bloqueada',
        description: `Muitas tentativas de login falhas. Tente novamente em: ${blockedUntil}`,
        duration: 10000,
      });
      return;
    }

    // Verificar se precisa de CAPTCHA (3+ tentativas)
    if (attemptInfo && attemptInfo.failedAttempts >= 3 && !captchaVerified) {
      toast({
        variant: 'destructive',
        title: '⚠️ Verificação necessária',
        description: 'Por segurança, complete a verificação antes de continuar.',
        duration: 5000,
      });
      return;
    }

    setIsLoading(true);
    
    const { error, attemptInfo: newAttemptInfo } = await signIn(data.email, data.password);
    setIsLoading(false);

    if (error) {
      // Atualizar informações de tentativas
      if (newAttemptInfo) {
        setAttemptInfo({
          attemptsRemaining: newAttemptInfo.attemptsRemaining,
          failedAttempts: newAttemptInfo.failedAttempts,
          blockedUntil: newAttemptInfo.blockedUntil,
        });
        setShowCaptcha(newAttemptInfo.failedAttempts >= 3);
        setCaptchaVerified(false); // Resetar CAPTCHA após nova tentativa
      }

      let message = error.message;
      let title = 'Erro ao entrar';
      
      if (error.message === 'BLOCKED') {
        const blockedUntil = newAttemptInfo?.blockedUntil 
          ? new Date(newAttemptInfo.blockedUntil).toLocaleString('pt-BR')
          : '15 minutos';
        
        title = '🔒 Conta bloqueada';
        message = `Muitas tentativas de login falhas. Tente novamente em: ${blockedUntil}`;
      } else if (error.message === 'Invalid login credentials') {
        const remaining = newAttemptInfo?.attemptsRemaining ?? 5;
        if (remaining > 0) {
          title = remaining <= 2 ? '⚠️ Email ou senha incorretos' : '❌ Email ou senha incorretos';
          message = `Você tem ${remaining} tentativa${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}${remaining <= 2 ? ' antes do bloqueio temporário' : ''}.`;
        } else {
          title = '🔒 Conta bloqueada';
          message = 'Muitas tentativas falhas. Aguarde 15 minutos antes de tentar novamente.';
        }
      } else if (error.message.includes('Email not confirmed')) {
        title = '📧 Email não confirmado';
        message = 'Por favor, verifique sua caixa de entrada e clique no link de confirmação enviado para seu email.';
      }
      
      toast({
        variant: 'destructive',
        title,
        description: message,
        duration: 8000,
      });
      return;
    }

    // Login bem-sucedido: limpar estado
    setAttemptInfo(null);
    setShowCaptcha(false);
    setCaptchaVerified(false);
    
    // Verificar se tem redirect salvo (para voltar à página de agendamento)
    const redirectPath = sessionStorage.getItem('redirectAfterLogin');
    if (redirectPath) {
      sessionStorage.removeItem('redirectAfterLogin');
      navigate(redirectPath);
    } else {
      navigate('/dashboard');
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    setIsLoading(true);
    const { error } = await signUp(data.email, data.password, data.fullName);
    setIsLoading(false);

    if (error) {
      let message = error.message;
      if (error.message.includes('already registered')) {
        message = 'Este email já está cadastrado';
      }
      toast({
        variant: 'destructive',
        title: 'Erro ao cadastrar',
        description: message,
      });
      return;
    }

    toast({
      title: '✅ Conta criada com sucesso!',
      description: '📧 Verifique seu email e clique no link de confirmação para ativar sua conta.',
      duration: 8000, // Mensagem fica visível por 8 segundos
    });
    
    // Não redireciona, mantém na página de login
    setIsLogin(true);
  };

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    setIsResettingPassword(true);
    const { error } = await resetPasswordForEmail(data.email);
    setIsResettingPassword(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar email',
        description: error.message || 'Ocorreu um erro ao enviar o email de redefinição de senha.',
      });
      return;
    }

    toast({
      title: '✅ Email enviado!',
      description: '📧 Verifique sua caixa de entrada. Enviamos um link para redefinir sua senha.',
      duration: 8000,
    });

    setShowResetPasswordDialog(false);
    resetPasswordForm.reset();
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Hero */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30"></div>
        
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-center">
          <div className="animate-float">
            <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-8 shadow-glow">
              <CalendarCheck className="w-14 h-14 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
          AgendaPro
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-md">
            Gerencie sua clínica com facilidade e profissionalismo
          </p>
          
          <div className="grid grid-cols-2 gap-6 text-left max-w-md">
            {[
              { title: 'Agenda Inteligente', desc: 'Controle seus horários' },
              { title: 'Gestão de Clientes', desc: 'Histórico completo' },
              { title: 'Controle Financeiro', desc: 'Recebimentos e pendências' },
              { title: 'WhatsApp Integrado', desc: 'Contato rápido com clientes' },
            ].map((item) => (
              <div key={item.title} className="p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                <h3 className="font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-white/70">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 sm:px-8 sm:py-12 lg:p-12 bg-background relative">
        {/* Mobile Logo - Esquerda */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <CalendarCheck className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">AgendaPro</h1>
              <p className="text-xs text-muted-foreground">Gestão Clínica</p>
            </div>
          </div>
        </div>

        {/* Theme Toggle - Sempre à direita */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 lg:top-6 lg:right-6 flex justify-end">
          <ThemeToggle />
        </div>

        {/* Conteúdo centralizado */}
        <div className="w-full max-w-md">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
              {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              {isLogin
                ? 'Entre para gerenciar sua agenda'
                : 'Comece a organizar sua clínica hoje'}
            </p>
          </div>

          {isLogin ? (
            <>
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4 sm:space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  {...loginForm.register('email')}
                  className="h-12"
                />
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...loginForm.register('password')}
                    className="h-12 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              {/* Mensagem de tentativas restantes */}
              {attemptInfo && attemptInfo.failedAttempts > 0 && !attemptInfo.blockedUntil && (
                <div className={`p-4 rounded-lg border-2 ${
                  attemptInfo.attemptsRemaining <= 2 
                    ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-300 dark:border-orange-700' 
                    : 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700'
                }`}>
                  <p className={`text-sm font-semibold ${
                    attemptInfo.attemptsRemaining <= 2 
                      ? 'text-orange-900 dark:text-orange-100' 
                      : 'text-blue-900 dark:text-blue-100'
                  }`}>
                    {attemptInfo.attemptsRemaining <= 2 ? '⚠️ ' : 'ℹ️ '}
                    Você tem <strong className="text-base">{attemptInfo.attemptsRemaining}</strong> tentativa{attemptInfo.attemptsRemaining > 1 ? 's' : ''} restante{attemptInfo.attemptsRemaining > 1 ? 's' : ''}
                    {attemptInfo.attemptsRemaining <= 2 ? ' antes do bloqueio temporário' : ''}
                  </p>
                </div>
              )}

              {/* Mensagem de bloqueio */}
              {attemptInfo?.blockedUntil && (() => {
                const blockedUntil = new Date(attemptInfo.blockedUntil);
                const now = new Date();
                const minutesRemaining = Math.ceil((blockedUntil.getTime() - now.getTime()) / (1000 * 60));
                const isToday = blockedUntil.toDateString() === now.toDateString();
                
                return (
                  <div className="p-4 rounded-lg border-2 bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700">
                    <p className="text-sm font-bold text-red-900 dark:text-red-100 mb-2">
                      🔒 Conta temporariamente bloqueada
                    </p>
                    <p className="text-sm text-red-800 dark:text-red-200">
                      Muitas tentativas de login falhas.{' '}
                      {minutesRemaining > 0 ? (
                        <>
                          Tente novamente em <strong className="text-base">{minutesRemaining} minuto{minutesRemaining > 1 ? 's' : ''}</strong>
                          {isToday ? (
                            <> ({blockedUntil.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})</>
                          ) : (
                            <> ({blockedUntil.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })})</>
                          )}
                        </>
                      ) : (
                        <>Tente novamente agora.</>
                      )}
                    </p>
                  </div>
                );
              })()}

              {/* CAPTCHA (após 3 tentativas) */}
              {showCaptcha && !attemptInfo?.blockedUntil && (
                <div className="p-4 rounded-lg border-2 bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="captcha"
                      checked={captchaVerified}
                      onChange={(e) => setCaptchaVerified(e.target.checked)}
                      className="mt-1 h-5 w-5 rounded border-2 border-amber-600 dark:border-amber-400 text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                    />
                    <label htmlFor="captcha" className="text-sm cursor-pointer flex-1">
                      <span className="font-semibold text-amber-900 dark:text-amber-100 block mb-1">
                        Por segurança, confirme que você não é um robô
                      </span>
                      <p className="text-xs text-amber-800 dark:text-amber-200">
                        Múltiplas tentativas de login foram detectadas. Complete esta verificação para continuar.
                      </p>
                    </label>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(checked) => {
                      setRememberMe(!!checked);
                      localStorage.setItem('remember_me_preference', String(!!checked));
                    }}
                  />
                  <Label htmlFor="rememberMe" className="text-sm cursor-pointer">
                    Lembrar-me
                  </Label>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResetPasswordDialog(true)}
                  className="text-sm text-primary hover:underline"
                >
                  Esqueceu sua senha?
                </button>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 gradient-primary" 
                disabled={
                  isLoading || 
                  (() => {
                    // Verificar se há bloqueio ativo (data no futuro)
                    if (attemptInfo?.blockedUntil) {
                      try {
                        const blockedDate = new Date(attemptInfo.blockedUntil);
                        const now = new Date();
                        return blockedDate > now;
                      } catch {
                        return false;
                      }
                    }
                    return false;
                  })() || 
                  (showCaptcha && !captchaVerified)
                }
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (() => {
                  // Verificar se há bloqueio ativo para o texto do botão
                  if (attemptInfo?.blockedUntil) {
                    try {
                      const blockedDate = new Date(attemptInfo.blockedUntil);
                      const now = new Date();
                      return blockedDate > now ? 'Conta Bloqueada' : 'Entrar';
                    } catch {
                      return 'Entrar';
                    }
                  }
                  return showCaptcha && !captchaVerified ? 'Complete a Verificação' : 'Entrar';
                })()}
              </Button>
            </form>

            {/* Divisor e Botão Google */}
            <div className="space-y-4 mt-6 sm:mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-2 hover:bg-accent"
                onClick={async () => {
                  setIsLoading(true);
                  const { error } = await signInWithGoogle();
                  setIsLoading(false);
                  
                  if (error) {
                    toast({
                      variant: 'destructive',
                      title: 'Erro ao entrar com Google',
                      description: error.message || 'Ocorreu um erro ao tentar entrar com Google.',
                    });
                  }
                  // Se não houver erro, o usuário será redirecionado automaticamente pelo Google
                }}
                disabled={isLoading}
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar com Google'
                )}
              </Button>
            </div>
            </>
          ) : (
            <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Seu nome"
                  {...signupForm.register('fullName')}
                  className="h-12"
                />
                {signupForm.formState.errors.fullName && (
                  <p className="text-sm text-destructive">{signupForm.formState.errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="seu@email.com"
                  {...signupForm.register('email')}
                  className="h-12"
                />
                {signupForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{signupForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Senha</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...signupForm.register('password')}
                    className="h-12 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {signupForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{signupForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...signupForm.register('confirmPassword')}
                  className="h-12"
                />
                {signupForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">{signupForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full h-12 gradient-primary" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  'Criar conta'
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 sm:mt-8 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                loginForm.reset();
                signupForm.reset();
              }}
              className="text-sm text-primary hover:underline"
            >
              {isLogin
                ? 'Não tem conta? Cadastre-se'
                : 'Já tem conta? Entre aqui'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Esqueci Minha Senha */}
      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Redefinir Senha
            </DialogTitle>
            <DialogDescription>
              Digite seu email e enviaremos um link para redefinir sua senha.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="seu@email.com"
                {...resetPasswordForm.register('email')}
                className="h-12"
              />
              {resetPasswordForm.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {resetPasswordForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowResetPasswordDialog(false);
                  resetPasswordForm.reset();
                }}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto gradient-primary"
                disabled={isResettingPassword}
              >
                {isResettingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Link'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


