import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";

describe("Categories and Subcategories", () => {
  let categoryId: number;
  let subcategoryId: number;

  const createCaller = () => {
    return appRouter.createCaller({
      user: { id: 1, openId: "test-admin", name: "Admin", role: "admin" },
    });
  };

  beforeAll(async () => {
    const caller = createCaller();
    const timestamp = Date.now();
    
    // Criar categoria de despesa
    const category = await caller.categories.create({
      name: `Test Category ${timestamp}`,
      type: "expense",
      description: "Test expense category",
    });
    categoryId = category.id;

    // Criar subcategoria
    const subcategory = await caller.subcategories.create({
      categoryId,
      name: `Test Subcategory ${timestamp}`,
      description: "Test subcategory",
    });
    subcategoryId = subcategory.id;
  });

  it("should create expense category", async () => {
    const caller = createCaller();
    const timestamp = Date.now();
    const category = await caller.categories.create({
      name: `Pessoal ${timestamp}`,
      type: "expense",
      description: "Despesas com pessoal",
    });

    expect(category).toHaveProperty("id");
    expect(category.name).toBe(`Pessoal ${timestamp}`);
    expect(category.type).toBe("expense");
  });

  it("should create revenue category", async () => {
    const caller = createCaller();
    const timestamp = Date.now();
    const category = await caller.categories.create({
      name: `Vendas ${timestamp}`,
      type: "revenue",
      description: "Receitas de vendas",
    });

    expect(category).toHaveProperty("id");
    expect(category.name).toBe(`Vendas ${timestamp}`);
    expect(category.type).toBe("revenue");
  });

  it("should list all categories", async () => {
    const caller = createCaller();
    const categories = await caller.categories.list();

    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBeGreaterThan(0);
  });

  it("should create subcategory linked to category", async () => {
    const caller = createCaller();
    const timestamp = Date.now();
    const subcategory = await caller.subcategories.create({
      categoryId,
      name: `Salários ${timestamp}`,
      description: "Pagamento de salários mensais",
    });

    expect(subcategory).toHaveProperty("id");
    expect(subcategory.name).toBe(`Salários ${timestamp}`);
    expect(subcategory.categoryId).toBe(categoryId);
  });

  it("should list all subcategories", async () => {
    const caller = createCaller();
    const subcategories = await caller.subcategories.list();

    expect(Array.isArray(subcategories)).toBe(true);
    expect(subcategories.length).toBeGreaterThan(0);
  });

  it("should update category", async () => {
    const caller = createCaller();
    const updated = await caller.categories.update({
      id: categoryId,
      data: {
        description: "Updated description",
      },
    });

    expect(updated.description).toBe("Updated description");
  });

  it("should update subcategory", async () => {
    const caller = createCaller();
    const updated = await caller.subcategories.update({
      id: subcategoryId,
      data: {
        description: "Updated subcategory description",
      },
    });

    expect(updated.description).toBe("Updated subcategory description");
  });

  it("should deactivate category", async () => {
    const caller = createCaller();
    await caller.categories.update({
      id: categoryId,
      data: {
        active: 0,
      },
    });

    const categories = await caller.categories.list();
    const deactivated = categories.find(c => c.id === categoryId);
    expect(deactivated?.active).toBe(0);
  });

  it("should deactivate subcategory", async () => {
    const caller = createCaller();
    await caller.subcategories.update({
      id: subcategoryId,
      data: {
        active: 0,
      },
    });

    const subcategories = await caller.subcategories.list();
    const deactivated = subcategories.find(s => s.id === subcategoryId);
    expect(deactivated?.active).toBe(0);
  });

  it("should delete subcategory", async () => {
    const caller = createCaller();
    await caller.subcategories.delete({ id: subcategoryId });

    const subcategories = await caller.subcategories.list();
    const deleted = subcategories.find(s => s.id === subcategoryId);
    expect(deleted).toBeUndefined();
  });

  it("should delete category", async () => {
    const caller = createCaller();
    await caller.categories.delete({ id: categoryId });

    const categories = await caller.categories.list();
    const deleted = categories.find(c => c.id === categoryId);
    expect(deleted).toBeUndefined();
  });
});
