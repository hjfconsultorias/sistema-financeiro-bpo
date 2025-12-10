import { eq, and, like, inArray, sql } from "drizzle-orm";
import { getDb } from "./db";
import { agenda, companies, events } from "../drizzle/schema";
import type { Agenda, InsertAgenda } from "../drizzle/schema_agenda";

/**
 * Listar todos os registros da agenda com filtros opcionais
 */
export async function listAgenda(filters?: {
  companyId?: string;
  eventId?: number;
  year?: number;
  status?: string;
  state?: string;
  network?: string;
  classification?: string;
  shopping?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let query = db.select().from(agenda).where(eq(agenda.is_active, true));

  // Aplicar filtros se fornecidos
  const conditions = [];
  if (filters?.companyId) conditions.push(eq(agenda.company_id, filters.companyId));
  if (filters?.eventId) conditions.push(eq(agenda.event_id, filters.eventId));
  if (filters?.year) conditions.push(eq(agenda.year, filters.year));
  if (filters?.status) conditions.push(eq(agenda.status, filters.status));
  if (filters?.state) conditions.push(eq(agenda.state, filters.state));
  if (filters?.network) conditions.push(eq(agenda.network, filters.network));
  if (filters?.classification) conditions.push(eq(agenda.classification, filters.classification));
  if (filters?.shopping) conditions.push(like(agenda.shopping, `%${filters.shopping}%`));

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  return await query;
}

/**
 * Buscar registro da agenda por ID
 */
export async function getAgendaById(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(agenda).where(eq(agenda.id, id)).limit(1);
  return result[0] || null;
}

/**
 * Criar novo registro na agenda
 */
export async function createAgenda(data: InsertAgenda) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Gerar ID único
  const id = `ag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  await db.insert(agenda).values({
    ...data,
    id,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  return id;
}

/**
 * Atualizar registro da agenda
 */
export async function updateAgenda(id: string, data: Partial<InsertAgenda>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(agenda)
    .set({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .where(eq(agenda.id, id));
}

/**
 * Deletar registro da agenda (soft delete)
 */
export async function deleteAgenda(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(agenda)
    .set({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .where(eq(agenda.id, id));
}

/**
 * Buscar empresa por nome (para importação)
 */
export async function findCompanyByName(name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Normalizar nome: "GP 1" -> "gp1"
  const normalizedName = name.toLowerCase().replace(/\s+/g, "");

  const result = await db
    .select()
    .from(companies)
    .where(
      sql`LOWER(REPLACE(${companies.name}, ' ', '')) = ${normalizedName} OR 
          LOWER(REPLACE(${companies.tradeName}, ' ', '')) = ${normalizedName}`
    )
    .limit(1);

  return result[0] || null;
}

/**
 * Buscar evento por nome (para importação)
 */
export async function findEventByName(name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(events)
    .where(sql`LOWER(${events.name}) = LOWER(${name})`)
    .limit(1);

  return result[0] || null;
}

/**
 * Importar múltiplos registros da agenda
 */
export async function bulkCreateAgenda(records: InsertAgenda[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const recordsWithIds = records.map((record) => ({
    ...record,
    id: `ag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  await db.insert(agenda).values(recordsWithIds);

  return recordsWithIds.length;
}

/**
 * Obter estatísticas da agenda
 */
export async function getAgendaStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [totalEvents] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(agenda)
    .where(eq(agenda.is_active, true));

  const [totalCompanies] = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${agenda.company_id})` })
    .from(agenda)
    .where(eq(agenda.is_active, true));

  const [totalNetworks] = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${agenda.network})` })
    .from(agenda)
    .where(and(eq(agenda.is_active, true), sql`${agenda.network} IS NOT NULL`));

  const [totalStatus] = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${agenda.status})` })
    .from(agenda)
    .where(eq(agenda.is_active, true));

  return {
    totalEvents: totalEvents?.count || 0,
    totalCompanies: totalCompanies?.count || 0,
    totalNetworks: totalNetworks?.count || 0,
    totalStatus: totalStatus?.count || 0,
  };
}

/**
 * Exportar dados da agenda para CSV/Excel
 */
export async function exportAgenda() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select({
      empresa: agenda.company_id,
      evento: agenda.event_id,
      ano: agenda.year,
      periodo: agenda.period,
      status: agenda.status,
      shopping: agenda.shopping,
      uf: agenda.state,
      rede: agenda.network,
      classificacao: agenda.classification,
      aluguel: agenda.rent,
    })
    .from(agenda)
    .where(eq(agenda.is_active, true));
}
