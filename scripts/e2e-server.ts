import { Pool } from "pg";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
const url = new URL(process.env.DATABASE_URL!);
const admin = new Pool({ connectionString: url.toString() });
try {
  if (
    !(
      await admin.query("SELECT 1 FROM pg_database WHERE datname='grenier_e2e'")
    ).rowCount
  )
    await admin.query("CREATE DATABASE grenier_e2e");
} finally {
  await admin.end();
}
url.pathname = "/grenier_e2e";
process.env.DATABASE_URL = url.toString();
process.env.BETTER_AUTH_URL = "http://localhost:3100";
process.env.BETTER_AUTH_SECRET = randomBytes(48).toString("base64url");
process.env.NEXT_DIST_DIR = ".next-e2e";
// This database is reserved for disposable browser tests, never development data.
const database = new Pool({ connectionString: url.toString() });
try {
  await database.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public");
  for (const f of (await readdir("migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await database.query(await readFile(`migrations/${f}`, "utf8"));
} finally {
  await database.end();
}
await import("./seed");
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "dev",
    "--port",
    "3100",
    "--hostname",
    "127.0.0.1",
  ],
  { stdio: "inherit", env: process.env },
);
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 0));
