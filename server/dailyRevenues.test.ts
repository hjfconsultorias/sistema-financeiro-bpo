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

describe("Daily Revenues System", () => {
  let testEventId: number;
  let testCategoryId: number;

  beforeAll(async () => {
    // Create test cost center
    const events = await db.getAllEvents();
    if (events.length > 0) {
      testEventId = events[0].id;
    } else {
      testEventId = await db.createCostCenter({
        name: "Test Cost Center",
        description: "For testing",
        active: 1,
      });
    }

    // Get or create test category
    const categories = await db.getAllRevenueCategories();
    if (categories.length > 0) {
      testCategoryId = categories[0].id;
    } else {
      testCategoryId = await db.createRevenueCategory({
        name: "Test Category",
        description: "For testing",
        active: 1,
      });
    }
  });

  it("should create a daily revenue with multiple payment methods", async () => {
    const caller = appRouter.createCaller(createMockContext(1));

    const result = await caller.dailyRevenues.create({
      date: new Date().toISOString().split("T")[0],
      eventId: testEventId,
      revenueCategoryId: testCategoryId,
      cashAmount: 10000, // R$ 100,00
      debitCardAmount: 5000, // R$ 50,00
      creditCardAmount: 7500, // R$ 75,00
      pixAmount: 2500, // R$ 25,00
      notes: "Test revenue",
    });

    expect(result.success).toBe(true);
    expect(result.id).toBeTypeOf("number");
  });

  it("should list all daily revenues", async () => {
    const caller = appRouter.createCaller(createMockContext(1));

    const revenues = await caller.dailyRevenues.list();

    expect(Array.isArray(revenues)).toBe(true);
    expect(revenues.length).toBeGreaterThan(0);
  });

  it("should calculate total amount correctly", async () => {
    const caller = appRouter.createCaller(createMockContext(1));

    const result = await caller.dailyRevenues.create({
      date: new Date().toISOString().split("T")[0],
      eventId: testEventId,
      revenueCategoryId: testCategoryId,
      cashAmount: 1000,
      debitCardAmount: 2000,
      creditCardAmount: 3000,
      pixAmount: 4000,
    });

    const revenue = await caller.dailyRevenues.getById({ id: result.id });

    expect(revenue).toBeDefined();
    expect(revenue?.totalAmount).toBe(10000); // 1000 + 2000 + 3000 + 4000
  });

  it("should filter revenues by cost center", async () => {
    const caller = appRouter.createCaller(createMockContext(1));

    const revenues = await caller.dailyRevenues.list({
      eventId: testEventId,
    });

    expect(Array.isArray(revenues)).toBe(true);
    revenues.forEach((revenue) => {
      expect(revenue.eventId).toBe(testEventId);
    });
  });

  it("should update a daily revenue", async () => {
    const caller = appRouter.createCaller(createMockContext(1));

    // Create a revenue first
    const created = await caller.dailyRevenues.create({
      date: new Date().toISOString().split("T")[0],
      eventId: testEventId,
      revenueCategoryId: testCategoryId,
      cashAmount: 5000,
      debitCardAmount: 0,
      creditCardAmount: 0,
      pixAmount: 0,
    });

    // Update it
    const result = await caller.dailyRevenues.update({
      id: created.id,
      data: {
        cashAmount: 7000,
        pixAmount: 3000,
      },
    });

    expect(result.success).toBe(true);

    // Verify the update
    const updated = await caller.dailyRevenues.getById({ id: created.id });
    expect(updated?.cashAmount).toBe(7000);
    expect(updated?.pixAmount).toBe(3000);
    expect(updated?.totalAmount).toBe(10000); // Should recalculate
  });

  it("should delete a daily revenue", async () => {
    const caller = appRouter.createCaller(createMockContext(1));

    // Create a revenue first
    const created = await caller.dailyRevenues.create({
      date: new Date().toISOString().split("T")[0],
      eventId: testEventId,
      revenueCategoryId: testCategoryId,
      cashAmount: 1000,
      debitCardAmount: 0,
      creditCardAmount: 0,
      pixAmount: 0,
    });

    // Delete it
    const result = await caller.dailyRevenues.delete({ id: created.id });
    expect(result.success).toBe(true);

    // Verify it's deleted by checking if getById throws
    await expect(caller.dailyRevenues.getById({ id: created.id })).rejects.toThrow();
  });
});

describe("Revenue Categories System", () => {
  it("should list all revenue categories", async () => {
    const caller = appRouter.createCaller(createMockContext(1));

    const categories = await caller.revenueCategories.list();

    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBeGreaterThan(0);
  });

  it("should create a revenue category (admin only)", async () => {
    const caller = appRouter.createCaller(createMockContext(1, "admin"));

    const result = await caller.revenueCategories.create({
      name: "Test Category New",
      description: "Testing category creation",
      active: 1,
    });

    expect(result.success).toBe(true);
    expect(result.id).toBeTypeOf("number");
  });

  it("should prevent non-admin from creating categories", async () => {
    const caller = appRouter.createCaller(createMockContext(2, "user"));

    await expect(
      caller.revenueCategories.create({
        name: "Unauthorized Category",
        active: 1,
      })
    ).rejects.toThrow();
  });
});
