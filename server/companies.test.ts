import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

describe("Companies CRUD", () => {
  let testCompanyId: number;
  let testCnpj: string;

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

  it("should create a new company", async () => {
    testCnpj = `12.345.678/0001-${Date.now().toString().slice(-2)}`;
    const result = await caller.companies.create({
      name: "Empresa Teste Ltda",
      tradeName: "Teste Corp",
      cnpj: testCnpj,
      stateRegistration: "123456789",
      municipalRegistration: "987654",
      email: "contato@teste.com.br",
      phone: "(11) 98765-4321",
      address: "Rua Teste, 123",
      city: "São Paulo",
      state: "SP",
      zipCode: "01234-567",
    });

    console.log("Create result:", result);
    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe("number");
    testCompanyId = result.id;
    console.log("testCompanyId set to:", testCompanyId);
  });

  it("should list all companies", async () => {
    const companies = await caller.companies.list();
    expect(Array.isArray(companies)).toBe(true);
    expect(companies.length).toBeGreaterThan(0);
  });

  it("should get company by id", async () => {
    const company = await caller.companies.getById({ id: testCompanyId });
    expect(company).toBeDefined();
    expect(company.name).toBe("Empresa Teste Ltda");
    expect(company.cnpj).toBe(testCnpj);
  });

  it("should update company", async () => {
    const result = await caller.companies.update({
      id: testCompanyId,
      data: {
        tradeName: "Teste Corp Atualizada",
        phone: "(11) 91234-5678",
      },
    });

    expect(result.success).toBe(true);

    const updated = await caller.companies.getById({ id: testCompanyId });
    expect(updated.tradeName).toBe("Teste Corp Atualizada");
    expect(updated.phone).toBe("(11) 91234-5678");
  });

  it("should export companies to CSV", async () => {
    const exported = await caller.companies.exportCSV();
    expect(Array.isArray(exported)).toBe(true);
    expect(exported.length).toBeGreaterThan(0);
  });

  it("should reject creation from non-admin user", async () => {
    const nonAdminCaller = appRouter.createCaller({
      ...mockContext,
      user: { ...mockContext.user, role: "user" as const },
    });

    await expect(
      nonAdminCaller.companies.create({
        name: "Empresa Não Autorizada",
        cnpj: "00.000.000/0001-00",
      })
    ).rejects.toThrow("Apenas administradores podem criar empresas");
  });
});
