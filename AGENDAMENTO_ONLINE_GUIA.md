# 📅 Sistema de Agendamento Online - Guia Completo

## 🎯 O que foi implementado?

Um sistema completo de agendamento online onde clientes podem agendar horários diretamente através de um link único do profissional, sem precisar que o profissional cadastre manualmente cada agendamento.

---

## 🚀 Como Usar

### **Para o Profissional:**

#### 1. **Ativar Agendamento Online**

1. Acesse **Configurações** no menu lateral
2. Clique na aba **"Agendamento Online"** (ícone de link)
3. Clique em **"Gerar Meu Link"**
4. Seu link será gerado automaticamente (ex: `app.com/agendar/dra-maria-silva`)
5. Ative o switch **"Agendamento Online"** para permitir agendamentos

#### 2. **Compartilhar o Link**

- Copie o link clicando no ícone de copiar
- Compartilhe no WhatsApp, Instagram, cartão de visitas, etc.
- Clientes poderão acessar e agendar diretamente

#### 3. **Configurar Disponibilidade**

Na mesma tela, você pode configurar:

- **Antecedência Mínima**: Tempo mínimo que cliente deve agendar (ex: 2 horas)
- **Agendar com até**: Máximo de dias no futuro (ex: 30 dias)
- **Intervalo entre horários**: 15, 30, 60 minutos
- **Confirmar Automaticamente**: Se agendamentos são confirmados sem sua aprovação
- **Dias e Horários**: Quais dias da semana você atende e em que horários

#### 4. **Ver Agendamentos**

- Todos os agendamentos feitos pelos clientes aparecem na sua **Aba Agenda**
- Você verá o nome do cliente, telefone, data e horário
- Pode gerenciar normalmente (confirmar, cancelar, etc.)

---

### **Para o Cliente:**

#### 1. **Acessar o Link**

- Cliente recebe o link do profissional
- Acessa pelo navegador (celular ou computador)

#### 2. **Fazer Login/Cadastro**

- Se for primeira vez, precisa criar uma conta rápida:
  - Nome completo
  - Email
  - Telefone
  - Senha

- Se já tem conta, faz login normalmente

#### 3. **Agendar Horário**

**Passo 1 - Escolher Data:**
- Vê calendário com dias disponíveis
- Dias indisponíveis aparecem desabilitados

**Passo 2 - Escolher Horário:**
- Vê horários livres do dia selecionado
- Horários ocupados não aparecem

**Passo 3 - Preencher Informações:**
- Nome, telefone, email
- Procedimento (opcional)
- Observações (opcional)

**Passo 4 - Confirmar:**
- Revisa todas as informações
- Confirma o agendamento

#### 4. **Confirmação**

- Cliente recebe confirmação na tela
- Pode receber mensagem no WhatsApp (se configurado)

---

## 🗄️ Estrutura do Banco de Dados

### **Mudanças nas Tabelas Existentes:**

#### **profiles** (profissionais)
```sql
- role: 'professional' | 'client'
- booking_code: código único (ex: "dra-maria-silva")
- booking_enabled: true/false
- booking_settings: JSON com configurações
```

#### **clients** (clientes cadastrados)
```sql
- linked_user_id: vincula ao usuário autenticado
- avatar_url: foto do cliente
```

### **Fluxo de Dados:**

```
1. Cliente acessa: /agendar/dra-maria-silva
2. Sistema busca profissional com booking_code='dra-maria-silva'
3. Cliente faz login/cadastro
4. Sistema cria/atualiza registro em clients
5. Cliente escolhe data/hora
6. Sistema cria appointment vinculado ao profissional e cliente
```

---

## 🔐 Segurança e Permissões (RLS)

### **Políticas Implementadas:**

1. **Profissionais com booking ativo são visíveis publicamente** (apenas dados básicos)
2. **Clientes só veem seus próprios agendamentos**
3. **Clientes só podem criar agendamentos para si mesmos**
4. **Clientes podem cancelar apenas agendamentos futuros**
5. **Constraint de unique** previne double booking (mesmo horário)

---

## 📝 Próximos Passos (Aplicar no Supabase)

### **1. Rodar a Migration SQL**

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Copie o conteúdo do arquivo:
   ```
   supabase/migrations/20260116000000_add_public_booking_system.sql
   ```
4. Cole no editor e execute
5. Aguarde confirmação de sucesso

### **2. Testar Localmente**

```bash
# No terminal, na pasta do projeto:
npm run dev
```

### **3. Testar o Fluxo Completo**

**Como Profissional:**
1. Faça login no sistema
2. Vá em Configurações → Agendamento Online
3. Clique em "Gerar Meu Link"
4. Copie o link gerado

**Como Cliente (nova aba anônima):**
1. Cole o link no navegador
2. Crie uma conta de teste
3. Tente agendar um horário
4. Confirme o agendamento

**Verificar:**
1. Volte para conta do profissional
2. Vá na Aba Agenda
3. O agendamento do cliente deve aparecer lá!

---

## 🐛 Possíveis Erros e Soluções

### **Erro: "Profissional não encontrado"**
- **Causa**: Migration não foi rodada ou booking_code não foi gerado
- **Solução**: Rode a migration e gere o link nas configurações

### **Erro: "Não foi possível criar agendamento"**
- **Causa**: RLS policies não aplicadas ou horário já ocupado
- **Solução**: Verifique se migration rodou completamente

### **Erro: "Link não funciona"**
- **Causa**: Rota não foi adicionada corretamente
- **Solução**: Verifique se App.tsx tem a rota `/agendar/:codigo`

### **Horários não aparecem**
- **Causa**: Configurações de working_hours não definidas
- **Solução**: Configure os dias/horários nas Configurações

---

## 🎨 Arquivos Criados/Modificados

### **Novos Arquivos:**
- ✅ `supabase/migrations/20260116000000_add_public_booking_system.sql`
- ✅ `src/types/booking.ts`
- ✅ `src/hooks/usePublicBooking.ts`
- ✅ `src/pages/AgendamentoCliente.tsx`
- ✅ `src/components/BookingSettingsTab.tsx`

### **Arquivos Modificados:**
- ✅ `src/integrations/supabase/types.ts` (tipos atualizados)
- ✅ `src/App.tsx` (nova rota adicionada)
- ✅ `src/pages/Configuracoes.tsx` (nova aba adicionada)

---

## 💡 Funcionalidades Futuras (Sugestões)

### **Fase 2 - Melhorias:**
- [ ] Confirmação automática por WhatsApp
- [ ] Cliente pode cancelar/reagendar sozinho
- [ ] Histórico completo de agendamentos do cliente
- [ ] Avaliações/feedback após atendimento

### **Fase 3 - Avançado:**
- [ ] Pagamento online (PIX, cartão)
- [ ] Lista de espera para horários ocupados
- [ ] Programa de fidelidade
- [ ] Notificações push para clientes

---

## 📞 Suporte

Se tiver dúvidas ou encontrar problemas:
1. Verifique se a migration foi aplicada
2. Confira os logs do console do navegador (F12)
3. Verifique as políticas RLS no Supabase

---

## ✅ Checklist de Implementação

- [x] Migration SQL criada
- [x] Tipos TypeScript atualizados
- [x] Hooks de agendamento criados
- [x] Página pública de agendamento
- [x] Rota adicionada no App
- [x] Interface de configuração criada
- [ ] **Migration aplicada no Supabase** ← VOCÊ PRECISA FAZER ISSO!
- [ ] **Testado com cliente real**

---

**Pronto para usar! 🎉**

Agora é só aplicar a migration no Supabase e começar a testar!


