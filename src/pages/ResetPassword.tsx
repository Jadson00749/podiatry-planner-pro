import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const { toast } = useToast();

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    // Verificar se há um token de reset na URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');

    if (type === 'recovery' && accessToken) {
      // O Supabase processa o token automaticamente via onAuthStateChange
      // O usuário está autenticado temporariamente para mudar a senha
      // Não precisamos fazer nada aqui, apenas permitir que o formulário seja preenchido
    } else if (!accessToken && !type) {
      // Se não há token na URL, pode ser que o usuário acessou diretamente
      // Verificar se há sessão de recovery ativa
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          toast({
            variant: 'destructive',
            title: 'Link inválido',
            description: 'Este link de redefinição de senha é inválido ou expirou.',
          });
          setTimeout(() => navigate('/auth'), 2000);
        }
      });
    }
  }, [navigate, toast]);

  const handleSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    const { error } = await updatePassword(data.password);
    setIsLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao redefinir senha',
        description: error.message || 'Ocorreu um erro ao redefinir sua senha.',
      });
      return;
    }

    setIsSuccess(true);
    toast({
      title: '✅ Senha redefinida com sucesso!',
      description: 'Sua senha foi alterada. Você já pode fazer login com a nova senha.',
      duration: 5000,
    });

    // Redirecionar para login após 3 segundos
    setTimeout(() => {
      navigate('/auth');
    }, 3000);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Senha Redefinida!
            </h1>
            <p className="text-muted-foreground">
              Sua senha foi alterada com sucesso! Você já pode fazer login com a nova senha. Redirecionando...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Redefinir Senha
          </h1>
          <p className="text-muted-foreground">
            Digite sua nova senha abaixo
          </p>
        </div>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nova Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...form.register('password')}
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
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...form.register('confirmPassword')}
              className="h-12"
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full h-12 gradient-primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redefinindo...
              </>
            ) : (
              'Redefinir Senha'
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="text-sm text-primary hover:underline"
            >
              Voltar para o login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

