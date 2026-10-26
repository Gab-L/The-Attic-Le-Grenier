import { Pool, type PoolClient } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
const globalDb = globalThis as unknown as { grenierPool?: Pool };
export const pool =
  globalDb.grenierPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    max: 10,
  });
if (process.env.NODE_ENV !== "production") globalDb.grenierPool = pool;
export const db = drizzle(pool, { schema });
export async function transaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
