# 📅 AgendaPro

Sistema completo de gestão de agendamentos para clínicas, salões, consultórios e profissionais autônomos, desenvolvido com as tecnologias mais modernas do mercado.

![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC?style=flat&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-Latest-3ECF8E?style=flat&logo=supabase)

## 📋 Sobre o Projeto

**AgendaPro** é uma solução profissional para gestão de agendamentos, oferecendo controle completo sobre agenda, clientes, procedimentos e finanças. O sistema foi desenvolvido com foco em usabilidade, performance e segurança, sendo ideal para:

- 💇 Salões de beleza e barbearias
- 🦶 Clínicas de podologia e fisioterapia
- 🦷 Consultórios odontológicos
- 💅 Estúdios de manicure e estética
- 🏋️ Personal trainers e academias
- 🐕 Pet shops e veterinários
- 💼 Qualquer negócio que trabalhe com agendamentos

## ✨ Funcionalidades

### 🔐 Autenticação e Segurança
- Sistema de autenticação completo com Supabase
- Login com Google OAuth
- Rate limiting e bloqueio após tentativas falhas
- CAPTCHA de segurança
- Row Level Security (RLS) no banco de dados

### 📅 Gestão de Agendamentos
- Agenda inteligente com visualizações diária, semanal e mensal
- Múltiplos layouts (lista, grid, agrupado por período)
- Formulário de agendamento com validações
- Status de agendamento (agendado, concluído, cancelado, não compareceu)
- Mini calendário interativo
- Filtros avançados por status e pagamento
- Exportação para Excel/PDF

### 👥 Gestão de Clientes
- CRUD completo de clientes
- Upload de fotos dos clientes
- Histórico de atendimentos
- Dados de contato (telefone, WhatsApp, email)
- Busca e filtros avançados
- Anamnese completa
- Visualizações personalizáveis (grid 3/4/6 colunas, agrupado alfabético)

### 💰 Controle Financeiro
- Gestão de pagamentos (pendente, pago, parcial)
- Controle de valores por procedimento
- Dashboard com estatísticas financeiras
- Relatórios de receita mensal
- Gráficos de evolução

### 📱 Integração WhatsApp
- Envio de lembretes formatados
- Mensagens de confirmação de agendamento
- Formatação automática para números brasileiros
- Botões rápidos para contato

### 💼 Planos e Segregação
- 3 planos: Básico (15 dias grátis), Profissional e Premium
- Limites por plano (clientes, procedimentos, exportações)
- Upgrade prompts visuais
- Controle de acesso a features premium

### 🎨 Interface Moderna
- Design responsivo e intuitivo (mobile-first)
- Tema claro/escuro com persistência
- Componentes reutilizáveis com shadcn/ui
- Animações suaves e feedback visual
- PWA (Progressive Web App)

## 🚀 Tecnologias

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Estilização**: TailwindCSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Gerenciamento de Estado**: React Query + Context API
- **Roteamento**: React Router v6
- **Validação**: Zod + React Hook Form
- **Datas**: date-fns
- **Gráficos**: Recharts
- **Exportação**: xlsx + jsPDF

## 📦 Instalação

```bash
# Clone o repositório
git clone https://github.com/Jadson00749/agenda-pro-app.git

# Entre no diretório
cd agenda-pro-app

# Instale as dependências
npm install

# Configure as variáveis de ambiente
# Copie o arquivo .env.example para .env e configure suas credenciais do Supabase

# Inicie o servidor de desenvolvimento
npm run dev
```

## 🔧 Configuração

1. Crie uma conta no [Supabase](https://supabase.com)
2. Crie um novo projeto
3. Execute as migrations do banco de dados (localizado em `/supabase/migrations`)
4. Configure os buckets de storage (avatars, logos)
5. Configure as variáveis de ambiente no arquivo `.env`:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

## 📱 Scripts Disponíveis

```bash
npm run dev          # Inicia o servidor de desenvolvimento
npm run build        # Gera a build de produção
npm run preview      # Preview da build de produção
npm run lint         # Executa o linter
npm run test         # Executa os testes
npm run test:ui      # Interface de testes
```

## 🗄️ Estrutura do Banco de Dados

- **profiles**: Perfis de usuários profissionais
- **clients**: Cadastro de clientes com fotos
- **procedures**: Procedimentos/serviços disponíveis
- **appointments**: Agendamentos realizados
- **anamnesis**: Fichas de anamnese dos clientes
- **login_attempts**: Controle de segurança de login

## 🤝 Contribuindo

Contribuições são sempre bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.

## 📄 Licença

Este projeto está sob a licença MIT.

## 👨‍💻 Autor

**Jadson Santos**

Desenvolvedor Full Stack especializado em soluções modernas e escaláveis.

- GitHub: [@Jadson00749](https://github.com/Jadson00749)
- Email: santosjadson797@hotmail.com

---

Desenvolvido com 💙 por Jadson Santos © 2024-2026
