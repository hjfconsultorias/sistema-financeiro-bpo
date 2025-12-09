import { describe, it, expect, beforeEach } from "vitest";
import { generateToken, verifyToken, extractToken } from "./jwtAuth";
import type { Request } from "express";

describe("JWT Authentication", () => {
  describe("generateToken", () => {
    it("deve gerar um token JWT válido", () => {
      const token = generateToken(1, "teste@exemplo.com");
      expect(token).toBeTruthy();
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3); // JWT tem 3 partes: header.payload.signature
    });

    it("deve gerar tokens diferentes para usuários diferentes", () => {
      const token1 = generateToken(1, "usuario1@exemplo.com");
      const token2 = generateToken(2, "usuario2@exemplo.com");
      expect(token1).not.toBe(token2);
    });
  });

  describe("verifyToken", () => {
    it("deve validar um token JWT válido", () => {
      const token = generateToken(1, "teste@exemplo.com");
      const payload = verifyToken(token);
      
      expect(payload).toBeTruthy();
      expect(payload?.userId).toBe(1);
      expect(payload?.email).toBe("teste@exemplo.com");
    });

    it("deve rejeitar um token inválido", () => {
      const invalidToken = "token.invalido.aqui";
      const payload = verifyToken(invalidToken);
      expect(payload).toBeNull();
    });

    it("deve rejeitar um token vazio", () => {
      const payload = verifyToken("");
      expect(payload).toBeNull();
    });

    it("deve incluir timestamp de criação (iat) no payload", () => {
      const token = generateToken(1, "teste@exemplo.com");
      const payload = verifyToken(token);
      
      expect(payload).toBeTruthy();
      expect(payload?.iat).toBeTruthy();
      expect(typeof payload?.iat).toBe("number");
    });

    it("deve incluir timestamp de expiração (exp) no payload", () => {
      const token = generateToken(1, "teste@exemplo.com");
      const payload = verifyToken(token);
      
      expect(payload).toBeTruthy();
      expect(payload?.exp).toBeTruthy();
      expect(typeof payload?.exp).toBe("number");
      
      // Token deve expirar em 7 dias (604800 segundos)
      const now = Math.floor(Date.now() / 1000);
      const expectedExpiration = now + 604800;
      expect(payload?.exp).toBeGreaterThan(now);
      expect(payload?.exp).toBeLessThanOrEqual(expectedExpiration + 10); // margem de 10 segundos
    });
  });

  describe("extractToken", () => {
    it("deve extrair token do header Authorization Bearer", () => {
      const mockRequest = {
        headers: {
          authorization: "Bearer meu-token-jwt",
        },
      } as Request;

      const token = extractToken(mockRequest);
      expect(token).toBe("meu-token-jwt");
    });

    it("deve retornar null se não houver header Authorization", () => {
      const mockRequest = {
        headers: {},
      } as Request;

      const token = extractToken(mockRequest);
      expect(token).toBeNull();
    });

    it("deve retornar null se Authorization não começar com Bearer", () => {
      const mockRequest = {
        headers: {
          authorization: "Basic usuario:senha",
        },
      } as Request;

      const token = extractToken(mockRequest);
      expect(token).toBeNull();
    });

    it("deve extrair token do cookie authToken", () => {
      const mockRequest = {
        headers: {
          cookie: "authToken=meu-token-cookie; outrocookie=valor",
        },
      } as Request;

      const token = extractToken(mockRequest);
      expect(token).toBe("meu-token-cookie");
    });

    it("deve priorizar header Authorization sobre cookie", () => {
      const mockRequest = {
        headers: {
          authorization: "Bearer token-do-header",
          cookie: "authToken=token-do-cookie",
        },
      } as Request;

      const token = extractToken(mockRequest);
      expect(token).toBe("token-do-header");
    });

    it("deve retornar null se não houver token em nenhum lugar", () => {
      const mockRequest = {
        headers: {},
      } as Request;

      const token = extractToken(mockRequest);
      expect(token).toBeNull();
    });
  });

  describe("Fluxo completo de autenticação", () => {
    it("deve gerar, validar e extrair token corretamente", () => {
      // 1. Gerar token
      const userId = 42;
      const email = "usuario@exemplo.com";
      const token = generateToken(userId, email);
      
      // 2. Simular requisição com token
      const mockRequest = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      } as Request;
      
      // 3. Extrair token da requisição
      const extractedToken = extractToken(mockRequest);
      expect(extractedToken).toBe(token);
      
      // 4. Validar token extraído
      const payload = verifyToken(extractedToken!);
      expect(payload).toBeTruthy();
      expect(payload?.userId).toBe(userId);
      expect(payload?.email).toBe(email);
    });
  });
});
