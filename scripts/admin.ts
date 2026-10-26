import { pool, transaction } from "../src/lib/db";
import { gameLock } from "../src/lib/game";
const handle = process.argv[2];
const revoke = process.argv.includes("--revoke");
if (!handle) {
  console.error("Usage : npm run admin -- pseudo [--revoke]");
  process.exit(1);
}
try {
  await transaction(async (c) => {
    await gameLock(c);
    const {
      rows: [p],
    } = await c.query(
      'UPDATE players p SET role=$2 FROM "user" u WHERE p.handle=$1 AND p.user_id=u.id AND NOT u.is_anonymous RETURNING p.id',
      [handle, revoke ? "player" : "admin"],
    );
    if (!p)
      throw new Error(
        "Compte inscrit introuvable. Connectez-vous au jeu une fois avant de lancer cette commande.",
      );
    await c.query(
      "INSERT INTO audit(actor_id,action,details) VALUES($1,$2,$3)",
      [
        p.id,
        revoke ? "admin-revoked-cli" : "admin-granted-cli",
        JSON.stringify({ handle }),
      ],
    );
    console.log(
      revoke ? "Rôle administrateur retiré." : "Rôle administrateur attribué.",
    );
  });
} finally {
  await pool.end();
}
