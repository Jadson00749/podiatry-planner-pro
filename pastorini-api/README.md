# PastoriniAPI - Deploy no Render

Este diretório contém a configuração para deploy da PastoriniAPI no Render.com com PostgreSQL para persistência de sessão.

## 📋 Pré-requisitos

- Conta no Render.com (gratuita)
- LICENSE_KEY da P-API (já obtida: `1446F58B-3AF36623-12A181A2-34CECC23`)

## 🚀 Deploy no Render

### Passo 1: Criar Banco PostgreSQL no Render

1. Acesse [Render Dashboard](https://dashboard.render.com/)
2. Clique em **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `pastorini-api-db`
   - **Database**: `pastorini_api`
   - **User**: `pastorini` (ou deixe o padrão)
   - **Region**: Escolha a mais próxima (ex: Oregon)
   - **Plan**: Free
4. Clique em **"Create Database"**
5. **IMPORTANTE**: Anote as credenciais que aparecerem:
   - `Internal Database URL`
   - `External Database URL`
   - `Host`, `Port`, `Database`, `User`, `Password`

### Passo 2: Criar Web Service no Render

1. No Render Dashboard, clique em **"New +"** → **"Web Service"**
2. Conecte seu repositório GitHub (ou faça deploy manual)
3. Configure:
   - **Name**: `pastorini-api`
   - **Region**: Mesma do PostgreSQL
   - **Branch**: `main` (ou sua branch)
   - **Root Directory**: `pastorini-api`
   - **Runtime**: `Docker` (ou `Node` se preferir)
   - **Build Command**: (deixe vazio se usar Docker)
   - **Start Command**: (deixe vazio se usar Docker)

### Passo 3: Configurar Variáveis de Ambiente

No Render, vá em **Environment** e adicione:

```env
STORAGE_TYPE=postgres
POSTGRES_HOST=seu-host-postgres.render.com
POSTGRES_PORT=5432
POSTGRES_DB=pastorini_api
POSTGRES_USER=seu_usuario
POSTGRES_PASSWORD=sua_senha
POSTGRES_SSL=true
LICENSE_KEY=1446F58B-3AF36623-12A181A2-34CECC23
LICENSE_ADMIN_URL=https://padmin.intrategica.com.br/
PORT=3000
PANEL_API_KEY=sua_senha_do_painel_aqui
NODE_ENV=production
```

**Onde encontrar os valores:**
- `POSTGRES_*`: Vem do banco criado no Passo 1
- `LICENSE_KEY`: Sua chave já obtida
- `PANEL_API_KEY`: Crie uma senha forte para proteger o painel

### Passo 4: Deploy

1. Clique em **"Create Web Service"**
2. Aguarde o build completar
3. Anote a URL do serviço (ex: `https://pastorini-api.onrender.com`)

## 🔗 Acessar o Painel

Após o deploy, acesse:
- **Painel**: `https://sua-url.onrender.com`
- **Documentação**: `https://sua-url.onrender.com/docs.html`
- **API Tester**: `https://sua-url.onrender.com/api-tester.html`

## 📱 Criar Instância do WhatsApp

1. Acesse o painel
2. Vá em **Instâncias** ou use a API:
   ```bash
   POST https://sua-url.onrender.com/api/instances
   {
     "name": "podoagenda"
   }
   ```
3. Obtenha o QR Code:
   ```bash
   GET https://sua-url.onrender.com/api/instances/podoagenda/qr
   ```
4. Escaneie com seu WhatsApp
5. A sessão será salva no PostgreSQL automaticamente!

## ✅ Reconexão Automática

Com `STORAGE_TYPE=postgres`, a sessão é salva no banco. Mesmo que o Render reinicie:
- ✅ A sessão é restaurada automaticamente
- ✅ Não precisa escanear QR Code novamente
- ✅ Reconecta sozinho

## 🔧 Troubleshooting

### Serviço não inicia
- Verifique se todas as variáveis de ambiente estão configuradas
- Verifique os logs no Render Dashboard

### Não conecta ao PostgreSQL
- Verifique se o `POSTGRES_SSL=true`
- Use a `Internal Database URL` se disponível
- Verifique se o banco está na mesma região

### Sessão não persiste
- Confirme que `STORAGE_TYPE=postgres`
- Verifique se as credenciais do PostgreSQL estão corretas
- Veja os logs para erros de conexão

## 📚 Documentação

- [PastoriniAPI GitHub](https://github.com/JordanMenezes/PastoriniAPI)
- [Render Documentation](https://render.com/docs)

