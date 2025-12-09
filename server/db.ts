import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  companies,
  InsertCompany,
  events,
  InsertEvent,
  eventContracts,
  InsertEventContract,
  clients,
  InsertClient,
  suppliers,
  InsertSupplier,
  accountsPayable,
  InsertAccountPayable,
  accountsReceivable,
  InsertAccountReceivable,
  revenueCategories,
  InsertRevenueCategory,
  dailyRevenues,
  InsertDailyRevenue,
  systemUsers,
  InsertSystemUser,
  userCompanies,
  InsertUserCompany,
  userEvents,
  InsertUserEvent,
  categories,
  InsertCategory,
  subcategories,
  InsertSubcategory,
  modules,
  userModulePermissions,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ========== Empresas (CNPJs) ==========

export async function getAllCompanies() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(companies).orderBy(desc(companies.createdAt));
}

export async function getActiveCompanies() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(companies).where(eq(companies.active, 1)).orderBy(companies.name);
}

export async function getCompanyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
  return result[0];
}

export async function createCompany(data: InsertCompany) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(companies).values(data);
  return Number(result[0].insertId);
}

export async function updateCompany(id: number, data: Partial<InsertCompany>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(companies).set(data).where(eq(companies.id, id));
}

export async function deleteCompany(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(companies).set({ active: 0 }).where(eq(companies.id, id));
}

// ========== Eventos ==========

export async function getAllEvents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(events).orderBy(desc(events.createdAt));
}

export async function getActiveEvents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(events).where(eq(events.active, 1)).orderBy(events.name);
}

export async function getEventById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return result[0];
}

export async function createEvent(data: InsertEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(events).values(data);
  return Number(result[0].insertId);
}

export async function updateEvent(id: number, data: Partial<InsertEvent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(events).set(data).where(eq(events.id, id));
}

export async function deleteEvent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(events).where(eq(events.id, id));
}

export async function getEventsByCompanyId(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(events).where(eq(events.companyId, companyId));
}

// ========== Contratos de Eventos ==========

export async function getAllEventContracts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(eventContracts).orderBy(desc(eventContracts.createdAt));
}

export async function getActiveEventContracts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(eventContracts).where(eq(eventContracts.active, 1));
}

export async function getEventContractById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(eventContracts).where(eq(eventContracts.id, id)).limit(1);
  return result[0];
}

export async function createEventContract(data: InsertEventContract) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(eventContracts).values(data);
  return Number(result[0].insertId);
}

export async function updateEventContract(id: number, data: Partial<InsertEventContract>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(eventContracts).set(data).where(eq(eventContracts.id, id));
}

export async function deleteEventContract(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(eventContracts).set({ active: 0 }).where(eq(eventContracts.id, id));
}

// ========== Clientes ==========

export async function getAllClients() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clients).orderBy(desc(clients.createdAt));
}

export async function getActiveClients() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clients).where(eq(clients.active, 1)).orderBy(clients.name);
}

export async function getClientById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result[0];
}

export async function createClient(data: InsertClient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clients).values(data);
  return Number(result[0].insertId);
}

export async function updateClient(id: number, data: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clients).set(data).where(eq(clients.id, id));
}

export async function deleteClient(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clients).set({ active: 0 }).where(eq(clients.id, id));
}

// ========== Fornecedores ==========

export async function getAllSuppliers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
}

export async function getActiveSuppliers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(suppliers).where(eq(suppliers.active, 1)).orderBy(suppliers.name);
}

export async function getSupplierById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
  return result[0];
}

export async function createSupplier(data: InsertSupplier) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(suppliers).values(data);
  return Number(result[0].insertId);
}

export async function updateSupplier(id: number, data: Partial<InsertSupplier>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(suppliers).set(data).where(eq(suppliers.id, id));
}

export async function deleteSupplier(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(suppliers).set({ active: 0 }).where(eq(suppliers.id, id));
}

// ========== Contas a Pagar ==========

export async function getAllAccountsPayable(filters?: {
  eventId?: number;
  status?: "pending" | "paid" | "overdue";
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(accountsPayable);

  const conditions = [];
  if (filters?.eventId) {
    conditions.push(eq(accountsPayable.eventId, filters.eventId));
  }
  if (filters?.status) {
    conditions.push(eq(accountsPayable.status, filters.status));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  return query.orderBy(desc(accountsPayable.dueDate));
}

export async function getAccountPayableById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(accountsPayable).where(eq(accountsPayable.id, id)).limit(1);
  return result[0];
}

export async function createAccountPayable(data: InsertAccountPayable) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(accountsPayable).values(data);
  return Number(result[0].insertId);
}

export async function updateAccountPayable(id: number, data: Partial<InsertAccountPayable>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(accountsPayable).set(data).where(eq(accountsPayable.id, id));
}

export async function deleteAccountPayable(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(accountsPayable).where(eq(accountsPayable.id, id));
}

export async function getAccountsPayableForExport() {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db
    .select({
      id: accountsPayable.id,
      dueDate: accountsPayable.dueDate,
      amount: accountsPayable.amount,
      description: accountsPayable.description,
      status: accountsPayable.status,
      notes: accountsPayable.notes,
      eventName: events.name,
      supplierName: suppliers.name,
      categoryName: categories.name,
      subcategoryName: subcategories.name,
    })
    .from(accountsPayable)
    .leftJoin(events, eq(accountsPayable.eventId, events.id))
    .leftJoin(suppliers, eq(accountsPayable.supplierId, suppliers.id))
    .leftJoin(categories, eq(accountsPayable.categoryId, categories.id))
    .leftJoin(subcategories, eq(accountsPayable.subcategoryId, subcategories.id))
    .orderBy(desc(accountsPayable.dueDate));
  
  return results;
}

// ========== Contas a Receber ==========

export async function getAllAccountsReceivable(filters?: {
  eventId?: number;
  status?: "pending" | "received" | "overdue";
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(accountsReceivable);

  const conditions = [];
  if (filters?.eventId) {
    conditions.push(eq(accountsReceivable.eventId, filters.eventId));
  }
  if (filters?.status) {
    conditions.push(eq(accountsReceivable.status, filters.status));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  return query.orderBy(desc(accountsReceivable.dueDate));
}

export async function getAccountReceivableById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(accountsReceivable).where(eq(accountsReceivable.id, id)).limit(1);
  return result[0];
}

export async function createAccountReceivable(data: InsertAccountReceivable) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(accountsReceivable).values(data);
  return Number(result[0].insertId);
}

export async function updateAccountReceivable(id: number, data: Partial<InsertAccountReceivable>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(accountsReceivable).set(data).where(eq(accountsReceivable.id, id));
}

export async function deleteAccountReceivable(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(accountsReceivable).where(eq(accountsReceivable.id, id));
}

export async function getAccountsReceivableForExport() {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db
    .select({
      id: accountsReceivable.id,
      dueDate: accountsReceivable.dueDate,
      amount: accountsReceivable.amount,
      description: accountsReceivable.description,
      status: accountsReceivable.status,
      notes: accountsReceivable.notes,
      eventName: events.name,
      clientName: clients.name,
    })
    .from(accountsReceivable)
    .leftJoin(events, eq(accountsReceivable.eventId, events.id))
    .leftJoin(clients, eq(accountsReceivable.clientId, clients.id))
    .orderBy(desc(accountsReceivable.dueDate));
  
  return results;
}

// ========== Categorias de Receita ==========

export async function getAllRevenueCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(revenueCategories).orderBy(revenueCategories.name);
}

export async function getActiveRevenueCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(revenueCategories).where(eq(revenueCategories.active, 1)).orderBy(revenueCategories.name);
}

export async function getRevenueCategoryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(revenueCategories).where(eq(revenueCategories.id, id)).limit(1);
  return result[0];
}

export async function createRevenueCategory(data: InsertRevenueCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(revenueCategories).values(data);
  return Number(result[0].insertId);
}

export async function updateRevenueCategory(id: number, data: Partial<InsertRevenueCategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(revenueCategories).set(data).where(eq(revenueCategories.id, id));
}

export async function deleteRevenueCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(revenueCategories).where(eq(revenueCategories.id, id));
}

// ========== Receitas Diárias ==========

export async function getAllDailyRevenues(filters?: {
  eventId?: number;
  revenueCategoryId?: number;
  startDate?: string;
  endDate?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(dailyRevenues);

  const conditions = [];
  if (filters?.eventId) {
    conditions.push(eq(dailyRevenues.eventId, filters.eventId));
  }
  if (filters?.revenueCategoryId) {
    conditions.push(eq(dailyRevenues.revenueCategoryId, filters.revenueCategoryId));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  return query.orderBy(desc(dailyRevenues.date));
}

export async function getDailyRevenueById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(dailyRevenues).where(eq(dailyRevenues.id, id)).limit(1);
  return result[0];
}

export async function createDailyRevenue(data: InsertDailyRevenue) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(dailyRevenues).values(data);
  return Number(result[0].insertId);
}

export async function updateDailyRevenue(id: number, data: Partial<InsertDailyRevenue>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(dailyRevenues).set(data).where(eq(dailyRevenues.id, id));
}

export async function deleteDailyRevenue(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(dailyRevenues).where(eq(dailyRevenues.id, id));
}

// ==================== SYSTEM USERS ====================

export async function getAllSystemUsers() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(systemUsers).orderBy(desc(systemUsers.createdAt));
}

export async function getActiveSystemUsers() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(systemUsers).where(eq(systemUsers.active, 1)).orderBy(systemUsers.name);
}

export async function getSystemUserById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(systemUsers).where(eq(systemUsers.id, id));
  return result[0];
}

export async function getSystemUserByEmail(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(systemUsers).where(eq(systemUsers.email, email));
  return result[0];
}

export async function createSystemUser(data: InsertSystemUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(systemUsers).values(data);
  return result[0].insertId;
}

export async function updateSystemUser(id: number, data: Partial<InsertSystemUser>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(systemUsers).set(data).where(eq(systemUsers.id, id));
}

export async function deleteSystemUser(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(systemUsers).where(eq(systemUsers.id, id));
}

export async function updateLastLogin(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(systemUsers).set({ lastLogin: new Date() }).where(eq(systemUsers.id, id));
}

// ==================== USER COMPANIES ====================

export async function getUserCompanies(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(userCompanies).where(eq(userCompanies.userId, userId));
}

export async function addUserCompany(data: InsertUserCompany) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(userCompanies).values(data);
}

export async function removeUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(userCompanies).where(
    and(
      eq(userCompanies.userId, userId),
      eq(userCompanies.companyId, companyId)
    )
  );
}

export async function removeAllUserCompanies(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(userCompanies).where(eq(userCompanies.userId, userId));
}

// ==================== USER EVENTS ====================

export async function getUserEvents(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(userEvents).where(eq(userEvents.userId, userId));
}

export async function addUserEvent(data: InsertUserEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(userEvents).values(data);
}

export async function removeUserEvent(userId: number, eventId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(userEvents).where(
    and(
      eq(userEvents.userId, userId),
      eq(userEvents.eventId, eventId)
    )
  );
}

export async function removeAllUserEvents(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(userEvents).where(eq(userEvents.userId, userId));
}

// ============================================================
// CATEGORIES & SUBCATEGORIES
// ============================================================

export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(categories.name);
}

export async function getCategoryById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return result[0] || null;
}

export async function createCategory(data: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(categories).values(data);
  return result[0].insertId;
}

export async function updateCategory(id: number, data: Partial<InsertCategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(categories).set(data).where(eq(categories.id, id));
  const updated = await getCategoryById(id);
  if (!updated) throw new Error("Category not found after update");
  return updated;
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(categories).where(eq(categories.id, id));
}

export async function getAllSubcategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subcategories).orderBy(subcategories.name);
}

export async function getSubcategoriesByCategoryId(categoryId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subcategories).where(eq(subcategories.categoryId, categoryId)).orderBy(subcategories.name);
}

export async function getSubcategoryById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(subcategories).where(eq(subcategories.id, id)).limit(1);
  return result[0] || null;
}

export async function createSubcategory(data: InsertSubcategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(subcategories).values(data);
  return result[0].insertId;
}

export async function updateSubcategory(id: number, data: Partial<InsertSubcategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(subcategories).set(data).where(eq(subcategories.id, id));
  const updated = await getSubcategoryById(id);
  if (!updated) throw new Error("Subcategory not found after update");
  return updated;
}

export async function deleteSubcategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(subcategories).where(eq(subcategories.id, id));
}

// ============================================
// MÓDULOS
// ============================================

export async function getAllModules() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(modules)
    .where(eq(modules.active, 1))
    .orderBy(modules.displayOrder);
  
  return result;
}

export async function getModuleById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(modules)
    .where(eq(modules.id, id))
    .limit(1);
  
  return result[0] || null;
}

export async function getUserModulePermissions(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(userModulePermissions)
    .where(eq(userModulePermissions.userId, userId));
  
  return result;
}

/**
 * Obter módulos permitidos para um usuário
 */
export async function getUserAllowedModules(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar dados do usuário para verificar se é administrador
  const user = await db
    .select()
    .from(systemUsers)
    .where(eq(systemUsers.id, userId))
    .limit(1);
  
  // Se é administrador, retornar TODOS os módulos
  if (user.length > 0 && user[0].profile === 'administrador') {
    const allModules = await db
      .select()
      .from(modules)
      .orderBy(modules.displayOrder);
    return allModules;
  }
  
  // Buscar permissões do usuário
  const permissions = await db
    .select()
    .from(userModulePermissions)
    .where(eq(userModulePermissions.userId, userId));
  
  // Se não tem permissões, retornar array vazio
  if (permissions.length === 0) {
    return [];
  }
  
  // Buscar módulos permitidos (onde canView = 1)
  const moduleIds = permissions
    .filter(p => p.canView === 1)
    .map(p => p.moduleId);
  
  if (moduleIds.length === 0) {
    return [];
  }
  
  const allowedModules = await db
    .select()
    .from(modules)
    .where(sql`${modules.id} IN (${sql.join(moduleIds.map(id => sql`${id}`), sql`, `)})`)
    .orderBy(modules.displayOrder);
  
  return allowedModules;
}

/**
 * Obter permissões de um usuário em um módulo específico
 */
export async function getUserPermissionsForModule(userId: number, moduleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(userModulePermissions)
    .where(
      and(
        eq(userModulePermissions.userId, userId),
        eq(userModulePermissions.moduleId, moduleId)
      )
    )
    .limit(1);
  
  return result[0] || null;
}

/**
 * Obter todas as permissões de um usuário
 */
export async function getAllUserPermissions(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(userModulePermissions)
    .where(eq(userModulePermissions.userId, userId));
  
  return result;
}

/**
 * Atualizar permissões de um usuário
 */
export async function updateUserPermissions(
  userId: number,
  permissions: Array<{
    moduleId: number;
    canView: number;
    canCreate: number;
    canEdit: number;
    canDelete: number;
    canApprove: number;
    canExport: number;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Remover permissões antigas
  await db
    .delete(userModulePermissions)
    .where(eq(userModulePermissions.userId, userId));
  
  // Inserir novas permissões
  if (permissions.length > 0) {
    await db.insert(userModulePermissions).values(
      permissions.map(p => ({
        userId,
        moduleId: p.moduleId,
        canView: p.canView,
        canCreate: p.canCreate,
        canEdit: p.canEdit,
        canDelete: p.canDelete,
        canApprove: p.canApprove,
        canExport: p.canExport,
      }))
    );
  }
  
  return true;
}
