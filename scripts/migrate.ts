import { readFile, readdir } from "node:fs/promises";
import { pool, transaction } from "../src/lib/db";
try {
  await transaction(async (c) => {
    await c.query(
      "SELECT pg_advisory_xact_lock(hashtext('grenier-migrations'))",
    );
    await c.query(
      "CREATE TABLE IF NOT EXISTS migrations (name text PRIMARY KEY, applied_at timestamptz DEFAULT now())",
    );
    for (const name of (await readdir("migrations"))
      .filter((n) => n.endsWith(".sql"))
      .sort()) {
      if (
        (await c.query("SELECT 1 FROM migrations WHERE name=$1", [name]))
          .rowCount
      )
        continue;
      await c.query(await readFile(`migrations/${name}`, "utf8"));
      await c.query("INSERT INTO migrations(name) VALUES($1)", [name]);
      console.log(`Migration appliquée : ${name}`);
    }
  });
} finally {
  await pool.end();
}
