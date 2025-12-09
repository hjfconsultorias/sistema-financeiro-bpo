import { mysqlTable, varchar, int, decimal, text, boolean, timestamp } from "drizzle-orm/mysql-core";

/**
 * Tabela AGENDA - Agendamento de eventos em shoppings
 * Armazena informações sobre quando e onde cada evento será realizado
 */
export const agenda = mysqlTable("agenda", {
  id: varchar("id", { length: 191 }).primaryKey().notNull(),
  company_id: varchar("company_id", { length: 191 }).notNull(), // FK para companies (gp1, gp2, etc)
  cost_center_id: varchar("cost_center_id", { length: 191 }).notNull(), // FK para cost_centers (cc24, cc25, etc)
  year: int("year").notNull(), // Ano (2026)
  period: varchar("period", { length: 191 }).notNull(), // Período (Janeiro a Fevereiro, etc)
  status: varchar("status", { length: 191 }).notNull(), // Status (Fase de Contrato, LIBERADO, etc)
  shopping: varchar("shopping", { length: 191 }), // Nome do shopping (PRUDEM, ILHA PLAZA, etc)
  state: varchar("state", { length: 191 }), // Estado (SP, RJ, GO, etc)
  network: varchar("network", { length: 191 }), // Rede (ARGOPLAN, SOLL MALS, etc)
  classification: varchar("classification", { length: 191 }), // Classificação (Excelente, Medio, etc)
  rent: decimal("rent", { precision: 10, scale: 2 }), // Aluguel (1000.00)
  notes: text("notes"), // Notas adicionais
  is_active: boolean("is_active").default(true).notNull(), // Status ativo/inativo
  created_at: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
});

export type Agenda = typeof agenda.$inferSelect;
export type InsertAgenda = typeof agenda.$inferInsert;
