import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { SystemUser } from "../../drizzle/schema";
import { authenticateJWT } from "../jwtAuth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: SystemUser | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: SystemUser | null = null;

  try {
    // Usa autenticação JWT ao invés de OAuth
    user = await authenticateJWT(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
