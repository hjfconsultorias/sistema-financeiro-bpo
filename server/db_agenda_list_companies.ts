import { getDb } from "./db";
import { companies } from "../drizzle/schema";

/**
 * Listar nomes fantasia de todas as empresas (para mensagens de erro)
 */
export async function getAvailableCompanies(): Promise<string> {
  const db = await getDb();
  if (!db) return "N/A";

  const result = await db
    .select({ tradeName: companies.tradeName })
    .from(companies)
    .limit(10);

  return result.map(c => c.tradeName).join(", ");
}
