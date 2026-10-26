import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { Pool } from "pg";
// Isolated database: never reset or seed the development database.
const connection = new URL(process.env.DATABASE_URL!);
const original = new Pool({ connectionString: connection.toString() });
const testDatabase = "grenier_test";
connection.pathname = `/${testDatabase}`;
process.env.DATABASE_URL = connection.toString();
const { pool } = await import("../src/lib/db");
const game = await import("../src/lib/game");
const { catalogue, collections } = await import("../src/lib/catalog");
before(async () => {
  if (
    !(
      await original.query("SELECT 1 FROM pg_database WHERE datname=$1", [
        testDatabase,
      ])
    ).rowCount
  )
    await original.query("CREATE DATABASE grenier_test");
  assert.equal(new URL(process.env.DATABASE_URL!).pathname, "/grenier_test");
  await pool.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public");
  for (const f of (await readdir("migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await pool.query(await readFile(`migrations/${f}`, "utf8"));
  for (const c of collections)
    await pool.query("INSERT INTO collections VALUES($1,$2,$3,$4)", [
      c.id,
      c.name,
      c.description,
      c.reward,
    ]);
  for (const d of catalogue)
    await pool.query(
      "INSERT INTO definitions VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
      [
        d.id,
        d.slug,
        d.name,
        d.description,
        d.period,
        d.category,
        d.collection_id,
        d.rarity,
        d.illustration,
        d.width,
        JSON.stringify(d.surfaces),
        d.active,
      ],
    );
});
after(async () => {
  await pool.end();
  await original.end();
});
async function player(anonymous = false) {
  const id = randomUUID();
  const handle = `test_${id.slice(0, 8)}`;
  await pool.query(
    'INSERT INTO "user"(id,name,email,username,is_anonymous) VALUES($1,$2,$3,$2,$4)',
    [id, handle, `${handle}@example.invalid`, anonymous],
  );
  const state = await game.getState(id);
  return { user: id, id: state.player.id, state };
}
async function give(owner: string, definition = "bille") {
  const id = randomUUID();
  await pool.query(
    "INSERT INTO instances(id,definition_id,owner_id,origin) VALUES($1,$2,$3,'test fixture')",
    [id, definition, owner],
  );
  return id;
}
async function pair() {
  const a = await player(),
    b = await player();
  const x = await give(a.id),
    y = await give(b.id, "yoyo");
  return { a, b, x, y };
}
test("ouverture atomique et idempotente : trois exemplaires et un seul débit", async () => {
  const p = await player(true);
  const key = randomUUID();
  const first = await game.openBox(p.user, key);
  const replay = await game.openBox(p.user, key);
  assert.deepEqual(first.results, replay.results);
  assert.equal(replay.replayed, true);
  const state = await game.getState(p.user);
  assert.equal(state.inventory.length, 3);
  assert.equal(state.player.stock, 0);
  assert.ok(state.player.badges.includes("first"));
});
test("deux ouvertures concurrentes sur le dernier carton : une seule réussite", async () => {
  const p = await player();
  const results = await Promise.allSettled([
    game.openBox(p.user, randomUUID()),
    game.openBox(p.user, randomUUID()),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  const state = await game.getState(p.user);
  assert.equal(state.player.stock, 0);
  assert.equal(state.inventory.length, 3);
});
test("deux requêtes concurrentes avec la même clé renvoient la même ouverture", async () => {
  const p = await player();
  const key = randomUUID();
  const [a, b] = await Promise.all([
    game.openBox(p.user, key),
    game.openBox(p.user, key),
  ]);
  assert.equal(a.id, b.id);
  assert.equal((await game.getState(p.user)).inventory.length, 3);
});
test("recharge persistante après longue absence et stock plein", async () => {
  const p = await player();
  await pool.query(
    "UPDATE players SET stock=0,recharge_at=now()-interval '50 hours' WHERE id=$1",
    [p.id],
  );
  const state = await game.getState(p.user);
  assert.equal(state.player.stock, 4);
  assert.equal(state.nextAt, null);
  await game.openBox(p.user, randomUUID());
  const next = await game.getState(p.user);
  assert.equal(next.player.stock, 3);
  assert.ok(
    new Date(next.nextAt!).getTime() - new Date(next.serverNow).getTime() >
      5.99 * 3600000,
  );
});
test("chambre : propriétaire et version empêchent le vol et l’écrasement concurrent", async () => {
  const { a, b, x } = await pair();
  const room = {
    ...a.state.player.room,
    placements: [{ instanceId: x, slotId: "haut-0" }],
  };
  await assert.rejects(game.saveRoom(b.user, room, 0), /appartient/);
  const results = await Promise.allSettled([
    game.saveRoom(a.user, room, 0),
    game.saveRoom(a.user, { ...room, wall: "pink" }, 0),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal((await game.getState(a.user)).player.room_version, 1);
});
test("partage : privé par défaut, réponses minimales, révocation immédiate", async () => {
  const p = await player();
  await assert.rejects(game.publicRoom(p.state.player.share_id), /privée/);
  const hidden = await give(p.id);
  const visible = await give(p.id, "yoyo");
  await game.saveRoom(
    p.user,
    {
      ...p.state.player.room,
      placements: [{ instanceId: visible, slotId: "haut-0" }],
    },
    0,
  );
  await game.profileAction(p.user, { public: true });
  const page = await game.publicRoom(p.state.player.share_id);
  assert.deepEqual(
    page.items.map((i) => i.id),
    [visible],
  );
  assert.ok(!JSON.stringify(page).includes(hidden));
  assert.ok(!JSON.stringify(page).includes("@example"));
  assert.ok(!("id" in page));
  await game.profileAction(p.user, { public: false });
  await assert.rejects(game.publicRoom(p.state.player.share_id), /privée/);
});
test("échanges : réservations exclusives et interdiction de placer un exemplaire réservé", async () => {
  const { a, b, x, y } = await pair();
  const first = await game.proposeTrade(a.user, b.id, [x], [y], randomUUID());
  await assert.rejects(
    game.proposeTrade(a.user, b.id, [x], [y], randomUUID()),
    /réservé/,
  );
  await assert.rejects(
    game.saveRoom(
      a.user,
      {
        ...a.state.player.room,
        placements: [{ instanceId: x, slotId: "haut-0" }],
      },
      0,
    ),
    /réservé/,
  );
  assert.ok(first.id);
});
test("échanges : acceptation concurrente et idempotente, transfert complet", async () => {
  const { a, b, x, y } = await pair();
  const t = await game.proposeTrade(a.user, b.id, [x], [y], randomUUID());
  const results = await Promise.all([
    game.actOnTrade(b.user, t.id, "accept"),
    game.actOnTrade(b.user, t.id, "accept"),
  ]);
  assert.ok(results.every((r) => r.status === "accepted"));
  assert.equal(
    (await pool.query("SELECT owner_id FROM instances WHERE id=$1", [x]))
      .rows[0].owner_id,
    b.id,
  );
  assert.equal(
    (await pool.query("SELECT owner_id FROM instances WHERE id=$1", [y]))
      .rows[0].owner_id,
    a.id,
  );
  assert.equal(
    (
      await pool.query(
        "SELECT count(*)::int AS n FROM instances WHERE reserved_trade=$1",
        [t.id],
      )
    ).rows[0].n,
    0,
  );
});
test("échanges : annulation, refus, expiration libèrent les réservations", async () => {
  for (const action of ["cancel", "decline", "expire"] as const) {
    const { a, b, x, y } = await pair();
    const t = await game.proposeTrade(a.user, b.id, [x], [y], randomUUID());
    if (action === "expire") {
      await pool.query(
        "UPDATE trades SET expires_at=now()-interval '1 second' WHERE id=$1",
        [t.id],
      );
      await assert.rejects(game.actOnTrade(b.user, t.id, "accept"), /expiré/);
    } else
      await game.actOnTrade(
        action === "cancel" ? a.user : b.user,
        t.id,
        action,
      );
    const instance = (
      await pool.query("SELECT * FROM instances WHERE id=$1", [x])
    ).rows[0];
    assert.equal(instance.owner_id, a.id);
    assert.equal(instance.reserved_trade, null);
  }
});
test("échanges : un objet demandé placé entre-temps empêche tout transfert", async () => {
  const { a, b, x, y } = await pair();
  const t = await game.proposeTrade(a.user, b.id, [x], [y], randomUUID());
  await game.saveRoom(
    b.user,
    {
      ...b.state.player.room,
      placements: [{ instanceId: y, slotId: "haut-0" }],
    },
    0,
  );
  await assert.rejects(game.actOnTrade(b.user, t.id, "accept"), /Retirez/);
  assert.equal(
    (await pool.query("SELECT owner_id FROM instances WHERE id=$1", [x]))
      .rows[0].owner_id,
    a.id,
  );
  assert.equal(
    (await pool.query("SELECT owner_id FROM instances WHERE id=$1", [y]))
      .rows[0].owner_id,
    b.id,
  );
});
test("échanges : seuls les acteurs autorisés agissent, les invités sont exclus", async () => {
  const { a, b, x, y } = await pair();
  const c = await player(),
    guest = await player(true);
  const t = await game.proposeTrade(a.user, b.id, [x], [y], randomUUID());
  await assert.rejects(game.actOnTrade(a.user, t.id, "accept"), /action/);
  await assert.rejects(game.actOnTrade(c.user, t.id, "cancel"), /action/);
  await assert.rejects(game.listTrades(guest.user), /compte/);
});
test("blocage : annulation des propositions et suppression de la recherche", async () => {
  const { a, b, x, y } = await pair();
  const t = await game.proposeTrade(a.user, b.id, [x], [y], randomUUID());
  await game.socialAction(b.user, a.id, "block");
  assert.equal((await game.listTrades(a.user))[0].status, "cancelled");
  await assert.rejects(game.tradeInventory(a.user, b.id), /disponible/);
  assert.equal(
    (await pool.query("SELECT reserved_trade FROM instances WHERE id=$1", [x]))
      .rows[0].reserved_trade,
    null,
  );
  assert.equal(
    (await game.searchPlayers(a.user, b.state.player.handle)).length,
    0,
  );
  await game.socialAction(b.user, a.id, "unblock");
  assert.equal((await game.tradeInventory(a.user, b.id)).length, 1);
  assert.ok(t.id);
});
test("complétion : récompense unique et progression conservée après transfert", async () => {
  const p = await player();
  const ids = catalogue
    .filter((d) => d.collection_id === "recreation")
    .map((d) => d.id);
  await pool.query("UPDATE players SET discoveries=$2 WHERE id=$1", [
    p.id,
    JSON.stringify(ids),
  ]);
  await game.saveRoom(p.user, p.state.player.room, 0);
  await game.saveRoom(p.user, p.state.player.room, 1);
  const state = await game.getState(p.user);
  assert.deepEqual(state.player.rewards, ["recreation"]);
  assert.ok(state.player.badges.includes("collection"));
  assert.equal(state.inventory.length, 0);
});
test("administration : contrôle du rôle, audit, archivage et refus d’une rareté vide", async () => {
  const p = await player();
  await assert.rejects(game.getAdmin(p.user), /administrateur/);
  await assert.rejects(
    game.updateAdmin(p.user, {
      settings: {
        common: 65,
        uncommon: 23,
        rare: 10,
        legendary: 2,
        rechargeHours: 6,
      },
    }),
    /administrateur/,
  );
  await pool.query("UPDATE players SET role='admin' WHERE id=$1", [p.id]);
  const robot = catalogue.find((d) => d.id === "robot")!,
    planete = catalogue.find((d) => d.id === "planete")!;
  await game.updateAdmin(p.user, { definition: { ...robot, active: false } });
  await assert.rejects(
    game.updateAdmin(p.user, { definition: { ...planete, active: false } }),
    /objet actif/,
  );
  assert.ok((await game.getAdmin(p.user)).audit.length > 0);
  await game.updateAdmin(p.user, { definition: { ...robot, active: true } });
});
