import { useState, useEffect } from 'react';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Link, Copy, ExternalLink, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BookingSettings {
  min_advance_hours: number;
  max_advance_days: number;
  auto_confirm: boolean;
  slot_duration_minutes: number;
}

const DEFAULT_BOOKING_SETTINGS: BookingSettings = {
  min_advance_hours: 2,
  max_advance_days: 30,
  auto_confirm: true,
  slot_duration_minutes: 30,
};

export function BookingSettingsTab() {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();

  const [bookingEnabled, setBookingEnabled] = useState(false);
  const [bookingCode, setBookingCode] = useState('');
  const [settings, setSettings] = useState<BookingSettings>(DEFAULT_BOOKING_SETTINGS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Carregar dados do perfil
  useEffect(() => {
    if (profile) {
      setBookingEnabled(profile.booking_enabled || false);
      setBookingCode(profile.booking_code || '');
      
      if (profile.booking_settings) {
        setSettings(profile.booking_settings as BookingSettings);
      }
    }
  }, [profile]);

  const generateBookingCode = async () => {
    if (!profile) return;

    setIsGenerating(true);
    try {
      // Chamar função do banco para gerar código único
      // @ts-ignore - RPC function not in generated types yet
      const { data, error } = await supabase.rpc('generate_booking_code', {
        professional_name: profile.full_name,
      });

      if (error) throw error;

      const newCode = data as string;
      
      // Atualizar no banco
      await updateProfile.mutateAsync({
        booking_code: newCode,
        booking_enabled: true,
      } as any);

      setBookingCode(newCode);
      setBookingEnabled(true);

      toast({
        title: 'Link gerado!',
        description: 'Seu link de agendamento foi criado com sucesso.',
      });
    } catch (error: any) {
      console.error('Erro ao gerar código:', error);
      toast({
        title: 'Erro ao gerar link',
        description: error.message || 'Não foi possível gerar o link. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleBookingEnabled = async () => {
    if (!bookingCode) {
      toast({
        title: 'Link não gerado',
        description: 'Gere um link de agendamento primeiro.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateProfile.mutateAsync({
        booking_enabled: !bookingEnabled,
      } as any);

      setBookingEnabled(!bookingEnabled);

      toast({
        title: bookingEnabled ? 'Agendamento desativado' : 'Agendamento ativado',
        description: bookingEnabled
          ? 'Clientes não poderão mais agendar via link.'
          : 'Clientes já podem agendar via link!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar as configurações.',
        variant: 'destructive',
      });
    }
  };

  const saveSettings = async () => {
    try {
      await updateProfile.mutateAsync({
        booking_settings: settings,
      } as any);

      toast({
        title: 'Configurações salvas!',
        description: 'Suas preferências de agendamento foram atualizadas.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      });
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/agendar/${bookingCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: 'Link copiado!',
      description: 'O link foi copiado para a área de transferência.',
    });
  };

  const bookingLink = bookingCode ? `${window.location.origin}/agendar/${bookingCode}` : '';

  return (
    <div className="space-y-6">
      {/* Card: Link de Agendamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Link de Agendamento Online
          </CardTitle>
          <CardDescription>
            Permita que seus clientes agendem horários diretamente pelo link
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!bookingCode ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Clique no botão abaixo para gerar seu link personalizado de agendamento online.
              </p>
              <Button onClick={generateBookingCode} disabled={isGenerating}>
                {isGenerating ? 'Gerando...' : 'Gerar Meu Link'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Link gerado */}
              <div className="space-y-2">
                <Label>Seu Link Público</Label>
                <div className="flex gap-2">
                  <Input value={bookingLink} readOnly className="font-mono text-sm" />
                  <Button size="icon" variant="outline" onClick={copyLink}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => window.open(bookingLink, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Compartilhe este link no WhatsApp, Instagram, ou onde preferir!
                </p>
              </div>

              {/* Ativar/Desativar */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="booking-enabled" className="text-base">
                    Agendamento Online
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {bookingEnabled
                      ? 'Clientes podem agendar via link'
                      : 'Agendamento está desativado'}
                  </p>
                </div>
                <Switch
                  id="booking-enabled"
                  checked={bookingEnabled}
                  onCheckedChange={toggleBookingEnabled}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card: Configurações de Horário */}
      {bookingCode && (
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Disponibilidade</CardTitle>
            <CardDescription>
              Configure os horários e regras para agendamento online
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Antecedência Mínima */}
            <div className="space-y-2">
              <Label htmlFor="min-advance">Antecedência Mínima (horas)</Label>
              <Input
                id="min-advance"
                type="number"
                min="0"
                max="48"
                value={settings.min_advance_hours}
                onChange={(e) =>
                  setSettings({ ...settings, min_advance_hours: parseInt(e.target.value) || 0 })
                }
              />
              <p className="text-xs text-muted-foreground">
                Tempo mínimo que o cliente deve agendar com antecedência
              </p>
            </div>

            {/* Antecedência Máxima */}
            <div className="space-y-2">
              <Label htmlFor="max-advance">Agendar com até (dias)</Label>
              <Input
                id="max-advance"
                type="number"
                min="1"
                max="90"
                value={settings.max_advance_days}
                onChange={(e) =>
                  setSettings({ ...settings, max_advance_days: parseInt(e.target.value) || 30 })
                }
              />
              <p className="text-xs text-muted-foreground">
                Máximo de dias que o cliente pode agendar no futuro
              </p>
            </div>

            {/* Duração do Slot */}
            <div className="space-y-2">
              <Label htmlFor="slot-duration">Intervalo entre horários (minutos)</Label>
              <Input
                id="slot-duration"
                type="number"
                min="15"
                max="120"
                step="15"
                value={settings.slot_duration_minutes}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    slot_duration_minutes: parseInt(e.target.value) || 30,
                  })
                }
              />
            </div>

            {/* Auto-confirmar */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="auto-confirm" className="text-base">
                  Confirmar Automaticamente
                </Label>
                <p className="text-sm text-muted-foreground">
                  Agendamentos são confirmados sem sua aprovação
                </p>
              </div>
              <Switch
                id="auto-confirm"
                checked={settings.auto_confirm}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, auto_confirm: checked })
                }
              />
            </div>

            <Button onClick={saveSettings} className="w-full">
              Salvar Configurações
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

