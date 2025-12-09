import jwt from "jsonwebtoken";
import { ENV } from "./_core/env";

// Interface do payload do JWT
export interface JWTPayload {
  userId: number;
  email: string;
  profile: string;
  name: string;
}

// Gerar token JWT
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, ENV.cookieSecret, {
    expiresIn: "7d", // Token válido por 7 dias
  });
}

// Verificar e decodificar token JWT
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, ENV.cookieSecret) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

// Extrair token do header Authorization
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}
