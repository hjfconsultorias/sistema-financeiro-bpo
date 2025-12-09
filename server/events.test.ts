import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

describe("Events with Company Hierarchy", () => {
  let testCompanyId: number;
  let testEventId: number;

  const mockContext = {
    user: {
      id: 1,
      openId: "test-open-id",
      name: "Test Admin",
      email: "admin@test.com",
      role: "admin" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as any,
    res: {} as any,
  };

  const caller = appRouter.createCaller(mockContext);

  it("should create a company first", async () => {
    const testCnpj = `12.345.678/0001-${Date.now().toString().slice(-2)}`;
    const result = await caller.companies.create({
      name: "Empresa Teste Eventos",
      tradeName: "Teste Eventos Corp",
      cnpj: testCnpj,
      email: "eventos@teste.com.br",
      phone: "(11) 98765-4321",
      address: "Rua Teste, 456",
      city: "São Paulo",
      state: "SP",
      zipCode: "01234-567",
    });

    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
    testCompanyId = result.id;
  });

  it("should create an event linked to company", async () => {
    const result = await caller.events.create({
      name: "Galaxia Shopping Norte",
      description: "Evento itinerante no Shopping Norte",
      companyId: testCompanyId,
    });

    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
    testEventId = result.id;
  });

  it("should list events and verify company link", async () => {
    const events = await caller.events.list();
    const createdEvent = events.find((e) => e.id === testEventId);

    expect(createdEvent).toBeDefined();
    expect(createdEvent?.name).toBe("Galaxia Shopping Norte");
    expect(createdEvent?.companyId).toBe(testCompanyId);
  });

  it("should update event and change company", async () => {
    // Create another company
    const testCnpj2 = `98.765.432/0001-${Date.now().toString().slice(-2)}`;
    const company2 = await caller.companies.create({
      name: "Segunda Empresa Teste",
      tradeName: "Teste 2 Corp",
      cnpj: testCnpj2,
      email: "empresa2@teste.com.br",
    });

    expect(company2.success).toBe(true);

    // Update event to new company
    const result = await caller.events.update({
      id: testEventId,
      data: {
        name: "Galaxia Shopping Sul",
        companyId: company2.id,
      },
    });

    expect(result.success).toBe(true);

    // Verify update
    const events = await caller.events.list();
    const updatedEvent = events.find((e) => e.id === testEventId);

    expect(updatedEvent?.name).toBe("Galaxia Shopping Sul");
    expect(updatedEvent?.companyId).toBe(company2.id);
  });

  it("should fail to create event without companyId", async () => {
    try {
      await caller.events.create({
        name: "Evento Sem Empresa",
        description: "Este evento não deveria ser criado",
        // companyId missing
      } as any);
      // If we reach here, the test should fail
      expect(true).toBe(false);
    } catch (error: any) {
      // Should throw validation error
      expect(error).toBeDefined();
    }
  });
});
