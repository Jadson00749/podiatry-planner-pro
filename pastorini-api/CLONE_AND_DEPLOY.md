# 📥 Como Clonar e Fazer Deploy da PastoriniAPI

## Passo 1: Clonar o Repositório

```bash
# Clone o repositório oficial
git clone https://github.com/JordanMenezes/PastoriniAPI.git

# Entre na pasta
cd PastoriniAPI
```

## Passo 2: Copiar Arquivos para o Projeto

Você precisa copiar os arquivos do repositório clonado para a pasta `pastorini-api` do seu projeto:

```bash
# A partir da raiz do seu projeto podiatry-planner-pro
# Copie todos os arquivos do PastoriniAPI para pastorini-api
cp -r PastoriniAPI/* pastorini-api/
```

**OU** faça manualmente:
1. Abra a pasta `PastoriniAPI` que você clonou
2. Copie todos os arquivos (exceto `.git`)
3. Cole na pasta `podiatry-planner-pro/pastorini-api/`

## Passo 3: Arquivos que JÁ Criamos

Nós já criamos estes arquivos na pasta `pastorini-api/`:
- ✅ `Dockerfile` - Para build no Render
- ✅ `render.yaml` - Configuração do Render
- ✅ `env.example` - Exemplo de variáveis de ambiente
- ✅ `README.md` - Documentação
- ✅ `DEPLOY_RENDER.md` - Guia completo de deploy

## Passo 4: Verificar Estrutura

A pasta `pastorini-api/` deve ter:
```
pastorini-api/
├── Dockerfile (criado por nós)
├── render.yaml (criado por nós)
├── env.example (criado por nós)
├── package.json (do repositório)
├── server.ts (do repositório)
├── tsconfig.json (do repositório)
├── ... (outros arquivos do repositório)
```

## Passo 5: Fazer Deploy no Render

Siga o guia em `DEPLOY_RENDER.md` para fazer o deploy completo!

---

**Nota**: Se preferir, você pode fazer o deploy direto do repositório GitHub original no Render, mas precisará configurar as variáveis de ambiente manualmente.

