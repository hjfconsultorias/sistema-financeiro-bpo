import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, decimal, date } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Empresas (CNPJs) - Nível superior da hierarquia
 * Ex: Gestão de Parques (GP1), GP2, etc.
 */
export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // Razão Social
  tradeName: varchar("tradeName", { length: 255 }), // Nome fantasia
  cnpj: varchar("cnpj", { length: 18 }).notNull().unique(), // CNPJ obrigatório e único
  stateRegistration: varchar("stateRegistration", { length: 20 }), // Inscrição Estadual
  municipalRegistration: varchar("municipalRegistration", { length: 20 }), // Inscrição Municipal
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }), // UF
  zipCode: varchar("zipCode", { length: 10 }), // CEP
  active: int("active").default(1).notNull(), // 1 = ativo, 0 = inativo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

/**
 * Eventos (antigo Centro de Custo) - Vinculado a uma Empresa
 * Ex: Galaxia, Fazendinha, Color Park Norte, etc.
 */
export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(), // FK para companies
  name: varchar("name", { length: 255 }).notNull(), // Ex: "Galaxia"
  description: text("description"),
  active: int("active").default(1).notNull(), // 1 = ativo, 0 = inativo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

/**
 * Clientes (Shoppings) - Onde os eventos acontecem
 */
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // Nome do shopping
  cnpj: varchar("cnpj", { length: 18 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  active: int("active").default(1).notNull(), // 1 = ativo, 0 = inativo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Contratos de Eventos em Shoppings
 * Vincula um Evento a um Shopping por um período determinado
 */
export const eventContracts = mysqlTable("event_contracts", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(), // FK para events
  clientId: int("clientId").notNull(), // FK para clients (shopping)
  startDate: date("startDate").notNull(), // Data início do contrato
  endDate: date("endDate"), // Data fim do contrato (null = indeterminado)
  monthlyValue: int("monthlyValue"), // Valor mensal em centavos (opcional)
  notes: text("notes"), // Observações sobre o contrato
  active: int("active").default(1).notNull(), // 1 = ativo, 0 = encerrado
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EventContract = typeof eventContracts.$inferSelect;
export type InsertEventContract = typeof eventContracts.$inferInsert;

/**
 * Fornecedores
 */
export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  cnpjCpf: varchar("cnpjCpf", { length: 18 }).notNull(), // CNPJ ou CPF obrigatório
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  pix: varchar("pix", { length: 255 }), // Chave PIX (importante mas não obrigatório)
  notes: varchar("notes", { length: 200 }), // Observação limitada a 200 caracteres
  active: int("active").default(1).notNull(), // 1 = ativo, 0 = inativo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

/**
 * Contas a Pagar
 * Vinculado a Evento (não mais a Centro de Custo genérico)
 */
export const accountsPayable = mysqlTable("accounts_payable", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(), // FK para events (mudou de costCenterId)
  supplierId: int("supplierId"), // FK para suppliers (opcional)
  categoryId: int("categoryId"), // FK para categories (classificação contábil)
  subcategoryId: int("subcategoryId"), // FK para subcategories (classificação contábil)
  description: text("description").notNull(),
  amount: int("amount").notNull(), // Valor em centavos
  dueDate: date("dueDate").notNull(),
  paymentDate: date("paymentDate"),
  status: mysqlEnum("status", ["pending", "paid", "overdue"]).default("pending").notNull(),
  notes: text("notes"),
  createdBy: int("createdBy").notNull(), // FK para users
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccountPayable = typeof accountsPayable.$inferSelect;
export type InsertAccountPayable = typeof accountsPayable.$inferInsert;

/**
 * Contas a Receber
 * Vinculado a Evento e Cliente (Shopping)
 */
export const accountsReceivable = mysqlTable("accounts_receivable", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(), // FK para events
  clientId: int("clientId"), // FK para clients (shopping) - opcional
  categoryId: int("categoryId"), // FK para categories (classificação contábil)
  subcategoryId: int("subcategoryId"), // FK para subcategories (classificação contábil)
  description: text("description").notNull(),
  amount: int("amount").notNull(), // Valor em centavos
  dueDate: date("dueDate").notNull(),
  receivedDate: date("receivedDate"),
  status: mysqlEnum("status", ["pending", "received", "overdue"]).default("pending").notNull(),
  notes: text("notes"),
  createdBy: int("createdBy").notNull(), // FK para users
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccountReceivable = typeof accountsReceivable.$inferSelect;
export type InsertAccountReceivable = typeof accountsReceivable.$inferInsert;

/**
 * Categorias de Receita (Stand, Produto, Serviço, etc.)
 */
export const revenueCategories = mysqlTable("revenue_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RevenueCategory = typeof revenueCategories.$inferSelect;
export type InsertRevenueCategory = typeof revenueCategories.$inferInsert;

/**
 * Receitas Diárias
 * Lançamento diário de receitas por forma de pagamento
 * Vinculado a Evento (não mais a Centro de Custo genérico)
 */
export const dailyRevenues = mysqlTable("daily_revenues", {
  id: int("id").autoincrement().primaryKey(),
  date: date("date").notNull(),
  eventId: int("eventId").notNull(), // FK para events (mudou de costCenterId)
  revenueCategoryId: int("revenueCategoryId").notNull(), // FK para revenue_categories
  cashAmount: int("cashAmount").default(0).notNull(), // Dinheiro em centavos
  debitCardAmount: int("debitCardAmount").default(0).notNull(), // Cartão Débito em centavos
  creditCardAmount: int("creditCardAmount").default(0).notNull(), // Cartão Crédito em centavos
  pixAmount: int("pixAmount").default(0).notNull(), // PIX em centavos
  totalAmount: int("totalAmount").notNull(), // Total em centavos (soma automática)
  notes: text("notes"),
  createdBy: int("createdBy").notNull(), // FK para users
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DailyRevenue = typeof dailyRevenues.$inferSelect;
export type InsertDailyRevenue = typeof dailyRevenues.$inferInsert;

/**
 * Usuários do Sistema (diferente da tabela users que é para OAuth)
 * Usuários internos com login/senha e controle de acesso granular
 */
export const systemUsers = mysqlTable("system_users", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(), // Hash bcrypt
  profile: mysqlEnum("profile", [
    "administrador",
    "gerente_geral",
    "gerente_regional",
    "lider_financeiro",
    "lider_rh",
    "lider_processos",
    "lider_operacional",
    "lider_evento",
    "sublider_evento",
    "caixa_entrada",
    "caixa_saida",
    "monitor"
  ]).notNull(),
  active: int("active").default(1).notNull(), // 1 = ativo, 0 = inativo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastLogin: timestamp("lastLogin"),
});

export type SystemUser = typeof systemUsers.$inferSelect;
export type InsertSystemUser = typeof systemUsers.$inferInsert;

/**
 * Vinculação de Usuários a Empresas
 * Define quais empresas o usuário pode acessar
 */
export const userCompanies = mysqlTable("user_companies", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // FK para system_users
  companyId: int("companyId").notNull(), // FK para companies
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserCompany = typeof userCompanies.$inferSelect;
export type InsertUserCompany = typeof userCompanies.$inferInsert;

/**
 * Vinculação de Usuários a Eventos
 * Define quais eventos o usuário pode acessar
 */
export const userEvents = mysqlTable("user_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // FK para system_users
  eventId: int("eventId").notNull(), // FK para events
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserEvent = typeof userEvents.$inferSelect;
export type InsertUserEvent = typeof userEvents.$inferInsert;

/**
 * Categorias contábeis - Primeiro nível de classificação
 * Ex: Pessoal, Operacional, Administrativo, etc.
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(), // Nome da categoria
  description: text("description"), // Descrição opcional
  type: mysqlEnum("type", ["expense", "revenue"]).notNull(), // Tipo: despesa ou receita
  active: int("active").default(1).notNull(), // 1 = ativo, 0 = inativo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Subcategorias contábeis - Segundo nível de classificação
 * Ex: Salários, Freelancer, Aluguel, etc.
 * Vinculadas a uma categoria pai
 */
export const subcategories = mysqlTable("subcategories", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull().references(() => categories.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(), // Nome da subcategoria
  description: text("description"), // Descrição opcional
  active: int("active").default(1).notNull(), // 1 = ativo, 0 = inativo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subcategory = typeof subcategories.$inferSelect;
export type InsertSubcategory = typeof subcategories.$inferInsert;

/**
 * Módulos do Sistema BPO EK
 * Define os módulos disponíveis no sistema
 */
export const modules = mysqlTable("modules", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(), // Nome do módulo (ex: "financeiro", "agenda")
  displayName: varchar("displayName", { length: 100 }).notNull(), // Nome para exibição (ex: "FINANCEIRO")
  description: text("description"), // Descrição do módulo
  icon: varchar("icon", { length: 50 }), // Nome do ícone (ex: "Building2", "Calendar")
  route: varchar("route", { length: 100 }).notNull(), // Rota do módulo (ex: "/modules/financeiro")
  active: int("active").default(1).notNull(), // 1 = ativo, 0 = inativo
  available: int("available").default(0).notNull(), // 1 = disponível, 0 = em breve
  displayOrder: int("displayOrder").default(0).notNull(), // Ordem de exibição
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Module = typeof modules.$inferSelect;
export type InsertModule = typeof modules.$inferInsert;

/**
 * Permissões de Usuários por Módulo
 * Define quais módulos cada usuário pode acessar
 */
export const userModulePermissions = mysqlTable("user_module_permissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // FK para system_users
  moduleId: int("moduleId").notNull(), // FK para modules
  canView: int("canView").default(1).notNull(), // 1 = pode visualizar, 0 = não pode
  canCreate: int("canCreate").default(0).notNull(), // 1 = pode criar, 0 = não pode
  canEdit: int("canEdit").default(0).notNull(), // 1 = pode editar, 0 = não pode
  canDelete: int("canDelete").default(0).notNull(), // 1 = pode excluir, 0 = não pode
  canApprove: int("canApprove").default(0).notNull(), // 1 = pode aprovar, 0 = não pode
  canExport: int("canExport").default(0).notNull(), // 1 = pode exportar, 0 = não pode
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserModulePermission = typeof userModulePermissions.$inferSelect;
export type InsertUserModulePermission = typeof userModulePermissions.$inferInsert;
