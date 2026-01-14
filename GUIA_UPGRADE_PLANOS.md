# 📋 Guia de Upgrade de Planos - Manual

## 🔄 Fluxo Automático

### Quando um novo usuário se cadastra:

1. ✅ **Plano padrão**: `basic` (automático)
2. ✅ **Trial**: 15 dias grátis (automático)
3. ✅ **Limites automáticos**:
   - 50 clientes
   - 10 procedimentos
   - 0 exportações (sem exportação)

### O que acontece automaticamente:

- A trigger `initialize_subscription_limits` configura tudo automaticamente
- Não precisa fazer nada no banco para novos usuários

---

## 💰 Quando o Cliente Compra um Plano

### Processo Manual (você faz no Supabase):

1. Cliente entra em contato via WhatsApp (botão na página de planos)
2. Você confirma o pagamento
3. Você vai no **Supabase SQL Editor** e executa o script de upgrade
4. O upgrade é **imediato** (sem precisar fazer logout/login)

---

## 📝 Scripts SQL Prontos

Todos os scripts estão em:
```
supabase/migrations/20250113000005_upgrade_user_plan_scripts.sql
```

### Como usar:

1. Abra o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Copie o script desejado
4. **Substitua** `'email@usuario.com'` pelo email do cliente
5. Execute o script

---

## 🚀 Scripts Disponíveis

### 1. Upgrade para Professional
```sql
UPDATE public.profiles
SET 
  subscription_plan = 'professional',
  max_clients = 200,
  max_procedures = 20,
  export_limit = 10,
  export_count = 0,
  subscription_expires_at = now() + INTERVAL '1 month',
  trial_ends_at = NULL
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email = 'email@usuario.com'  -- ⚠️ SUBSTITUA
);
```

### 2. Upgrade para Premium
```sql
UPDATE public.profiles
SET 
  subscription_plan = 'premium',
  max_clients = -1,      -- Ilimitado
  max_procedures = -1,   -- Ilimitado
  export_limit = -1,     -- Ilimitado
  export_count = 0,
  subscription_expires_at = now() + INTERVAL '1 month',
  trial_ends_at = NULL
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email = 'email@usuario.com'  -- ⚠️ SUBSTITUA
);
```

### 3. Verificar Plano de um Usuário
```sql
SELECT 
  p.full_name,
  u.email,
  p.subscription_plan,
  p.trial_ends_at,
  p.subscription_expires_at,
  p.max_clients,
  p.max_procedures,
  p.export_limit,
  p.export_count,
  CASE 
    WHEN p.trial_ends_at > now() THEN 'Trial Ativo'
    WHEN p.subscription_expires_at IS NULL THEN 'Sem Expiração'
    WHEN p.subscription_expires_at > now() THEN 'Ativo'
    ELSE 'Expirado'
  END as status
FROM public.profiles p
JOIN auth.users u ON u.id = p.user_id
WHERE u.email = 'email@usuario.com';  -- ⚠️ SUBSTITUA
```

---

## 📊 Limites por Plano

| Plano | Clientes | Procedimentos | Exportações | Preço |
|-------|----------|---------------|-------------|-------|
| **Basic** | 50 | 10 | 0 | R$ 35/mês |
| **Professional** | 200 | 20 | 10/mês | R$ 69/mês |
| **Premium** | ∞ | ∞ | ∞ | R$ 129/mês |

---

## ⚠️ Observações Importantes

1. **Upgrade é imediato**: O usuário não precisa fazer logout/login
2. **Trial removido**: Ao fazer upgrade, o trial é removido automaticamente
3. **Contador resetado**: O `export_count` é resetado ao fazer upgrade
4. **Data de expiração**: Você pode definir `subscription_expires_at` para controlar renovação
5. **Sem expiração**: Se deixar `subscription_expires_at = NULL`, o plano não expira

---

## 🔍 Dicas

### Ver todos os usuários e planos:
```sql
SELECT 
  u.email,
  p.full_name,
  p.subscription_plan,
  CASE 
    WHEN p.trial_ends_at > now() THEN 'Trial Ativo'
    WHEN p.subscription_expires_at IS NULL THEN 'Sem Expiração'
    WHEN p.subscription_expires_at > now() THEN 'Ativo'
    ELSE 'Expirado'
  END as status
FROM public.profiles p
JOIN auth.users u ON u.id = p.user_id
ORDER BY p.subscription_plan, u.email;
```

### Resetar contador de exportações (início do mês):
```sql
UPDATE public.profiles
SET export_count = 0
WHERE subscription_plan IN ('professional', 'premium');
```

### Renovar assinatura (adicionar 1 mês):
```sql
UPDATE public.profiles
SET subscription_expires_at = COALESCE(subscription_expires_at, now()) + INTERVAL '1 month'
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email = 'email@usuario.com'  -- ⚠️ SUBSTITUA
);
```

---

## 📞 Processo Completo de Venda

1. Cliente acessa `/planos` e clica em "Fazer Upgrade"
2. WhatsApp abre com mensagem pré-formatada
3. Você recebe a mensagem e confirma o pagamento
4. Você executa o script SQL no Supabase
5. Cliente recebe acesso imediato (sem precisar fazer nada)

---

## ✅ Checklist de Upgrade

- [ ] Cliente entrou em contato via WhatsApp
- [ ] Pagamento confirmado
- [ ] Script SQL executado no Supabase
- [ ] Email do cliente substituído no script
- [ ] Upgrade confirmado (verificar com script de consulta)
- [ ] Cliente notificado (opcional)

---

**💡 Dica**: Salve os scripts SQL como favoritos no Supabase SQL Editor para acesso rápido!



