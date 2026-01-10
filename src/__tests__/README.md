# Testes Automatizados - PodoAgenda

## 📋 Visão Geral

Este projeto utiliza **Vitest** e **React Testing Library** para testes automatizados.

## 🚀 Como Executar

```bash
# Executar testes em modo watch (desenvolvimento)
npm test

# Executar testes uma vez
npm run test:run

# Executar testes com interface visual
npm run test:ui

# Executar testes com cobertura
npm run test:coverage
```

## 📁 Estrutura de Testes

```
src/
├── __tests__/
│   ├── lib/              # Testes de funções utilitárias
│   │   ├── phone.test.ts
│   │   ├── cnpj.test.ts
│   │   └── utils.test.ts
│   ├── components/       # Testes de componentes React
│   │   └── ui/
│   │       └── button.test.tsx
│   └── utils/           # Testes de utilitários
│       └── backup.test.ts
└── test/
    └── setup.ts         # Configuração global dos testes
```

## ✅ O que está sendo testado

### Funções Utilitárias (59 testes)
- ✅ `formatPhone` - 8 testes
- ✅ `formatCNPJ` - 7 testes
- ✅ `formatWhatsApp` - 10 testes
- ✅ `cn` (utils) - 7 testes
- ✅ `holidays` - 13 testes
- ✅ `calendar` - 14 testes

### Hooks Customizados (15 testes)
- ✅ `useClients` - 5 testes
- ✅ `useAppointments` - 3 testes
- ✅ `useProcedures` - 4 testes
- ✅ `use-mobile` - 3 testes

### Componentes UI (28 testes)
- ✅ `Button` - 6 testes
- ✅ `Input` - 7 testes
- ✅ `Textarea` - 7 testes
- ✅ `ImageUpload` - 7 testes
- ✅ `GlobalSearch` - 1 teste

### Funções de Exportação (29 testes)
- ✅ `backup` - 7 testes
- ✅ `exportClients` - 6 testes
- ✅ `exportFinancial` - 8 testes
- ✅ `exportAppointments` - 5 testes
- ✅ `exportDashboard` - 3 testes

## 📊 Cobertura Atual

- **135 testes** passando ✅
- **20 arquivos de teste**
- **100% de taxa de sucesso**
- Cobertura completa de funções críticas, hooks, componentes e exportações

📄 **Ver relatório detalhado**: [TESTES_RESUMO.md](./TESTES_RESUMO.md)

## ✅ Status: 100% dos Testes Passando!

Todos os testes críticos estão implementados e passando. O sistema está **100% testável**.

### Próximos Passos (Opcional)
- [ ] Testes E2E com Cypress para fluxos completos
- [ ] Testes para páginas principais (Dashboard, Agenda, Clientes)
- [ ] Testes para componentes complexos (OnboardingTour, NewAppointmentForm)
- [ ] Testes de acessibilidade (WCAG)
- [ ] Testes de performance

## 📝 Convenções

1. **Nomenclatura**: `*.test.ts` ou `*.test.tsx`
2. **Estrutura**: Usar `describe` para agrupar testes relacionados
3. **Asserções**: Usar matchers do `@testing-library/jest-dom`
4. **Isolamento**: Cada teste deve ser independente

## 🔧 Configuração

A configuração do Vitest está em `vite.config.ts`:
- Ambiente: `jsdom` (simula DOM do navegador)
- Setup: `src/test/setup.ts`
- Aliases: `@/` aponta para `src/`

## 💡 Dicas

- Use `screen.getByRole()` para buscar elementos (melhor prática)
- Use `userEvent` para simular interações do usuário
- Evite testar detalhes de implementação
- Foque em testar comportamento, não implementação

