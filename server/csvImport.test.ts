import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";
import * as db from "./db";

// Mock context for testing
const createMockContext = (userId: number, role: "admin" | "user" = "admin"): Context => ({
  user: {
    id: userId,
    openId: `test-user-${userId}`,
    name: `Test User ${userId}`,
    email: `test${userId}@example.com`,
    loginMethod: "email",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
  req: {} as any,
  res: {} as any,
});

describe("CSV Import System", () => {
  let testEventId: number;
  let testCategoryId: number;
  let testEventName: string;
  let testCategoryName: string;

  beforeAll(async () => {
    // Get or create test cost center
    const events = await db.getAllEvents();
    if (events.length > 0) {
      testEventId = events[0].id;
      testEventName = events[0].name;
    } else {
      testEventId = await db.createCostCenter({
        name: "A FLORESTA",
        description: "Test cost center for import",
        active: 1,
      });
      testEventName = "A FLORESTA";
    }

    // Get or create test category
    const categories = await db.getAllRevenueCategories();
    if (categories.length > 0) {
      testCategoryId = categories[0].id;
      testCategoryName = categories[0].name;
    } else {
      testCategoryId = await db.createRevenueCategory({
        name: "Stand - Serviço Entretenimento",
        description: "Test category for import",
        active: 1,
      });
      testCategoryName = "Stand - Serviço Entretenimento";
    }
  });

  it("should import multiple revenues from CSV data", async () => {
    const caller = appRouter.createCaller(createMockContext(1));

    const csvData = [
      {
        date: "2025-12-01",
        eventName: testEventName,
        categoryName: testCategoryName,
        cashAmount: 10000, // R$ 100,00
        debitCardAmount: 5000, // R$ 50,00
        creditCardAmount: 7500, // R$ 75,00
        pixAmount: 2500, // R$ 25,00
      },
      {
        date: "2025-12-02",
        eventName: testEventName,
        categoryName: testCategoryName,
        cashAmount: 20000,
        debitCardAmount: 10000,
        creditCardAmount: 15000,
        pixAmount: 5000,
      },
    ];

    const result = await caller.dailyRevenues.importFromCSV({ rows: csvData });

    expect(result.success).toBe(2);
    expect(result.errors.length).toBe(0);
  });

  it("should report errors for invalid cost center", async () => {
    const caller = appRouter.createCaller(createMockContext(1));

    const csvData = [
      {
        date: "2025-12-01",
        eventName: "INVALID_CENTER",
        categoryName: testCategoryName,
        cashAmount: 10000,
        debitCardAmount: 0,
        creditCardAmount: 0,
        pixAmount: 0,
      },
    ];

    const result = await caller.dailyRevenues.importFromCSV({ rows: csvData });

    expect(result.success).toBe(0);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].error).toContain("Centro de custo");
  });

  it("should report errors for invalid category", async () => {
    const caller = appRouter.createCaller(createMockContext(1));

    const csvData = [
      {
        date: "2025-12-01",
        eventName: testEventName,
        categoryName: "INVALID_CATEGORY",
        cashAmount: 10000,
        debitCardAmount: 0,
        creditCardAmount: 0,
        pixAmount: 0,
      },
    ];

    const result = await caller.dailyRevenues.importFromCSV({ rows: csvData });

    expect(result.success).toBe(0);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].error).toContain("Categoria");
  });

  it("should handle mixed valid and invalid rows", async () => {
    const caller = appRouter.createCaller(createMockContext(1));

    const csvData = [
      {
        date: "2025-12-01",
        eventName: testEventName,
        categoryName: testCategoryName,
        cashAmount: 10000,
        debitCardAmount: 0,
        creditCardAmount: 0,
        pixAmount: 0,
      },
      {
        date: "2025-12-02",
        eventName: "INVALID_CENTER",
        categoryName: testCategoryName,
        cashAmount: 20000,
        debitCardAmount: 0,
        creditCardAmount: 0,
        pixAmount: 0,
      },
      {
        date: "2025-12-03",
        eventName: testEventName,
        categoryName: testCategoryName,
        cashAmount: 30000,
        debitCardAmount: 0,
        creditCardAmount: 0,
        pixAmount: 0,
      },
    ];

    const result = await caller.dailyRevenues.importFromCSV({ rows: csvData });

    expect(result.success).toBe(2);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].row).toBe(2);
  });

  it("should calculate total correctly during import", async () => {
    const caller = appRouter.createCaller(createMockContext(1));

    const csvData = [
      {
        date: "2025-12-05",
        eventName: testEventName,
        categoryName: testCategoryName,
        cashAmount: 1000,
        debitCardAmount: 2000,
        creditCardAmount: 3000,
        pixAmount: 4000,
      },
    ];

    const result = await caller.dailyRevenues.importFromCSV({ rows: csvData });

    expect(result.success).toBe(1);

    // Get all revenues and find the one we just imported
    const revenues = await caller.dailyRevenues.list();

    // Find by matching all payment amounts (more reliable than date)
    const imported = revenues.find(
      (r) =>
        r.cashAmount === 1000 &&
        r.debitCardAmount === 2000 &&
        r.creditCardAmount === 3000 &&
        r.pixAmount === 4000
    );

    expect(imported).toBeDefined();
    expect(imported?.totalAmount).toBe(10000); // 1000 + 2000 + 3000 + 4000
  });
});
