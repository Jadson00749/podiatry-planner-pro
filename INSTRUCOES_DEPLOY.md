# 📦 Instruções de Deploy - Hostinger

## Passo a Passo

### 1. Build do Projeto
```bash
npm run build
```

### 2. Verificar Arquivos na Pasta `dist/`
Após o build, verifique se a pasta `dist/` contém:
- ✅ `index.html`
- ✅ `sw.js` (Service Worker)
- ✅ `manifest.json`
- ✅ `favicon.svg` ou `favicon.ico`
- ✅ Pasta `assets/` (com JS e CSS)

### 3. Copiar para Hostinger
1. Acesse o **Gerenciador de Arquivos** da Hostinger
2. Vá para a pasta `public_html` (ou a pasta raiz do seu domínio)
3. **Delete tudo** que está lá (ou faça backup antes)
4. **Copie TUDO** de dentro da pasta `dist/` para `public_html/`

### 4. Upload do `.htaccess`
1. Copie o arquivo `.htaccess` da pasta `public/` para `public_html/`
2. Isso é importante para:
   - Service Worker funcionar
   - SPA (Single Page App) funcionar
   - Cache correto

### 5. Limpar Cache do Navegador
**IMPORTANTE:** Após fazer deploy, limpe o cache:

#### No Computador:
- **Chrome/Edge:** `Ctrl + Shift + Delete` → Limpar cache
- **Firefox:** `Ctrl + Shift + Delete` → Limpar cache
- Ou: `Ctrl + F5` para recarregar forçando cache

#### No Celular:
- **Chrome Android:** Configurações → Privacidade → Limpar dados de navegação
- **Safari iOS:** Configurações → Safari → Limpar histórico e dados do site

### 6. Verificar Service Worker
1. Abra o site no navegador
2. Abra o **Console do Desenvolvedor** (F12)
3. Vá em **Application** → **Service Workers**
4. Deve aparecer `sw.js` registrado

### 7. Testar Notificações
1. Vá em **Configurações**
2. Ative "Notificações Push no Celular"
3. Clique em **"Testar"**
4. Deve aparecer notificação na barra

## ⚠️ Problemas Comuns

### Problema: Não aparece atualizações no celular
**Solução:**
1. Limpe o cache do navegador no celular
2. Desinstale o PWA se já instalou (Configurações → Apps → PodoAgenda → Desinstalar)
3. Acesse o site novamente
4. Reinstale o PWA

### Problema: Service Worker não registra
**Solução:**
1. Verifique se `sw.js` está na raiz do `public_html/`
2. Verifique se o `.htaccess` está configurado
3. Verifique se está usando HTTPS (obrigatório para Service Worker)

### Problema: Erro ao fazer logout
**Solução:**
- Já foi corrigido no código
- Faça novo build e deploy

## ✅ Checklist Final

- [ ] Build feito (`npm run build`)
- [ ] Todos os arquivos de `dist/` copiados para `public_html/`
- [ ] `.htaccess` copiado para `public_html/`
- [ ] Cache do navegador limpo
- [ ] Service Worker registrado (verificar no Console)
- [ ] Notificações testadas

