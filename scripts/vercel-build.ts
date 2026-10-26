import { loadEnvFile } from "node:process";
import { spawnSync } from "node:child_process";
import { siteOrigin } from "../src/lib/site-url";

try {
  loadEnvFile(".env");
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
}

if (!process.env.DATABASE_URL && process.env.POSTGRES_URL)
  process.env.DATABASE_URL = process.env.POSTGRES_URL;
if (!process.env.DATABASE_URL) {
  console.error(
    "Connectez une base PostgreSQL (Neon) au projet Vercel, afin de fournir DATABASE_URL, puis relancez le déploiement.",
  );
  process.exit(1);
}
if (
  !process.env.BETTER_AUTH_SECRET ||
  process.env.BETTER_AUTH_SECRET.length < 32
) {
  console.error(
    "Ajoutez BETTER_AUTH_SECRET dans les variables privées Vercel : une valeur aléatoire d’au moins 32 caractères.",
  );
  process.exit(1);
}
siteOrigin();
for (const args of [
  ["--import", "tsx", "scripts/migrate.ts"],
  ["--import", "tsx", "scripts/seed.ts"],
  ["node_modules/next/dist/bin/next", "build", "--webpack"],
]) {
  const result = spawnSync(process.execPath, args, {
    stdio: "inherit",
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
