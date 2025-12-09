import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

// Mock de contexto para diferentes perfis
function createMockContext(userId: number, role: string): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `test-${userId}`,
      name: `Test User ${userId}`,
      email: `test${userId}@example.com`,
      loginMethod: "manus",
      role: role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Sistema de Autorização", () => {
  let testCompanyId: number;
  let testEventId: number;
  let adminUserId: number;
  let regionalManagerUserId: number;
  let eventManagerUserId: number;

  beforeAll(async () => {
    // Criar empresa de teste com CNPJ único
    const uniqueCnpj = `${Date.now()}`.padStart(14, '0').slice(0, 14);
    const company = await db.createCompany({
      name: "Empresa Teste Autorização",
      cnpj: uniqueCnpj,
      active: 1,
    });
    testCompanyId = company.id;

    // Criar evento de teste
    testEventId = await db.createEvent({
      companyId: testCompanyId,
      name: "Evento Teste Autorização",
      active: 1,
    });

    // Criar usuários de teste
    const admin = await db.createSystemUser({
      name: "Admin Teste",
      email: "admin@test.com",
      phone: "11999999999",
      password: "hashed_password",
      role: "administrador",
      active: 1,
    });
    adminUserId = admin.id;

    const regionalManager = await db.createSystemUser({
      name: "Gerente Regional Teste",
      email: "regional@test.com",
      phone: "11999999998",
      password: "hashed_password",
      role: "gerente_regional",
      active: 1,
    });
    regionalManagerUserId = regionalManager.id;

    // Vincular gerente regional à empresa
    await db.addUserCompany({
      userId: regionalManagerUserId,
      companyId: testCompanyId,
    });

    const eventManager = await db.createSystemUser({
      name: "Gerente Evento Teste",
      email: "evento@test.com",
      phone: "11999999997",
      password: "hashed_password",
      role: "lider_evento",
      active: 1,
    });
    eventManagerUserId = eventManager.id;

    // Vincular gerente de evento ao evento
    await db.addUserEvent({
      userId: eventManagerUserId,
      eventId: testEventId,
    });
  });

  describe("Filtros de Empresas", () => {
    it("Administrador deve ver todas as empresas", async () => {
      const ctx = createMockContext(adminUserId, "administrador");
      const caller = appRouter.createCaller(ctx);

      const companies = await caller.companies.list();
      expect(companies.length).toBeGreaterThan(0);
      expect(companies.some((c) => c.id === testCompanyId)).toBe(true);
    });

    it("Gerente Regional deve ver apenas empresas vinculadas", async () => {
      const ctx = createMockContext(regionalManagerUserId, "gerente_regional");
      const caller = appRouter.createCaller(ctx);

      const companies = await caller.companies.list();
      expect(companies.length).toBeGreaterThan(0);
      expect(companies.every((c) => c.id === testCompanyId)).toBe(true);
    });

    it("Gerente de Evento não deve ver empresas (acesso por evento)", async () => {
      const ctx = createMockContext(eventManagerUserId, "lider_evento");
      const caller = appRouter.createCaller(ctx);

      const companies = await caller.companies.list();
      expect(companies.length).toBe(0);
    });
  });

  describe("Filtros de Eventos", () => {
    it("Administrador deve ver todos os eventos", async () => {
      const ctx = createMockContext(adminUserId, "administrador");
      const caller = appRouter.createCaller(ctx);

      const events = await caller.events.list();
      expect(events.length).toBeGreaterThan(0);
      expect(events.some((e) => e.id === testEventId)).toBe(true);
    });

    it("Gerente Regional deve ver eventos das empresas vinculadas", async () => {
      const ctx = createMockContext(regionalManagerUserId, "gerente_regional");
      const caller = appRouter.createCaller(ctx);

      const events = await caller.events.list();
      expect(events.length).toBeGreaterThan(0);
      expect(events.every((e) => e.companyId === testCompanyId)).toBe(true);
    });

    it("Gerente de Evento deve ver apenas eventos vinculados", async () => {
      const ctx = createMockContext(eventManagerUserId, "lider_evento");
      const caller = appRouter.createCaller(ctx);

      const events = await caller.events.list();
      expect(events.length).toBeGreaterThan(0);
      expect(events.every((e) => e.id === testEventId)).toBe(true);
    });
  });

  describe("Filtros de Lançamentos Financeiros", () => {
    let testAccountPayableId: number;

    beforeAll(async () => {
      // Criar conta a pagar de teste
      const account = await db.createAccountPayable({
        description: "Teste Autorização",
        amount: 100,
        dueDate: new Date(),
        eventId: testEventId,
        status: "pending",
      });
      testAccountPayableId = account.id;
    });

    it("Administrador deve ver todos os lançamentos", async () => {
      const ctx = createMockContext(adminUserId, "administrador");
      const caller = appRouter.createCaller(ctx);

      const accounts = await caller.accountsPayable.list();
      expect(accounts.length).toBeGreaterThan(0);
      expect(accounts.some((a) => a.id === testAccountPayableId)).toBe(true);
    });

    it("Gerente Regional deve ver lançamentos das empresas vinculadas", async () => {
      const ctx = createMockContext(regionalManagerUserId, "gerente_regional");
      const caller = appRouter.createCaller(ctx);

      const accounts = await caller.accountsPayable.list();
      expect(accounts.length).toBeGreaterThan(0);
      expect(accounts.every((a) => a.eventId === testEventId)).toBe(true);
    });

    it("Gerente de Evento deve ver apenas lançamentos do evento vinculado", async () => {
      const ctx = createMockContext(eventManagerUserId, "lider_evento");
      const caller = appRouter.createCaller(ctx);

      const accounts = await caller.accountsPayable.list();
      expect(accounts.length).toBeGreaterThan(0);
      expect(accounts.every((a) => a.eventId === testEventId)).toBe(true);
    });
  });
});
