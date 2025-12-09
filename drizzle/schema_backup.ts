import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, date } from "drizzle-orm/mysql-core";

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
 * Tipos de usuário estendidos para o sistema financeiro:
 * - admin: Acesso total ao sistema
 * - user: Acesso padrão (visualização e lançamentos do próprio centro de custo)
 */

/**
 * Centros de Custo (Operações/Unidades Geradoras de Caixa)
 * Representa cada loja, evento ou unidade de negócio
 */
export const costCenters = mysqlTable("cost_centers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  active: int("active").default(1).notNull(), // 1 = ativo, 0 = inativo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CostCenter = typeof costCenters.$inferSelect;
export type InsertCostCenter = typeof costCenters.$inferInsert;

/**
 * Clientes (Shoppings onde as operações acontecem)
 */
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  cnpj: varchar("cnpj", { length: 18 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  active: int("active").default(1).notNull(), // 1 = ativo, 0 = inativo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

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
 */
export const accountsPayable = mysqlTable("accounts_payable", {
  id: int("id").autoincrement().primaryKey(),
  description: varchar("description", { length: 255 }).notNull(),
  amount: int("amount").notNull(), // Valor em centavos para evitar problemas com decimais
  dueDate: timestamp("dueDate").notNull(),
  paymentDate: timestamp("paymentDate"),
  status: mysqlEnum("status", ["pending", "paid", "overdue"]).default("pending").notNull(),
  costCenterId: int("costCenterId").notNull(),
  supplierId: int("supplierId"),
  notes: text("notes"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccountPayable = typeof accountsPayable.$inferSelect;
export type InsertAccountPayable = typeof accountsPayable.$inferInsert;

/**
 * Contas a Receber (Mantida para compatibilidade)
 */
export const accountsReceivable = mysqlTable("accounts_receivable", {
  id: int("id").autoincrement().primaryKey(),
  description: varchar("description", { length: 255 }).notNull(),
  amount: int("amount").notNull(), // Valor em centavos
  dueDate: timestamp("dueDate").notNull(),
  receiptDate: timestamp("receiptDate"),
  status: mysqlEnum("status", ["pending", "received", "overdue"]).default("pending").notNull(),
  costCenterId: int("costCenterId").notNull(),
  clientId: int("clientId"),
  notes: text("notes"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccountReceivable = typeof accountsReceivable.$inferSelect;
export type InsertAccountReceivable = typeof accountsReceivable.$inferInsert;

/**
 * Categorias de Receita
 * Representa os tipos de receita do negócio (Stand, Serviço, Produto, etc.)
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
 * Receitas Diárias - Nova estrutura
 * Adaptada para lógica de negócio com múltiplas formas de pagamento
 * Substitui o uso de accountsReceivable para lançamentos operacionais
 */
export const dailyRevenues = mysqlTable("daily_revenues", {
  id: int("id").autoincrement().primaryKey(),
  date: date("date").notNull(), // Data do lançamento
  costCenterId: int("costCenterId").notNull(), // Centro de custo/receita (ex: A FLORESTA)
  revenueCategoryId: int("revenueCategoryId").notNull(), // Categoria (Stand, Serviço, Produto)
  
  // Formas de pagamento - valores em centavos
  cashAmount: int("cashAmount").default(0).notNull(), // Dinheiro
  debitCardAmount: int("debitCardAmount").default(0).notNull(), // Cartão Débito
  creditCardAmount: int("creditCardAmount").default(0).notNull(), // Cartão Crédito
  pixAmount: int("pixAmount").default(0).notNull(), // PIX
  
  totalAmount: int("totalAmount").notNull(), // Total = soma de todas as formas de pagamento
  
  notes: text("notes"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DailyRevenue = typeof dailyRevenues.$inferSelect;
export type InsertDailyRevenue = typeof dailyRevenues.$inferInsert;
