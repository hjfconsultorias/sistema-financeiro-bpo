import jwt from "jsonwebtoken";
import type { Request } from "express";
import { getSystemUserById } from "./db";
import type { SystemUser } from "../drizzle/schema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export interface JwtPayload {
  userId: number;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Extrai o token JWT do header Authorization ou do cookie
 */
export function extractToken(req: Request): string | null {
  // Tenta extrair do header Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Tenta extrair do cookie (para compatibilidade com requests do browser)
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    if (cookies.authToken) {
      return cookies.authToken;
    }
  }

  return null;
}

/**
 * Valida o token JWT e retorna o payload decodificado
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

/**
 * Autentica a requisição usando JWT e retorna o usuário completo
 */
export async function authenticateJWT(req: Request): Promise<SystemUser | null> {
  const token = extractToken(req);
  
  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  
  if (!payload) {
    return null;
  }

  // Busca o usuário completo no banco de dados
  const user = await getSystemUserById(payload.userId);
  
  return user;
}

/**
 * Gera um novo token JWT para o usuário
 */
export function generateToken(userId: number, email: string): string {
  const payload: JwtPayload = {
    userId,
    email,
  };

  // Token expira em 7 dias
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
