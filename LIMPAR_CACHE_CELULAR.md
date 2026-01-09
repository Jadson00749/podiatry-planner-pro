# 🔄 Como Limpar Cache no Celular

## ⚠️ Problema: Mudanças não aparecem no celular

Isso acontece porque o navegador do celular está usando versões antigas em cache.

## ✅ Solução Rápida

### **Android (Chrome)**

1. Abra o Chrome
2. Vá no site do PodoAgenda
3. Toque nos **3 pontinhos** (menu) no canto superior direito
4. Toque em **"Configurações"**
5. Toque em **"Privacidade e segurança"**
6. Toque em **"Limpar dados de navegação"**
7. Marque:
   - ✅ **Imagens e arquivos em cache**
   - ✅ **Cookies e dados de sites**
8. Toque em **"Limpar dados"**

**OU método mais rápido:**
1. Abra o site
2. Toque nos **3 pontinhos**
3. Toque em **"Informações do site"**
4. Toque em **"Limpar e redefinir"**
5. Confirme

### **iPhone (Safari)**

1. Vá em **Configurações** do iPhone
2. Toque em **Safari**
3. Role até **"Limpar histórico e dados do site"**
4. Toque e confirme

**OU método mais rápido:**
1. Abra o site no Safari
2. Toque no ícone **"aA"** na barra de endereço
3. Toque em **"Configurações do site"**
4. Toque em **"Limpar dados do site"**

## 🔧 Se ainda não funcionar

### Desinstalar PWA (se instalou)

**Android:**
1. Vá em **Configurações** → **Apps**
2. Encontre **"PodoAgenda"**
3. Toque em **"Desinstalar"**
4. Acesse o site novamente pelo navegador
5. Reinstale o PWA se quiser

**iPhone:**
1. Toque e segure o ícone do app na tela inicial
2. Toque em **"Remover App"**
3. Acesse o site novamente pelo navegador
4. Adicione à tela inicial novamente se quiser

## 🚀 Após limpar cache

1. Feche completamente o navegador
2. Abra novamente
3. Acesse o site
4. As mudanças devem aparecer agora!

## 💡 Dica

Sempre que fizer deploy de mudanças importantes:
- Incremente a versão no `sw.js` (ex: v1 → v2 → v3)
- Isso força o navegador a atualizar o Service Worker

