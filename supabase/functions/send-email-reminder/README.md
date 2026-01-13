# Sistema de Lembretes por Email

Esta Edge Function envia lembretes automáticos de agendamentos por email aos clientes usando a API do Resend.

## Configuração

### 1. Criar conta no Resend

1. Acesse [https://resend.com](https://resend.com)
2. Crie uma conta gratuita (3.000 emails/mês grátis)
3. Vá em "API Keys" e crie uma nova chave
4. Copie a chave API

### 2. Configurar variáveis de ambiente no Supabase

No dashboard do Supabase, vá em:
- **Project Settings** → **Edge Functions** → **Secrets**

Adicione as seguintes variáveis:

```
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

### 3. Configurar variáveis no banco de dados

Execute no SQL Editor do Supabase:

```sql
-- Configurar URL da Edge Function
ALTER DATABASE postgres SET app.settings.edge_function_url = 'https://seu-projeto.supabase.co/functions/v1/send-email-reminder';

-- OU configure a URL base do Supabase (será construída automaticamente)
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://seu-projeto.supabase.co';

-- Configurar API Key do Supabase
ALTER DATABASE postgres SET app.settings.supabase_anon_key = 'sua-anon-key-aqui';
```

### 4. Ativar o cron job

No SQL Editor, descomente e execute:

```sql
SELECT cron.schedule(
  'send-email-reminders',
  '*/15 * * * *', -- A cada 15 minutos
  $$SELECT public.send_email_reminders()$$
);
```

### 5. Verificar domínio no Resend (opcional)

Para usar um domínio personalizado:
1. No Resend, vá em "Domains"
2. Adicione seu domínio
3. Configure os registros DNS conforme instruções
4. Atualize o `from` email na Edge Function

## Como funciona

1. O cron job executa a cada 15 minutos
2. A função `send_email_reminders()` verifica agendamentos futuros
3. Para cada agendamento, verifica se está na janela de tempo configurada (`reminder_hours_before`)
4. Se estiver na janela e ainda não foi enviado, chama a Edge Function
5. A Edge Function envia o email via Resend
6. Registra o envio na tabela `appointment_email_reminders` para evitar duplicatas

## Template de Email

O sistema suporta templates personalizados:

1. Na página de Configurações, o usuário pode criar um template personalizado
2. O template suporta as seguintes variáveis:
   - `{client_name}` - Nome do cliente
   - `{appointment_date}` - Data formatada
   - `{appointment_time}` - Horário
   - `{clinic_name}` - Nome da clínica
   - `{clinic_address}` - Endereço da clínica
   - `{clinic_phone}` - Telefone da clínica
   - `{hours_before}` - Horas antes do agendamento

Se não houver template personalizado, usa o template padrão HTML.

## Testando

Para testar manualmente, você pode chamar a Edge Function diretamente:

```bash
curl -X POST https://seu-projeto.supabase.co/functions/v1/send-email-reminder \
  -H "Authorization: Bearer sua-anon-key" \
  -H "Content-Type: application/json" \
  -d '{
    "reminder": {
      "appointment_id": "uuid-do-agendamento",
      "client_name": "João Silva",
      "client_email": "joao@example.com",
      "appointment_date": "2026-01-15",
      "appointment_time": "14:00",
      "clinic_name": "Clínica Podológica",
      "hours_before": 24
    }
  }'
```

## Troubleshooting

- **Emails não estão sendo enviados**: Verifique se `email_notifications_enabled` está `true` no perfil
- **Erro de autenticação**: Verifique se `RESEND_API_KEY` está configurada corretamente
- **Emails duplicados**: A tabela `appointment_email_reminders` previne duplicatas
- **Template não funciona**: Verifique se as variáveis estão entre chaves `{}`










