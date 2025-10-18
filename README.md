# Device Evaluation System

Sistema completo de avaliação e gestão de dispositivos desenvolvido com React + TypeScript + Vite.

## 🚀 Características

- **Frontend moderno**: React 18 + TypeScript + Vite
- **UI/UX profissional**: Tailwind CSS + Componentes personalizados
- **Autenticação robusta**: Sistema de login/registro com JWT
- **Gestão de estado**: Context API + Custom Hooks
- **Responsivo**: Mobile-first design
- **Acessibilidade**: Componentes acessíveis
- **Performance**: Lazy loading e otimizações

## 📦 Funcionalidades

### Módulo Público
- **Catálogo de dispositivos** com busca e filtros
- **Detalhes do dispositivo** com especificações
- **Submissão anônima** de dispositivos
- **Rastreamento** por código
- **Página inicial** com informações

### Módulo do Usuário
- **Dashboard personalizado** com estatísticas
- **Gestão de submissões** com histórico
- **Submissão autenticada** mais rápida
- **Perfil do usuário**

### Módulo Administrativo
- **Dashboard administrativo** com métricas
- **Gestão de dispositivos** (CRUD)
- **Avaliação de submissões**
- **Gestão de usuários**
- **Configurações do sistema**

## 🛠️ Tecnologias

- **React 18** - Biblioteca de interface
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS
- **React Router** - Roteamento
- **React Hook Form** - Formulários
- **Zod** - Validação de schemas
- **Axios** - Cliente HTTP
- **Lucide React** - Ícones
- **Date-fns** - Manipulação de datas

## 📋 Pré-requisitos

- Node.js 16+ 
- npm ou yarn
- Backend API rodando na porta 3000

## 🚀 Instalação e Execução

1. **Clone o repositório**
```bash
git clone <repository-url>
cd device-evaluation-system
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
# Crie um arquivo .env.local
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

4. **Execute em modo de desenvolvimento**
```bash
npm run dev
```

5. **Acesse a aplicação**
```
http://localhost:3001
```

## 📝 Scripts Disponíveis

- `npm run dev` - Executa em modo desenvolvimento
- `npm run build` - Build para produção  
- `npm run preview` - Preview do build
- `npm run lint` - Executa o linter

## 🏗️ Estrutura do Projeto

```
src/
├── components/           # Componentes reutilizáveis
│   ├── ui/              # Componentes de interface base
│   ├── layout/          # Componentes de layout
│   ├── forms/           # Formulários
│   └── common/          # Componentes comuns
├── pages/               # Páginas da aplicação
│   ├── public/          # Páginas públicas
│   ├── auth/            # Páginas de autenticação
│   ├── user/            # Páginas do usuário
│   └── admin/           # Páginas administrativas
├── hooks/               # Custom hooks
├── services/            # Serviços de API
├── utils/               # Utilitários e helpers
├── types/               # Definições de tipos
├── styles/              # Estilos globais
├── App.tsx              # Componente raiz
└── main.tsx             # Entry point
```

## 🔐 Autenticação

O sistema implementa autenticação JWT com:
- Login/registro de usuários
- Controle de acesso por roles (user/admin)
- Rotas protegidas
- Refresh automático de tokens

## 📱 Responsividade

- **Mobile First**: Design otimizado para mobile
- **Breakpoints**: sm, md, lg, xl
- **Navegação adaptativa**: Menu mobile/desktop
- **Layouts flexíveis**: Grid e flex responsivos

## 🧪 Boas Práticas

- **TypeScript strict**: Tipagem rigorosa
- **Componentes pequenos**: Single responsibility
- **Custom hooks**: Lógica reutilizável
- **Error boundaries**: Tratamento de erros
- **Loading states**: Estados de carregamento
- **Validação**: Formulários validados
- **Acessibilidade**: ARIA labels e navegação por teclado

## 🚀 Deploy

Para fazer deploy em produção:

```bash
npm run build
```

Os arquivos otimizados estarão na pasta `dist/`.

## 📄 API Integration

O frontend se comunica com a API backend através dos serviços em `src/services/`:

- `auth.service.ts` - Autenticação
- `device.service.ts` - Gestão de dispositivos  
- `submission.service.ts` - Submissões e avaliações

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.
