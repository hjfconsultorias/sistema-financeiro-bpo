import { getDb } from "./db";
import { userCompanies, userEvents } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Perfis hierárquicos do sistema
 */
export type UserRole =
  | "administrador"
  | "gerente_geral"
  | "gerente_regional"
  | "lider_financeiro"
  | "lider_rh"
  | "lider_processos"
  | "lider_operacional"
  | "lider_evento"
  | "sublider_evento"
  | "caixa_entrada"
  | "caixa_saida"
  | "monitor";

/**
 * Níveis de acesso hierárquicos
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  administrador: 100,
  gerente_geral: 90,
  gerente_regional: 80,
  lider_financeiro: 70,
  lider_rh: 70,
  lider_processos: 70,
  lider_operacional: 70,
  lider_evento: 60,
  sublider_evento: 50,
  caixa_entrada: 40,
  caixa_saida: 40,
  monitor: 30,
};

/**
 * Perfis com acesso total ao sistema
 */
const GLOBAL_ACCESS_ROLES: UserRole[] = [
  "administrador",
  "gerente_geral",
  "lider_financeiro",
  "lider_rh",
  "lider_processos",
  "lider_operacional",
];

/**
 * Perfis com acesso limitado a empresas específicas
 */
const COMPANY_SCOPED_ROLES: UserRole[] = ["gerente_regional"];

/**
 * Perfis com acesso limitado a eventos específicos
 */
const EVENT_SCOPED_ROLES: UserRole[] = [
  "lider_evento",
  "sublider_evento",
  "caixa_entrada",
  "caixa_saida",
  "monitor",
];

/**
 * Verifica se o usuário tem acesso global (vê todas as empresas e eventos)
 */
export function hasGlobalAccess(role: UserRole): boolean {
  return GLOBAL_ACCESS_ROLES.includes(role);
}

/**
 * Verifica se o usuário tem acesso limitado por empresa
 */
export function isCompanyScoped(role: UserRole): boolean {
  return COMPANY_SCOPED_ROLES.includes(role);
}

/**
 * Verifica se o usuário tem acesso limitado por evento
 */
export function isEventScoped(role: UserRole): boolean {
  return EVENT_SCOPED_ROLES.includes(role);
}

/**
 * Retorna IDs das empresas que o usuário pode acessar
 */
export async function getUserCompanyIds(userId: number, role: UserRole): Promise<number[]> {
  // Acesso global: retorna null (significa "todas")
  if (hasGlobalAccess(role)) {
    return [];
  }

  // Busca empresas vinculadas ao usuário
  const db = await getDb();
  if (!db) return [];
  
  const companies = await db
    .select({ companyId: userCompanies.companyId })
    .from(userCompanies)
    .where(eq(userCompanies.userId, userId));

  return companies.map((uc: { companyId: number }) => uc.companyId);
}

/**
 * Retorna IDs dos eventos que o usuário pode acessar
 */
export async function getUserEventIds(userId: number, role: UserRole): Promise<number[]> {
  // Acesso global: retorna null (significa "todos")
  if (hasGlobalAccess(role)) {
    return [];
  }

  // Busca eventos vinculados ao usuário
  const db = await getDb();
  if (!db) return [];
  
  const events = await db
    .select({ eventId: userEvents.eventId })
    .from(userEvents)
    .where(eq(userEvents.userId, userId));

  return events.map((ue: { eventId: number }) => ue.eventId);
}

/**
 * Verifica se o usuário tem permissão para acessar uma empresa específica
 */
export async function canAccessCompany(
  userId: number,
  role: UserRole,
  companyId: number
): Promise<boolean> {
  if (hasGlobalAccess(role)) {
    return true;
  }

  const companyIds = await getUserCompanyIds(userId, role);
  return companyIds.includes(companyId);
}

/**
 * Verifica se o usuário tem permissão para acessar um evento específico
 */
export async function canAccessEvent(
  userId: number,
  role: UserRole,
  eventId: number
): Promise<boolean> {
  if (hasGlobalAccess(role)) {
    return true;
  }

  const eventIds = await getUserEventIds(userId, role);
  return eventIds.includes(eventId);
}

/**
 * Verifica se o usuário pode gerenciar outros usuários
 */
export function canManageUsers(role: UserRole): boolean {
  return role === "administrador";
}

/**
 * Verifica se o usuário pode gerenciar categorias
 */
export function canManageCategories(role: UserRole): boolean {
  return ["administrador", "gerente_geral", "lider_financeiro"].includes(role);
}

/**
 * Verifica se o usuário pode criar/editar lançamentos financeiros
 */
export function canManageFinancials(role: UserRole): boolean {
  return !["monitor"].includes(role);
}

/**
 * Verifica se o usuário pode aprovar/rejeitar lançamentos
 */
export function canApproveFinancials(role: UserRole): boolean {
  return ["administrador", "gerente_geral", "gerente_regional", "lider_financeiro"].includes(role);
}

/**
 * Filtra lista de empresas baseado nas permissões do usuário
 */
export async function filterCompaniesByPermission<T extends { id: number }>(
  companies: T[],
  userId: number,
  role: UserRole
): Promise<T[]> {
  if (hasGlobalAccess(role)) {
    return companies;
  }

  const allowedCompanyIds = await getUserCompanyIds(userId, role);
  return companies.filter(c => allowedCompanyIds.includes(c.id));
}

/**
 * Filtra lista de eventos baseado nas permissões do usuário
 */
export async function filterEventsByPermission<T extends { id: number; companyId?: number | null }>(
  events: T[],
  userId: number,
  role: UserRole
): Promise<T[]> {
  if (hasGlobalAccess(role)) {
    return events;
  }

  // Usuários com acesso por empresa veem eventos das empresas vinculadas
  if (isCompanyScoped(role)) {
    const allowedCompanyIds = await getUserCompanyIds(userId, role);
    return events.filter(e => e.companyId && allowedCompanyIds.includes(e.companyId));
  }

  // Usuários com acesso por evento veem apenas eventos vinculados
  const allowedEventIds = await getUserEventIds(userId, role);
  return events.filter(e => allowedEventIds.includes(e.id));
}

/**
 * Filtra lista de lançamentos financeiros baseado nas permissões do usuário
 */
export async function filterFinancialsByPermission<T extends { eventId?: number | null }>(
  financials: T[],
  userId: number,
  role: UserRole
): Promise<T[]> {
  if (hasGlobalAccess(role)) {
    return financials;
  }

  // Busca eventos permitidos (que já considera empresas)
  const allowedEvents = await getUserEventIds(userId, role);
  
  // Se usuário tem acesso por empresa, busca todos os eventos dessas empresas
  if (isCompanyScoped(role)) {
    const db = await getDb();
    if (!db) return [];
    
    const allowedCompanyIds = await getUserCompanyIds(userId, role);
    const { events } = await import("../drizzle/schema");
    const { inArray } = await import("drizzle-orm");
    
    const companyEvents = await db
      .select({ id: events.id })
      .from(events)
      .where(inArray(events.companyId, allowedCompanyIds));
    
    const companyEventIds = companyEvents.map((e: { id: number }) => e.id);
    return financials.filter(f => f.eventId && companyEventIds.includes(f.eventId));
  }

  // Usuários com acesso por evento
  return financials.filter(f => f.eventId && allowedEvents.includes(f.eventId));
}
