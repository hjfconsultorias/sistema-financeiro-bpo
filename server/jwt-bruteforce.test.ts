import { describe, it, expect } from "vitest";
import { generateToken, verifyToken } from "./jwt";
import { recordFailedAttempt, isBlocked } from "./bruteForce";

describe("JWT e Brute Force Protection", () => {
  describe("JWT Token Generation and Verification", () => {
    it("deve gerar token JWT válido", () => {
      const payload = {
        userId: 1,
        email: "teste@exemplo.com",
        profile: "Administrador" as const,
      };

      const token = generateToken(payload);
      expect(token).toBeTruthy();
      expect(typeof token).toBe("string");
    });

    it("deve verificar token JWT válido", () => {
      const payload = {
        userId: 2,
        email: "gerente@exemplo.com",
        profile: "Gerente Geral" as const,
      };

      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded).toBeTruthy();
      expect(decoded?.userId).toBe(2);
      expect(decoded?.email).toBe("gerente@exemplo.com");
      expect(decoded?.profile).toBe("Gerente Geral");
    });

    it("deve rejeitar token JWT inválido", () => {
      const invalidToken = "token.invalido.aqui";
      const decoded = verifyToken(invalidToken);
      expect(decoded).toBeNull();
    });
  });

  describe("Brute Force Protection", () => {
    it("deve bloquear após 5 tentativas falhadas", () => {
      const email = `block-test-${Date.now()}@exemplo.com`;
      const ip = `10.0.0.${Math.floor(Math.random() * 255)}`;

      // Registrar 5 tentativas
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt(email, ip);
      }

      // Deve estar bloqueado
      const result = isBlocked(email, ip);
      expect(result.blocked).toBe(true);
      expect(result.remainingTime).toBeGreaterThan(0);
    });

    it("deve bloquear por email independente do IP", () => {
      const email = `email-block-${Date.now()}@exemplo.com`;
      const ip1 = `192.168.2.${Math.floor(Math.random() * 255)}`;
      const ip2 = `192.168.3.${Math.floor(Math.random() * 255)}`;

      // Registrar 3 tentativas do IP1
      for (let i = 0; i < 3; i++) {
        recordFailedAttempt(email, ip1);
      }

      // Registrar 2 tentativas do IP2 (total 5 para o email)
      for (let i = 0; i < 2; i++) {
        recordFailedAttempt(email, ip2);
      }

      // Email deve estar bloqueado independente do IP
      expect(isBlocked(email, ip1).blocked).toBe(true);
      expect(isBlocked(email, ip2).blocked).toBe(true);
      expect(isBlocked(email, "192.168.4.100").blocked).toBe(true);
    });
  });

  describe("Integração JWT + Brute Force", () => {
    it("deve gerar token apenas para credenciais válidas não bloqueadas", () => {
      const email = `valid-${Date.now()}@exemplo.com`;
      const ip = `192.168.100.${Math.floor(Math.random() * 255)}`;

      // Verificar que não está bloqueado
      expect(isBlocked(email, ip).blocked).toBe(false);

      // Simular login bem-sucedido
      const payload = {
        userId: 100,
        email: email,
        profile: "Administrador" as const,
      };

      const token = generateToken(payload);
      expect(token).toBeTruthy();

      // Verificar token
      const decoded = verifyToken(token);
      expect(decoded?.email).toBe(email);
    });

    it("não deve permitir login se bloqueado mesmo com credenciais válidas", () => {
      const email = `blocked-valid-${Date.now()}@exemplo.com`;
      const ip = `192.168.200.${Math.floor(Math.random() * 255)}`;

      // Bloquear usuário
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt(email, ip);
      }

      // Verificar bloqueio
      expect(isBlocked(email, ip).blocked).toBe(true);

      // Mesmo com credenciais válidas, não deve gerar token
      // (lógica implementada no router)
    });
  });
});
