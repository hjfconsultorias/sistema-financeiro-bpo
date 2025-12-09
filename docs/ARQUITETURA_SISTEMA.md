# Arquitetura do Sistema - BPO EK v1.0

**Autor:** Manus AI  
**Data:** 05 de dezembro de 2024  
**Versão:** 1.0

---

## 📐 Visão Geral da Arquitetura

O sistema BPO EK é uma aplicação web full-stack moderna construída com tecnologias de ponta, seguindo os princípios de **arquitetura em camadas**, **type-safety end-to-end** e **API-first design**.

### Stack Tecnológico

**Frontend:**
- React 19 (biblioteca UI)
- Tailwind CSS 4 (estilização)
- Wouter (roteamento)
- TanStack Query (gerenciamento de estado)
- shadcn/ui (componentes)

**Backend:**
- Node.js 22
- Express 4 (servidor HTTP)
- tRPC 11 (API type-safe)
- Drizzle ORM (banco de dados)

**Banco de Dados:**
- MySQL 8.0+ / TiDB Cloud
- 11 tabelas principais
- Relacionamentos complexos

**Autenticação:**
- Manus OAuth 2.0
- JWT (JSON Web Tokens)
- Cookies HTTP-only

---

## 🏗️ Arquitetura em Camadas

```
┌─────────────────────────────────────────┐
│         CAMADA DE APRESENTAÇÃO          │
│  (React Components + Tailwind CSS)     │
│  - Pages, Components, Hooks             │
└───────────────┬─────────────────────────┘
                │
                │ tRPC Client
                │
┌───────────────▼─────────────────────────┐
│         CAMADA DE API (tRPC)            │
│  - Routers, Procedures, Middleware      │
│  - Validação de entrada (Zod)          │
│  - Autenticação e Autorização          │
└───────────────┬─────────────────────────┘
                │
                │ Drizzle ORM
                │
┌───────────────▼─────────────────────────┐
│      CAMADA DE DADOS (Database)         │
│  - MySQL/TiDB                           │
│  - Schema Drizzle                       │
│  - Migrations                           │
└─────────────────────────────────────────┘
```

---

## 📂 Estrutura de Diretórios

```
sistema-financeiro/
├── client/                    # Frontend React
│   ├── public/               # Assets estáticos
│   └── src/
│       ├── components/       # Componentes reutilizáveis
│       │   ├── ui/          # shadcn/ui components
│       │   ├── DashboardLayout.tsx
│       │   ├── ImportExportCSV.tsx
│       │   └── ...
│       ├── contexts/         # React Contexts
│       │   └── AuthContext.tsx
│       ├── hooks/            # Custom React Hooks
│       │   ├── useAuth.ts
│       │   └── usePermissions.ts
│       ├── lib/              # Utilitários
│       │   └── trpc.ts      # Cliente tRPC
│       ├── pages/            # Páginas da aplicação
│       │   ├── Home.tsx
│       │   ├── Login.tsx
│       │   ├── ModuleSelection.tsx
│       │   ├── Companies.tsx
│       │   ├── CostCenters.tsx
│       │   ├── Clients.tsx
│       │   ├── Suppliers.tsx
│       │   ├── AccountsPayable.tsx
│       │   ├── AccountsReceivable.tsx
│       │   ├── DailyRevenues.tsx
│       │   └── Categories.tsx
│       ├── App.tsx           # Roteamento principal
│       ├── main.tsx          # Entry point
│       └── index.css         # Estilos globais
│
├── server/                    # Backend Node.js
│   ├── _core/                # Framework interno
│   │   ├── context.ts       # Contexto tRPC
│   │   ├── env.ts           # Variáveis de ambiente
│   │   ├── llm.ts           # Integração LLM
│   │   ├── oauth.ts         # Autenticação OAuth
│   │   └── ...
│   ├── db.ts                 # Query helpers
│   ├── routers.ts            # tRPC routers
│   ├── permissions.ts        # Sistema de permissões
│   └── *.test.ts             # Testes Vitest
│
├── drizzle/                   # Schema e migrações
│   ├── schema.ts             # Definição das tabelas
│   └── migrations/           # Migrações SQL
│
├── shared/                    # Código compartilhado
│   ├── constants.ts          # Constantes globais
│   └── types.ts              # Tipos TypeScript
│
├── storage/                   # Helpers S3
│   └── index.ts
│
├── scripts/                   # Scripts utilitários
│   └── seed-database.mjs
│
├── package.json              # Dependências
├── tsconfig.json             # Configuração TypeScript
├── vite.config.ts            # Configuração Vite
└── drizzle.config.ts         # Configuração Drizzle
```

---

## 🔄 Fluxo de Dados

### 1. Requisição do Cliente

```typescript
// client/src/pages/Clients.tsx
const { data: clients } = trpc.clients.list.useQuery();
```

### 2. tRPC Router (Backend)

```typescript
// server/routers.ts
clients: {
  list: protectedProcedure
    .query(async ({ ctx }) => {
      return await getAllClients();
    }),
}
```

### 3. Database Helper

```typescript
// server/db.ts
export async function getAllClients() {
  return await db.select().from(clients);
}
```

### 4. Resposta ao Cliente

O tRPC automaticamente serializa a resposta (incluindo Dates) e envia de volta ao cliente com **type-safety completo**.

---

## 🔐 Sistema de Autenticação

### Fluxo OAuth 2.0

```
┌─────────┐                ┌──────────┐                ┌─────────┐
│ Cliente │                │  Server  │                │  Manus  │
│ (React) │                │ (Express)│                │  OAuth  │
└────┬────┘                └────┬─────┘                └────┬────┘
     │                          │                           │
     │ 1. Clique "Entrar"       │                           │
     ├─────────────────────────>│                           │
     │                          │                           │
     │ 2. Redirect para OAuth   │                           │
     │<─────────────────────────┤                           │
     │                          │                           │
     │ 3. Login no Manus        │                           │
     ├──────────────────────────┼──────────────────────────>│
     │                          │                           │
     │ 4. Callback com code     │                           │
     │<─────────────────────────┼───────────────────────────┤
     │                          │                           │
     │ 5. Trocar code por token │                           │
     ├─────────────────────────>│──────────────────────────>│
     │                          │                           │
     │ 6. JWT + Cookie          │                           │
     │<─────────────────────────┤<──────────────────────────┤
     │                          │                           │
     │ 7. Requisições autenticadas                          │
     ├─────────────────────────>│                           │
     │   (Cookie HTTP-only)     │                           │
     │                          │                           │
```

### Middleware de Autenticação

```typescript
// server/_core/context.ts
export async function createContext({ req, res }) {
  const token = req.cookies.session;
  
  if (!token) {
    return { user: null };
  }
  
  const decoded = jwt.verify(token, JWT_SECRET);
  const user = await getSystemUserById(decoded.userId);
  
  return { user };
}
```

### Procedures Protegidos

```typescript
// server/routers.ts
const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
```

---

## 🛡️ Sistema de Permissões Granulares

### Modelo de Permissões

Cada usuário pode ter permissões específicas em cada módulo:

| Permissão | Descrição | Exemplo |
|-----------|-----------|---------|
| `canView` | Visualizar dados | Ver lista de clientes |
| `canCreate` | Criar novos registros | Adicionar novo cliente |
| `canEdit` | Editar registros existentes | Atualizar dados do cliente |
| `canDelete` | Excluir registros | Remover cliente |
| `canApprove` | Aprovar operações | Aprovar pagamento |
| `canExport` | Exportar dados | Baixar Excel de clientes |

### Verificação no Backend

```typescript
// server/permissions.ts
export async function checkPermission(
  userId: number,
  moduleId: number,
  action: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export'
): Promise<boolean> {
  // Administradores têm todas as permissões
  const user = await getSystemUserById(userId);
  if (user?.profile === 'admin') {
    return true;
  }
  
  // Buscar permissão específica
  const permission = await getUserModulePermissions(userId, moduleId);
  return permission?.[`can${capitalize(action)}`] === true;
}
```

### Verificação no Frontend

```typescript
// client/src/hooks/usePermissions.ts
export function usePermissions(moduleId: number) {
  const { user } = useAuth();
  const { data: permissions } = trpc.permissions.getMyPermissions.useQuery(
    { moduleId },
    { enabled: !!user }
  );
  
  return {
    canCreate: permissions?.canCreate ?? false,
    canEdit: permissions?.canEdit ?? false,
    canDelete: permissions?.canDelete ?? false,
    canExport: permissions?.canExport ?? false,
    canApprove: permissions?.canApprove ?? false,
  };
}
```

### Uso nos Componentes

```typescript
// client/src/pages/Clients.tsx
const { canCreate, canEdit, canDelete, canExport } = usePermissions(MODULE_IDS.FINANCEIRO);

return (
  <>
    {canCreate && <Button>Novo Cliente</Button>}
    {canExport && <Button>Exportar</Button>}
    
    {clients.map(client => (
      <div key={client.id}>
        {client.name}
        {canEdit && <Button>Editar</Button>}
        {canDelete && <Button>Excluir</Button>}
      </div>
    ))}
  </>
);
```

---

## 🗄️ Modelo de Dados

### Tabelas Principais

#### 1. system_users
Armazena usuários do sistema com autenticação local.

```typescript
{
  id: number;
  email: string;           // Único
  passwordHash: string;    // Bcrypt hash
  name: string;
  profile: 'admin' | 'user' | 'viewer';
  createdAt: Date;
  updatedAt: Date;
}
```

#### 2. modules
Define os módulos disponíveis no sistema.

```typescript
{
  id: number;
  name: string;            // Ex: "FINANCEIRO"
  description: string;
  icon: string;            // Nome do ícone Lucide
  isActive: boolean;       // Se está disponível
  displayOrder: number;    // Ordem de exibição
  createdAt: Date;
}
```

#### 3. user_module_permissions
Permissões granulares por usuário e módulo.

```typescript
{
  id: number;
  userId: number;          // FK -> system_users
  moduleId: number;        // FK -> modules
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canExport: boolean;
  createdAt: Date;
}
```

#### 4. companies
Empresas do grupo.

```typescript
{
  id: number;
  name: string;
  cnpj: string;            // Único
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 5. cost_centers (Eventos)
Centros de custo / Eventos.

```typescript
{
  id: number;
  companyId: number;       // FK -> companies
  name: string;
  code: string;            // Único
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 6. clients (Clientes/Shoppings)
Clientes do sistema.

```typescript
{
  id: number;
  name: string;
  cnpj: string;            // Único
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 7. suppliers (Fornecedores)
Fornecedores cadastrados.

```typescript
{
  id: number;
  name: string;
  cnpj: string;            // Único
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 8. categories
Categorias financeiras.

```typescript
{
  id: number;
  name: string;            // Único
  description: string | null;
  type: 'receita' | 'despesa';
  createdAt: Date;
  updatedAt: Date;
}
```

#### 9. accounts_payable
Contas a pagar.

```typescript
{
  id: number;
  companyId: number;       // FK -> companies
  costCenterId: number;    // FK -> cost_centers
  supplierId: number;      // FK -> suppliers
  categoryId: number;      // FK -> categories
  description: string;
  amount: number;          // Decimal
  dueDate: Date;
  paymentDate: Date | null;
  status: 'pendente' | 'pago' | 'vencido';
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 10. accounts_receivable
Contas a receber.

```typescript
{
  id: number;
  companyId: number;       // FK -> companies
  costCenterId: number;    // FK -> cost_centers
  clientId: number;        // FK -> clients
  categoryId: number;      // FK -> categories
  description: string;
  amount: number;          // Decimal
  dueDate: Date;
  receiptDate: Date | null;
  status: 'pendente' | 'recebido' | 'vencido';
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 11. daily_revenues
Receitas diárias.

```typescript
{
  id: number;
  companyId: number;       // FK -> companies
  costCenterId: number;    // FK -> cost_centers
  clientId: number;        // FK -> clients
  categoryId: number;      // FK -> categories
  revenueDate: Date;
  amount: number;          // Decimal
  description: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🎨 Padrões de Design

### 1. Type-Safe API com tRPC

Todos os endpoints são **type-safe end-to-end**. O TypeScript garante que o frontend e backend estejam sempre sincronizados.

```typescript
// Backend define o contrato
clients: {
  list: protectedProcedure.query(() => getAllClients()),
}

// Frontend usa com autocomplete completo
const { data } = trpc.clients.list.useQuery();
//     ^? Client[]
```

### 2. Optimistic Updates

Para melhor UX, usamos updates otimistas em operações de lista:

```typescript
const deleteMutation = trpc.clients.delete.useMutation({
  onMutate: async ({ id }) => {
    // Cancelar queries em andamento
    await utils.clients.list.cancel();
    
    // Snapshot do estado atual
    const previous = utils.clients.list.getData();
    
    // Update otimista
    utils.clients.list.setData(undefined, (old) =>
      old?.filter((c) => c.id !== id)
    );
    
    return { previous };
  },
  onError: (err, variables, context) => {
    // Rollback em caso de erro
    utils.clients.list.setData(undefined, context?.previous);
  },
});
```

### 3. Component Composition

Componentes são compostos de forma hierárquica e reutilizável:

```
DashboardLayout
├── Sidebar
│   ├── Logo
│   ├── NavItems
│   └── UserProfile
└── MainContent
    ├── Header
    ├── PageContent
    │   ├── DataTable
    │   │   ├── TableHeader
    │   │   ├── TableBody
    │   │   └── TablePagination
    │   └── ActionButtons
    └── Footer
```

### 4. Custom Hooks

Lógica complexa é extraída para hooks reutilizáveis:

- `useAuth()` - Estado de autenticação
- `usePermissions(moduleId)` - Permissões do usuário
- `useDebounce(value, delay)` - Debouncing
- `useLocalStorage(key)` - Persistência local

---

## 🚀 Performance

### Otimizações Implementadas

1. **Code Splitting:** Páginas carregadas sob demanda
2. **React Query Cache:** Dados em cache com invalidação inteligente
3. **Debouncing:** Busca e filtros com delay
4. **Lazy Loading:** Componentes pesados carregados apenas quando necessário
5. **Memoization:** `useMemo` e `useCallback` em componentes críticos

---

## 🧪 Testes

### Estrutura de Testes

```
server/
├── auth.logout.test.ts      # Teste de referência
├── permissions.test.ts      # Testes de permissões
└── routers.test.ts          # Testes de endpoints
```

### Executar Testes

```bash
pnpm test                    # Rodar todos os testes
pnpm test:watch             # Modo watch
pnpm test:coverage          # Com cobertura
```

---

## 📦 Deploy

### Ambiente de Desenvolvimento

```bash
pnpm dev
```

Servidor disponível em `http://localhost:3000`

### Ambiente de Produção

```bash
# Build
pnpm build

# Start
pnpm start
```

### Deploy no Manus

O Manus cuida automaticamente de:
- Build do frontend
- Inicialização do backend
- Configuração do banco de dados
- SSL/HTTPS
- CDN para assets estáticos

---

## 🔧 Manutenção

### Adicionar Nova Tabela

1. Editar `drizzle/schema.ts`
2. Executar `pnpm db:push`
3. Criar helpers em `server/db.ts`
4. Adicionar procedures em `server/routers.ts`
5. Criar página/componente no frontend

### Adicionar Novo Módulo

1. Inserir registro na tabela `modules`
2. Criar página em `client/src/pages/`
3. Adicionar rota em `client/src/App.tsx`
4. Configurar permissões padrão

---

**Documento criado por:** Manus AI  
**Última atualização:** 05/12/2024  
**Versão:** 1.0
