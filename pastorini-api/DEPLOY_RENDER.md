# 🚀 Guia Completo: Deploy PastoriniAPI no Render

Este guia passo a passo vai te ajudar a fazer o deploy da PastoriniAPI no Render.com com PostgreSQL para persistência automática de sessão.

## 📋 Checklist Pré-Deploy

- [x] LICENSE_KEY obtida: `1446F58B-3AF36623-12A181A2-34CECC23`
- [ ] Conta no Render.com criada
- [ ] Repositório GitHub preparado (ou vamos fazer deploy manual)

---

## 🗄️ Passo 1: Criar Banco PostgreSQL

1. Acesse [https://dashboard.render.com/](https://dashboard.render.com/)
2. Faça login (ou crie conta gratuita)
3. Clique no botão **"New +"** (canto superior direito)
4. Selecione **"PostgreSQL"**

### Configurações do Banco:

- **Name**: `pastorini-api-db`
- **Database**: `pastorini_api` (ou deixe padrão)
- **User**: `pastorini` (ou deixe padrão)
- **Region**: `Oregon` (ou escolha a mais próxima)
- **PostgreSQL Version**: Deixe a mais recente
- **Plan**: `Free` (gratuito)

5. Clique em **"Create Database"**

### ⚠️ IMPORTANTE: Anotar Credenciais

Após criar, você verá as credenciais. **ANOTE TUDO**:

```
Internal Database URL: postgres://user:pass@host:5432/dbname
External Database URL: postgres://user:pass@host:5432/dbname

Host: dpg-xxxxx-a.oregon-postgres.render.com
Port: 5432
Database: pastorini_api
User: pastorini
Password: xxxxxxxx
```

**Guarde essas informações!** Você vai precisar no próximo passo.

---

## 🌐 Passo 2: Criar Web Service

1. No Render Dashboard, clique em **"New +"** novamente
2. Selecione **"Web Service"**

### Opção A: Deploy via GitHub (Recomendado)

1. Conecte seu repositório GitHub
2. Selecione o repositório `podiatry-planner-pro`
3. Configure:
   - **Name**: `pastorini-api`
   - **Region**: `Oregon` (mesma do PostgreSQL)
   - **Branch**: `main` (ou sua branch)
   - **Root Directory**: `pastorini-api`
   - **Runtime**: `Docker`
   - **Build Command**: (deixe vazio)
   - **Start Command**: (deixe vazio)

### Opção B: Deploy Manual (Sem GitHub)

1. Selecione **"Deploy without Git"**
2. Faça upload dos arquivos da pasta `pastorini-api`
3. Configure:
   - **Name**: `pastorini-api`
   - **Runtime**: `Docker`

---

## ⚙️ Passo 3: Configurar Variáveis de Ambiente

No Render, na página do serviço, vá em **"Environment"** e adicione:

### Variáveis Obrigatórias:

```env
STORAGE_TYPE=postgres
POSTGRES_HOST=dpg-xxxxx-a.oregon-postgres.render.com
POSTGRES_PORT=5432
POSTGRES_DB=pastorini_api
POSTGRES_USER=pastorini
POSTGRES_PASSWORD=sua_senha_do_banco
POSTGRES_SSL=true
LICENSE_KEY=1446F58B-3AF36623-12A181A2-34CECC23
LICENSE_ADMIN_URL=https://padmin.intrategica.com.br/
PORT=3000
PANEL_API_KEY=SUA_SENHA_FORTE_AQUI
NODE_ENV=production
```

### 📝 Como adicionar cada variável:

1. Clique em **"Add Environment Variable"**
2. **Key**: `STORAGE_TYPE`
3. **Value**: `postgres`
4. Clique em **"Save"**
5. Repita para todas as variáveis acima

**Substitua:**
- `POSTGRES_HOST`: Host do banco que você anotou
- `POSTGRES_PASSWORD`: Senha do banco que você anotou
- `POSTGRES_USER`: Usuário do banco que você anotou
- `POSTGRES_DB`: Nome do banco (geralmente `pastorini_api`)
- `PANEL_API_KEY`: Crie uma senha forte (ex: `MinhaSenh@F0rt3!2024`)

---

## 🚀 Passo 4: Fazer Deploy

1. Clique em **"Create Web Service"** (ou **"Save Changes"** se já criou)
2. Aguarde o build completar (pode levar 5-10 minutos)
3. Anote a URL do serviço (ex: `https://pastorini-api.onrender.com`)

### ✅ Verificar se está funcionando:

1. Acesse a URL do serviço no navegador
2. Você deve ver o painel da PastoriniAPI
3. Se pedir senha, use a `PANEL_API_KEY` que você configurou

---

## 📱 Passo 5: Criar Instância do WhatsApp

### Via Painel Web:

1. Acesse: `https://sua-url.onrender.com`
2. Faça login com a `PANEL_API_KEY`
3. Vá em **"Instâncias"** ou **"Instances"**
4. Clique em **"Criar Nova Instância"** ou **"New Instance"**
5. Dê um nome: `podoagenda`
6. Escaneie o QR Code com seu WhatsApp
7. Aguarde conectar

### Via API (Alternativa):

```bash
# Criar instância
curl -X POST https://sua-url.onrender.com/api/instances \
  -H "Content-Type: application/json" \
  -d '{
    "name": "podoagenda"
  }'

# Obter QR Code
curl https://sua-url.onrender.com/api/instances/podoagenda/qr

# Ver status
curl https://sua-url.onrender.com/api/instances/podoagenda/status
```

---

## ✅ Verificar Persistência de Sessão

### Teste de Reconexão:

1. **Conecte o WhatsApp** (escaneie QR Code)
2. **Pare o serviço** no Render (Settings → Suspend)
3. **Aguarde 1 minuto**
4. **Inicie o serviço** novamente (Settings → Resume)
5. **Verifique**: A instância deve reconectar automaticamente sem precisar de QR Code!

### Como verificar:

```bash
# Ver status da instância
curl https://sua-url.onrender.com/api/instances/podoagenda/status
```

Se retornar `"status": "connected"`, está funcionando! 🎉

---

## 🔗 Próximos Passos

Agora que a API está rodando, você precisa:

1. **Anotar a URL da API**: `https://sua-url.onrender.com`
2. **Anotar o nome da instância**: `podoagenda` (ou o que você criou)
3. **Atualizar as Edge Functions** do Supabase para usar essa URL

---

## 🐛 Troubleshooting

### Erro: "Cannot connect to PostgreSQL"

**Solução:**
- Verifique se `POSTGRES_SSL=true`
- Use a `Internal Database URL` se disponível
- Confirme que o banco está na mesma região do serviço

### Erro: "License key invalid"

**Solução:**
- Verifique se a `LICENSE_KEY` está correta
- Confirme que `LICENSE_ADMIN_URL` está configurado

### Serviço não inicia

**Solução:**
- Veja os logs no Render Dashboard → Logs
- Verifique se todas as variáveis de ambiente estão configuradas
- Confirme que o Dockerfile está correto

### Sessão não persiste

**Solução:**
- Confirme que `STORAGE_TYPE=postgres`
- Verifique se as credenciais do PostgreSQL estão corretas
- Veja os logs para erros de conexão com o banco

---

## 📚 Recursos

- [Render Documentation](https://render.com/docs)
- [PastoriniAPI GitHub](https://github.com/JordanMenezes/PastoriniAPI)
- [PostgreSQL no Render](https://render.com/docs/databases)

---

**Pronto! Sua API está configurada e pronta para uso! 🚀**

