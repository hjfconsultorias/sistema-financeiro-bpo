import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createCaller(userRole: "admin" | "user" = "admin") {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: userRole,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return appRouter.createCaller(ctx);
}

describe("System Users CRUD", () => {
  let testUserId: number;
  const testEmail = `test-${Date.now()}@example.com`;

  it("should create a new system user", async () => {
    const caller = createCaller();
    const result = await caller.systemUsers.create({
      name: "João Silva",
      phone: "(11) 98765-4321",
      email: testEmail,
      password: "senha123",
      profile: "lider_financeiro",
      companyIds: [1], // GP1
      eventIds: [],
    });

    expect(result.success).toBe(true);
    expect(result.id).toBeTypeOf("number");
    testUserId = result.id;
  });

  it("should list all system users", async () => {
    const caller = createCaller();
    const users = await caller.systemUsers.list();
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);
    
    const createdUser = users.find((u: any) => u.id === testUserId);
    expect(createdUser).toBeDefined();
    expect(createdUser?.name).toBe("João Silva");
    expect(createdUser?.profile).toBe("lider_financeiro");
  });

  it("should get user by id without password", async () => {
    const caller = createCaller();
    const user = await caller.systemUsers.getById({ id: testUserId });
    
    expect(user.name).toBe("João Silva");
    expect(user.email).toBe(testEmail);
    expect(user.profile).toBe("lider_financeiro");
    expect((user as any).passwordHash).toBeUndefined(); // Senha não deve ser retornada
  });

  it("should get user permissions", async () => {
    const caller = createCaller();
    const permissions = await caller.systemUsers.getUserPermissions({ id: testUserId });
    
    expect(permissions.companies).toBeDefined();
    expect(permissions.events).toBeDefined();
    expect(permissions.companies.length).toBe(1);
    expect(permissions.companies[0].companyId).toBe(1);
  });

  it("should update user profile and permissions", async () => {
    const caller = createCaller();
    
    // Buscar eventos existentes
    const events = await db.getAllEvents();
    const eventIds = events.slice(0, 2).map(e => e.id); // Pegar até 2 eventos existentes
    
    await caller.systemUsers.update({
      id: testUserId,
      data: {
        profile: "gerente_regional",
        companyIds: [1],
        eventIds: eventIds.length > 0 ? eventIds : undefined,
      },
    });

    const user = await caller.systemUsers.getById({ id: testUserId });
    expect(user.profile).toBe("gerente_regional");

    if (eventIds.length > 0) {
      const permissions = await caller.systemUsers.getUserPermissions({ id: testUserId });
      expect(permissions.events.length).toBe(eventIds.length);
    }
  });

  it("should update user password", async () => {
    const caller = createCaller();
    await caller.systemUsers.update({
      id: testUserId,
      data: {
        password: "novaSenha456",
      },
    });

    // Verificar que a senha foi atualizada (hash diferente)
    const userFromDb = await db.getSystemUserById(testUserId);
    expect(userFromDb?.passwordHash).toBeDefined();
    expect(userFromDb?.passwordHash).not.toBe("novaSenha456"); // Deve estar em hash
  });

  it("should reject duplicate email", async () => {
    const caller = createCaller();
    
    await expect(
      caller.systemUsers.create({
        name: "Outro Usuário",
        email: testEmail, // Email duplicado
        password: "senha123",
        profile: "monitor",
      })
    ).rejects.toThrow(/Email já cadastrado/);
  });

  it("should delete user", async () => {
    const caller = createCaller();
    await caller.systemUsers.delete({ id: testUserId });

    const users = await db.getAllSystemUsers();
    const deleted = users.find((u) => u.id === testUserId);
    expect(deleted).toBeUndefined();
  });

  it("should reject non-admin user from creating users", async () => {
    const caller = createCaller("user"); // Usuário comum
    
    await expect(
      caller.systemUsers.create({
        name: "Teste",
        email: "teste@example.com",
        password: "senha123",
        profile: "monitor",
      })
    ).rejects.toThrow(/Apenas administradores/);
  });
});

describe("User Permissions Validation", () => {
  it("should validate profile enum values", async () => {
    const caller = createCaller();
    
    await expect(
      caller.systemUsers.create({
        name: "Teste",
        email: `test-${Date.now()}@example.com`,
        password: "senha123",
        profile: "perfil_invalido" as any,
      })
    ).rejects.toThrow();
  });

  it("should validate email format", async () => {
    const caller = createCaller();
    
    await expect(
      caller.systemUsers.create({
        name: "Teste",
        email: "email-invalido",
        password: "senha123",
        profile: "monitor",
      })
    ).rejects.toThrow(/Email inválido/);
  });

  it("should validate password minimum length", async () => {
    const caller = createCaller();
    
    await expect(
      caller.systemUsers.create({
        name: "Teste",
        email: `test-${Date.now()}@example.com`,
        password: "123", // Menos de 6 caracteres
        profile: "monitor",
      })
    ).rejects.toThrow(/no mínimo 6 caracteres/);
  });
});
