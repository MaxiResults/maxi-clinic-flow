# Maxi IA - Dashboard Administrativo

Sistema completo de automação WhatsApp para clínicas com dashboard administrativo.

## 🚀 Tecnologias

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Shadcn/ui
- React Router DOM
- Axios
- React Query (TanStack Query)
- Lucide React
- Recharts

## 📋 Funcionalidades

### Autenticação
- Login com email e senha
- Proteção de rotas privadas
- Logout automático em caso de token inválido

### Dashboard
- Cards de estatísticas (Leads, Agendamentos, Conversas, Taxa de Conversão)
- Lista de próximos agendamentos
- Gráfico de leads por origem

### Gestão de Leads
- Listagem completa com filtros e busca
- Status coloridos (Novo, Qualificado, Convertido)
- Modal de detalhes do lead
- Conversão para cliente

### Agendamentos
- Visualização em lista e calendário
- Cards informativos com status
- Opções de reagendar e cancelar
- Filtros por profissional e status

### Conversas
- Interface de chat split (lista + mensagens)
- Histórico completo de conversas
- Indicadores de mensagens não lidas
- Envio de mensagens

### Profissionais
- Grid de profissionais
- Especialidades e status
- Visualização de disponibilidade
- Contador de agendamentos

### Produtos e Serviços
- Tabela completa de produtos
- Categorias e tipos
- Preços e durações
- Status ativo/inativo

## 🎨 Design System

### Cores Principais
- **Primary**: Azul escuro (#1e293b) - Sidebar e elementos principais
- **Background**: Cinza claro (#f8fafc)
- **Cards**: Branco com shadow

### Status Colors
- Novo: Azul
- Qualificado: Amarelo
- Convertido: Verde
- Agendado: Azul
- Confirmado: Verde
- Cancelado: Vermelho
- Concluído: Cinza

## 🔧 Configuração da API

Base URL: `http://localhost:3000/api/v1`

### Endpoints Principais

```typescript
GET    /leads                    - Lista todos os leads
POST   /leads                    - Cria novo lead
PUT    /leads/:id                - Atualiza lead
GET    /agendamentos             - Lista agendamentos
POST   /agendamentos             - Cria agendamento
PUT    /agendamentos/:id         - Atualiza agendamento
GET    /conversas                - Lista conversas ativas
GET    /conversas/:id/historico  - Histórico de mensagens
GET    /profissionais            - Lista profissionais
GET    /produtos                 - Lista produtos/serviços
```

## 🚀 Como usar

### Desenvolvimento

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Deploy

Use o botão "Publish" no Lovable para fazer deploy da aplicação.

## 📦 Estrutura do Projeto

```
src/
├── components/
│   ├── layout/          # Componentes de layout (Sidebar, TopBar, etc)
│   ├── ui/              # Componentes UI (Shadcn)
│   ├── StatCard.tsx     # Card de estatísticas
│   ├── StatusBadge.tsx  # Badge de status customizado
│   ├── LoadingSpinner.tsx
│   └── EmptyState.tsx
├── hooks/
│   ├── useLeads.ts      # Hook para leads
│   ├── useAgendamentos.ts
│   └── useConversas.ts
├── lib/
│   ├── api.ts           # Configuração do Axios
│   └── utils.ts
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Leads.tsx
│   ├── Agendamentos.tsx
│   ├── Conversas.tsx
│   ├── Profissionais.tsx
│   └── Produtos.tsx
└── App.tsx              # Rotas e configuração
```

## 🔐 Autenticação

O sistema usa token JWT armazenado no localStorage. Para fazer login no ambiente de desenvolvimento, use qualquer email e senha. O token será armazenado automaticamente.

## 📱 Responsividade

O sistema é totalmente responsivo com design mobile-first, adaptando-se a diferentes tamanhos de tela.

## 🎯 Próximos Passos

- Implementar calendário interativo nos agendamentos
- Adicionar notificações em tempo real
- Criar dashboard de relatórios
- Implementar upload de arquivos
- Adicionar busca avançada

## 📄 Licença

Este projeto foi desenvolvido com Lovable.
