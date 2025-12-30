# 🦶 PodoAgenda

Sistema completo de gestão para clínicas de podologia, desenvolvido com as tecnologias mais modernas do mercado.

![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC?style=flat&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-Latest-3ECF8E?style=flat&logo=supabase)

## 📋 Sobre o Projeto

**PodoAgenda** é uma solução profissional para gestão de clínicas de podologia, oferecendo controle completo sobre agendamentos, clientes, procedimentos e finanças. O sistema foi desenvolvido com foco em usabilidade, performance e segurança.

## ✨ Funcionalidades

### 🔐 Autenticação e Segurança
- Sistema de autenticação completo com Supabase
- Rotas protegidas e controle de acesso
- Row Level Security (RLS) no banco de dados

### 📅 Gestão de Agendamentos
- Agenda inteligente com visualizações diária, semanal e mensal
- Formulário de agendamento com validações
- Status de agendamento (agendado, concluído, cancelado, não compareceu)
- Mini calendário interativo

### 👥 Gestão de Clientes
- CRUD completo de clientes
- Histórico de atendimentos
- Dados de contato (telefone, WhatsApp, email)
- Busca e filtros avançados

### 💰 Controle Financeiro
- Gestão de pagamentos (pendente, pago, parcial)
- Controle de valores por procedimento
- Dashboard com estatísticas financeiras

### 📱 Integração WhatsApp
- Funções para envio de lembretes formatados
- Mensagens de confirmação de agendamento
- Formatação automática para números brasileiros

### 🎨 Interface Moderna
- Design responsivo e intuitivo
- Tema claro/escuro com persistência
- Componentes reutilizáveis com shadcn/ui
- Animações suaves e feedback visual

## 🚀 Tecnologias

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Estilização**: TailwindCSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth)
- **Gerenciamento de Estado**: React Query + Context API
- **Roteamento**: React Router v6
- **Validação**: Zod + React Hook Form

## 📦 Instalação

```bash
# Clone o repositório
git clone https://github.com/Jadson00749/podiatry-planner-app.git

# Entre no diretório
cd podiatry-planner-app

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
4. Configure as variáveis de ambiente no arquivo `.env`:

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
```

## 🗄️ Estrutura do Banco de Dados

- **profiles**: Perfis de usuários profissionais
- **clients**: Cadastro de clientes
- **procedures**: Procedimentos disponíveis
- **appointments**: Agendamentos realizados

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

Desenvolvido com 💙 por Jadson Santos © 2024
