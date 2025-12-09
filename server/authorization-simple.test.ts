import { describe, it, expect } from "vitest";
import * as auth from "./authorization";

describe("Sistema de Autorização - Helpers", () => {
  describe("Verificação de Acesso Global", () => {
    it("Administrador deve ter acesso global", () => {
      expect(auth.hasGlobalAccess("administrador")).toBe(true);
    });

    it("Gerente Geral deve ter acesso global", () => {
      expect(auth.hasGlobalAccess("gerente_geral")).toBe(true);
    });

    it("Líder Financeiro deve ter acesso global", () => {
      expect(auth.hasGlobalAccess("lider_financeiro")).toBe(true);
    });

    it("Gerente Regional NÃO deve ter acesso global", () => {
      expect(auth.hasGlobalAccess("gerente_regional")).toBe(false);
    });

    it("Líder de Evento NÃO deve ter acesso global", () => {
      expect(auth.hasGlobalAccess("lider_evento")).toBe(false);
    });
  });

  describe("Verificação de Escopo por Empresa", () => {
    it("Gerente Regional deve ter escopo por empresa", () => {
      expect(auth.isCompanyScoped("gerente_regional")).toBe(true);
    });

    it("Administrador NÃO deve ter escopo por empresa", () => {
      expect(auth.isCompanyScoped("administrador")).toBe(false);
    });

    it("Líder de Evento NÃO deve ter escopo por empresa", () => {
      expect(auth.isCompanyScoped("lider_evento")).toBe(false);
    });
  });

  describe("Verificação de Escopo por Evento", () => {
    it("Líder de Evento deve ter escopo por evento", () => {
      expect(auth.isEventScoped("lider_evento")).toBe(true);
    });

    it("Sublíder de Evento deve ter escopo por evento", () => {
      expect(auth.isEventScoped("sublider_evento")).toBe(true);
    });

    it("Caixa de Entrada deve ter escopo por evento", () => {
      expect(auth.isEventScoped("caixa_entrada")).toBe(true);
    });

    it("Monitor deve ter escopo por evento", () => {
      expect(auth.isEventScoped("monitor")).toBe(true);
    });

    it("Administrador NÃO deve ter escopo por evento", () => {
      expect(auth.isEventScoped("administrador")).toBe(false);
    });

    it("Gerente Regional NÃO deve ter escopo por evento", () => {
      expect(auth.isEventScoped("gerente_regional")).toBe(false);
    });
  });

  describe("Permissões de Gerenciamento", () => {
    it("Apenas Administrador pode gerenciar usuários", () => {
      expect(auth.canManageUsers("administrador")).toBe(true);
      expect(auth.canManageUsers("gerente_geral")).toBe(false);
      expect(auth.canManageUsers("lider_evento")).toBe(false);
    });

    it("Perfis financeiros podem gerenciar categorias", () => {
      expect(auth.canManageCategories("administrador")).toBe(true);
      expect(auth.canManageCategories("gerente_geral")).toBe(true);
      expect(auth.canManageCategories("lider_financeiro")).toBe(true);
      expect(auth.canManageCategories("lider_evento")).toBe(false);
    });

    it("Monitor NÃO pode gerenciar lançamentos financeiros", () => {
      expect(auth.canManageFinancials("monitor")).toBe(false);
    });

    it("Outros perfis podem gerenciar lançamentos financeiros", () => {
      expect(auth.canManageFinancials("administrador")).toBe(true);
      expect(auth.canManageFinancials("lider_evento")).toBe(true);
      expect(auth.canManageFinancials("caixa_entrada")).toBe(true);
    });

    it("Perfis de gestão podem aprovar lançamentos", () => {
      expect(auth.canApproveFinancials("administrador")).toBe(true);
      expect(auth.canApproveFinancials("gerente_geral")).toBe(true);
      expect(auth.canApproveFinancials("gerente_regional")).toBe(true);
      expect(auth.canApproveFinancials("lider_financeiro")).toBe(true);
      expect(auth.canApproveFinancials("lider_evento")).toBe(false);
    });
  });
});
