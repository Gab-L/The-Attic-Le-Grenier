import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { pool, transaction } from "./db";
import {
  collections,
  type Definition,
  type Instance,
  type Room,
} from "./catalog";
import {
  draw,
  recharge,
  requireThat,
  validateDistribution,
  validateRoom,
  type Distribution,
} from "./rules";

export type Player = {
  id: string;
  user_id: string;
  handle: string;
  role: string;
  created_at: Date;
  stock: number;
  recharge_at: Date;
  room: Room;
  room_version: number;
  public: boolean;
  share_id: string;
  favorites: string[];
  discoveries: string[];
  rewards: string[];
  badges: string[];
  is_anonymous: boolean;
};
export type OpeningResult = {
  instanceId: string;
  definitionId: string;
  isNew: boolean;
};
export type Opening = {
  id: string;
  created_at: string;
  results: OpeningResult[];
  replayed?: boolean;
};
export type Trade = {
  id: string;
  sender_id: string;
  recipient_id: string;
  sender: string;
  recipient: string;
  status: string;
  offered: string[];
  requested: string[];
  created_at: string;
  expires_at: string;
  items: { id: string; definition_id: string }[];
};
export type GameState = {
  player: Omit<Player, "user_id" | "recharge_at" | "created_at"> & {
    created_at: string;
  };
  inventory: Instance[];
  definitions: Definition[];
  collections: typeof collections;
  settings: Distribution;
  nextAt: string | null;
  serverNow: string;
  openings: Opening[];
  notifications: { id: string; message: string; read: boolean }[];
};
export async function gameLock(c: PoolClient) {
  await c.query("SELECT pg_advisory_xact_lock(hashtext('grenier-game'))");
}
async function expire(c: PoolClient) {
  await c.query(
    "WITH expired AS (UPDATE trades SET status='expired',updated_at=clock_timestamp() WHERE status='pending' AND expires_at<=clock_timestamp() RETURNING id) UPDATE instances SET reserved_trade=NULL WHERE reserved_trade IN (SELECT id FROM expired)",
  );
}
export async function rate(
  c: PoolClient,
  key: string,
  limit: number,
  seconds = 60,
) {
  const {
    rows: [r],
  } = await c.query(
    `INSERT INTO rate_buckets(key,count,reset_at) VALUES($1,1,now()+$2*interval '1 second')
 ON CONFLICT(key) DO UPDATE SET count=CASE WHEN rate_buckets.reset_at<=now() THEN 1 ELSE rate_buckets.count+1 END,
 reset_at=CASE WHEN rate_buckets.reset_at<=now() THEN now()+$2*interval '1 second' ELSE rate_buckets.reset_at END RETURNING count`,
    [key, seconds],
  );
  requireThat(
    r.count <= limit,
    "Un petit instant… Trop de tentatives. Réessayez dans une minute.",
    429,
  );
}
async function loadPlayer(c: PoolClient, userId: string): Promise<Player> {
  const {
    rows: [user],
  } = await c.query('SELECT id,username,is_anonymous FROM "user" WHERE id=$1', [
    userId,
  ]);
  requireThat(user, "Connectez-vous pour continuer.", 401);
  await c.query(
    "INSERT INTO players(id,user_id,handle,share_id) VALUES($1,$2,$3,$4) ON CONFLICT(user_id) DO NOTHING",
    [
      randomUUID(),
      userId,
      user.username ||
        `invite_${userId.replace(/[^a-z0-9]/gi, "").slice(0, 18)}`,
      randomUUID(),
    ],
  );
  const {
    rows: [p],
  } = await c.query(
    'SELECT p.*,u.is_anonymous FROM players p JOIN "user" u ON u.id=p.user_id WHERE p.user_id=$1 FOR UPDATE OF p',
    [userId],
  );
  return p;
}
export async function withGame<T>(
  userId: string,
  fn: (c: PoolClient, p: Player) => Promise<T>,
  registered = false,
): Promise<T> {
  // The savepoint preserves expiration and request accounting even when an action
  // fails. All state changes still share one lock, including a request queued
  // just before an exchange expires.
  const outcome = await transaction<{ value: T } | { error: unknown }>(
    async (c) => {
      await gameLock(c);
      await expire(c);
      try {
        await rate(c, `requests:${userId}`, 180);
      } catch (error) {
        return { error };
      }
      await c.query("SAVEPOINT game_action");
      try {
        const p = await loadPlayer(c, userId);
        if (registered)
          requireThat(
            !p.is_anonymous,
            "Créez un compte pour accéder aux échanges.",
            403,
          );
        const value = await fn(c, p);
        await c.query("RELEASE SAVEPOINT game_action");
        return { value };
      } catch (error) {
        await c.query("ROLLBACK TO SAVEPOINT game_action");
        return { error };
      }
    },
  );
  if ("error" in outcome) throw outcome.error;
  return outcome.value;
}
async function settings(c: PoolClient): Promise<Distribution> {
  return (await c.query("SELECT value FROM settings WHERE id='distribution'"))
    .rows[0].value;
}
async function definitions(c: PoolClient): Promise<Definition[]> {
  return (await c.query("SELECT * FROM definitions ORDER BY collection_id,id"))
    .rows;
}
async function inventory(c: PoolClient, id: string): Promise<Instance[]> {
  return (
    await c.query(
      "SELECT * FROM instances WHERE owner_id=$1 ORDER BY acquired_at DESC,id",
      [id],
    )
  ).rows;
}
async function updateProgress(
  c: PoolClient,
  p: Player,
  discovered: string[] = [],
) {
  const discoveries = [...new Set([...p.discoveries, ...discovered])];
  const defs = await definitions(c);
  const rewards = [
    ...new Set([
      ...p.rewards,
      ...collections
        .filter((group) =>
          defs
            .filter((d) => d.collection_id === group.id)
            .every((d) => discoveries.includes(d.id)),
        )
        .map((g) => g.id),
    ]),
  ];
  const badges = new Set(p.badges);
  if (
    (await c.query("SELECT 1 FROM openings WHERE player_id=$1 LIMIT 1", [p.id]))
      .rowCount
  )
    badges.add("first");
  if (p.room.placements.length >= 5) badges.add("decorator");
  if (rewards.length) badges.add("collection");
  if (discoveries.length >= 10) badges.add("ten");
  if (discoveries.length >= 20) badges.add("twenty");
  await c.query(
    "UPDATE players SET discoveries=$2,rewards=$3,badges=$4 WHERE id=$1",
    [
      p.id,
      JSON.stringify(discoveries),
      JSON.stringify(rewards),
      JSON.stringify([...badges]),
    ],
  );
}
export async function getState(userId: string): Promise<GameState> {
  return withGame(userId, async (c, p) => {
    const rules = await settings(c);
    const now = new Date();
    const stock = recharge(p.stock, p.recharge_at, now, rules.rechargeHours);
    await c.query("UPDATE players SET stock=$2,recharge_at=$3 WHERE id=$1", [
      p.id,
      stock.stock,
      stock.rechargeAt,
    ]);
    // Private user identifiers and authentication data never enter game responses.
    const { user_id: _uid, recharge_at: _ra, ...safe } = p;
    void _uid;
    void _ra;
    return {
      player: {
        ...safe,
        stock: stock.stock,
        created_at: p.created_at.toISOString(),
      },
      definitions: await definitions(c),
      collections,
      inventory: await inventory(c, p.id),
      settings: rules,
      nextAt: stock.nextAt?.toISOString() ?? null,
      serverNow: now.toISOString(),
      openings: (
        await c.query(
          "SELECT id,created_at,results FROM openings WHERE player_id=$1 ORDER BY created_at DESC LIMIT 10",
          [p.id],
        )
      ).rows,
      notifications: (
        await c.query(
          "SELECT id,message,read FROM notifications WHERE player_id=$1 ORDER BY created_at DESC LIMIT 20",
          [p.id],
        )
      ).rows,
    };
  });
}
export async function openBox(userId: string, key: string): Promise<Opening> {
  return withGame(userId, async (c, p) => {
    const previous = (
      await c.query(
        "SELECT id,created_at,results FROM openings WHERE player_id=$1 AND idempotency_key=$2",
        [p.id, key],
      )
    ).rows[0];
    if (previous) return { ...previous, replayed: true };
    await rate(c, `open:${p.id}`, 12);
    const config = await settings(c);
    const defs = await definitions(c);
    validateDistribution(config, defs);
    const now = new Date();
    const stock = recharge(p.stock, p.recharge_at, now, config.rechargeHours);
    requireThat(
      stock.stock > 0,
      "Votre prochain carton se prépare. Revenez après la recharge.",
      409,
    );
    const id = randomUUID();
    const seen = new Set(p.discoveries);
    const results: OpeningResult[] = [];
    for (let i = 0; i < 3; i++) {
      const d = draw(config, defs);
      const instanceId = randomUUID();
      results.push({ instanceId, definitionId: d.id, isNew: !seen.has(d.id) });
      seen.add(d.id);
      await c.query(
        "INSERT INTO instances(id,definition_id,owner_id,origin) VALUES($1,$2,$3,$4)",
        [instanceId, d.id, p.id, `opening:${id}`],
      );
    }
    await c.query(
      "INSERT INTO openings(id,player_id,idempotency_key,results) VALUES($1,$2,$3,$4)",
      [id, p.id, key, JSON.stringify(results)],
    );
    await c.query("UPDATE players SET stock=$2,recharge_at=$3 WHERE id=$1", [
      p.id,
      stock.stock - 1,
      stock.rechargeAt,
    ]);
    await updateProgress(
      c,
      p,
      results.map((r) => r.definitionId),
    );
    return { id, created_at: now.toISOString(), results };
  });
}
export async function saveRoom(userId: string, room: Room, version: number) {
  return withGame(userId, async (c, p) => {
    requireThat(
      p.room_version === version,
      "La chambre a changé dans un autre onglet. Rechargez-la avant de recommencer.",
      409,
    );
    validateRoom(room, await inventory(c, p.id), await definitions(c));
    await c.query(
      "UPDATE players SET room=$2,room_version=room_version+1 WHERE id=$1",
      [p.id, JSON.stringify(room)],
    );
    p.room = room;
    await updateProgress(c, p);
    return { version: version + 1 };
  });
}
export async function profileAction(
  userId: string,
  action: { public?: boolean; favorite?: string; readNotifications?: boolean },
) {
  return withGame(userId, async (c, p) => {
    if (action.public !== undefined)
      await c.query("UPDATE players SET public=$2 WHERE id=$1", [
        p.id,
        action.public,
      ]);
    if (action.favorite) {
      requireThat(
        (
          await c.query("SELECT 1 FROM definitions WHERE id=$1", [
            action.favorite,
          ])
        ).rowCount,
        "Objet inconnu.",
      );
      const favorites = p.favorites.includes(action.favorite)
        ? p.favorites.filter((id) => id !== action.favorite)
        : [...p.favorites, action.favorite];
      await c.query("UPDATE players SET favorites=$2 WHERE id=$1", [
        p.id,
        JSON.stringify(favorites),
      ]);
    }
    if (action.readNotifications)
      await c.query("UPDATE notifications SET read=true WHERE player_id=$1", [
        p.id,
      ]);
    return { ok: true };
  });
}
export async function publicRoom(shareId: string) {
  const {
    rows: [p],
  } = await pool.query(
    "SELECT id,handle,created_at,room,badges,rewards FROM players WHERE share_id=$1 AND public=true",
    [shareId],
  );
  requireThat(p, "Cette chambre est privée ou introuvable.", 404);
  const items = (
    await pool.query(
      "SELECT id,definition_id FROM instances WHERE owner_id=$1 AND id=ANY($2::uuid[])",
      [
        p.id,
        p.room.placements.map((x: { instanceId: string }) => x.instanceId),
      ],
    )
  ).rows;
  // Expose only displayed objects; never the complete inventory or account email.
  const defs = (
    await pool.query("SELECT * FROM definitions WHERE id=ANY($1::text[])", [
      items.map((i) => i.definition_id),
    ])
  ).rows;
  return {
    handle: p.handle,
    joined: p.created_at,
    room: p.room as Room,
    badges: p.badges as string[],
    rewards: p.rewards as string[],
    items: items as Pick<Instance, "id" | "definition_id">[],
    definitions: defs as Definition[],
  };
}
async function canContact(c: PoolClient, a: string, b: string) {
  requireThat(a !== b, "Choisissez un autre joueur.");
  requireThat(
    !(
      await c.query(
        "SELECT 1 FROM blocks WHERE (player_id=$1 AND blocked_id=$2) OR (player_id=$2 AND blocked_id=$1)",
        [a, b],
      )
    ).rowCount,
    "Ce joueur n’est pas disponible pour un échange.",
    403,
  );
  const target = (
    await c.query(
      'SELECT p.* FROM players p JOIN "user" u ON u.id=p.user_id WHERE p.id=$1 AND u.is_anonymous=false',
      [b],
    )
  ).rows[0];
  requireThat(target, "Joueur introuvable.", 404);
  return target as Player;
}
export async function searchPlayers(userId: string, q: string) {
  return withGame(
    userId,
    async (c, p) => {
      await rate(c, `search:${p.id}`, 40);
      return (
        await c.query(
          `SELECT p.id,p.handle FROM players p JOIN "user" u ON p.user_id=u.id
  WHERE p.id<>$1 AND NOT u.is_anonymous AND p.handle ILIKE $2 AND NOT EXISTS
  (SELECT 1 FROM blocks WHERE (player_id=$1 AND blocked_id=p.id) OR (blocked_id=$1 AND player_id=p.id)) ORDER BY p.handle LIMIT 12`,
          [p.id, `${q.replace(/[%_\\]/g, "\\$&")}%`],
        )
      ).rows as { id: string; handle: string }[];
    },
    true,
  );
}
export async function tradeInventory(userId: string, target: string) {
  return withGame(
    userId,
    async (c, p) => {
      const other = await canContact(c, p.id, target);
      const placed = other.room.placements.map((x) => x.instanceId);
      return (await inventory(c, target))
        .filter((i) => !i.reserved_trade && !placed.includes(i.id))
        .map((i) => ({ id: i.id, definition_id: i.definition_id }));
    },
    true,
  );
}
async function available(
  c: PoolClient,
  ids: string[],
  p: Player,
  allowedReservation: string | null = null,
) {
  const all = await inventory(c, p.id);
  const placed = p.room.placements.map((x) => x.instanceId);
  requireThat(
    ids.length > 0 && ids.length <= 6 && new Set(ids).size === ids.length,
    "Choisissez entre un et six exemplaires distincts.",
  );
  for (const id of ids) {
    const i = all.find((x) => x.id === id);
    requireThat(
      i,
      "Un exemplaire a changé de propriétaire. L’échange ne peut pas aboutir.",
      409,
    );
    requireThat(
      !placed.includes(id),
      "Retirez d’abord cet objet de la chambre.",
      409,
    );
    requireThat(
      !i.reserved_trade || i.reserved_trade === allowedReservation,
      "Un exemplaire est déjà réservé pour un autre échange.",
      409,
    );
  }
  return all.filter((i) => ids.includes(i.id));
}
async function notify(c: PoolClient, id: string, message: string) {
  await c.query(
    "INSERT INTO notifications(id,player_id,message) VALUES($1,$2,$3)",
    [randomUUID(), id, message],
  );
}
export async function proposeTrade(
  userId: string,
  recipientId: string,
  offered: string[],
  requested: string[],
  key: string,
) {
  return withGame(
    userId,
    async (c, p) => {
      const previous = (
        await c.query(
          "SELECT id,status FROM trades WHERE sender_id=$1 AND idempotency_key=$2",
          [p.id, key],
        )
      ).rows[0];
      if (previous) return previous;
      await rate(c, `trade:${p.id}`, 10, 3600);
      const other = await canContact(c, p.id, recipientId);
      await available(c, offered, p);
      await available(c, requested, other);
      const id = randomUUID();
      await c.query(
        "INSERT INTO trades(id,sender_id,recipient_id,offered,requested,idempotency_key) VALUES($1,$2,$3,$4,$5,$6)",
        [id, p.id, recipientId, offered, requested, key],
      );
      await c.query(
        "UPDATE instances SET reserved_trade=$1 WHERE id=ANY($2::uuid[])",
        [id, offered],
      );
      await notify(c, recipientId, `${p.handle} vous propose un échange.`);
      return { id, status: "pending" };
    },
    true,
  );
}
export async function listTrades(userId: string): Promise<Trade[]> {
  return withGame(
    userId,
    async (c, p) => {
      return (
        await c.query(
          `SELECT t.*,s.handle AS sender,r.handle AS recipient,
  (SELECT jsonb_agg(jsonb_build_object('id',i.id,'definition_id',i.definition_id)) FROM instances i WHERE i.id=ANY(t.offered||t.requested)) AS items
  FROM trades t JOIN players s ON s.id=t.sender_id JOIN players r ON r.id=t.recipient_id
  WHERE sender_id=$1 OR recipient_id=$1 ORDER BY created_at DESC LIMIT 50`,
          [p.id],
        )
      ).rows;
    },
    true,
  );
}
export async function actOnTrade(
  userId: string,
  tradeId: string,
  action: "accept" | "decline" | "cancel",
) {
  return withGame(
    userId,
    async (c, p) => {
      const {
        rows: [t],
      } = await c.query("SELECT * FROM trades WHERE id=$1 FOR UPDATE", [
        tradeId,
      ]);
      requireThat(t, "Échange introuvable.", 404);
      requireThat(
        action === "cancel" ? t.sender_id === p.id : t.recipient_id === p.id,
        "Vous ne pouvez pas effectuer cette action.",
        403,
      );
      const finalStatus = {
        accept: "accepted",
        decline: "declined",
        cancel: "cancelled",
      }[action];
      if (t.status === finalStatus) return { status: t.status };
      requireThat(
        t.status === "pending",
        "Cet échange est déjà terminé ou expiré.",
        409,
      );
      if (action === "accept") {
        const sender = await canContact(c, p.id, t.sender_id);
        const sent = await available(c, t.offered, sender, t.id);
        const received = await available(c, t.requested, p);
        await c.query(
          "UPDATE instances SET owner_id=$1,reserved_trade=NULL WHERE id=ANY($2::uuid[])",
          [p.id, t.offered],
        );
        await c.query(
          "UPDATE instances SET owner_id=$1,reserved_trade=NULL WHERE id=ANY($2::uuid[])",
          [sender.id, t.requested],
        );
        await updateProgress(
          c,
          p,
          sent.map((i) => i.definition_id),
        );
        await updateProgress(
          c,
          sender,
          received.map((i) => i.definition_id),
        );
      }
      await c.query(
        "UPDATE instances SET reserved_trade=NULL WHERE reserved_trade=$1",
        [tradeId],
      );
      await c.query(
        "UPDATE trades SET status=$2,updated_at=now() WHERE id=$1",
        [tradeId, finalStatus],
      );
      await notify(
        c,
        p.id === t.sender_id ? t.recipient_id : t.sender_id,
        `L’échange avec ${p.handle} est ${action === "accept" ? "accepté" : action === "decline" ? "refusé" : "annulé"}.`,
      );
      return { status: finalStatus };
    },
    true,
  );
}
export async function socialAction(
  userId: string,
  target: string,
  action: "block" | "unblock" | "report",
  reason?: string,
) {
  return withGame(
    userId,
    async (c, p) => {
      requireThat(target !== p.id, "Vous ne pouvez pas vous cibler.");
      requireThat(
        (await c.query("SELECT 1 FROM players WHERE id=$1", [target])).rowCount,
        "Joueur introuvable.",
        404,
      );
      await rate(c, `social:${p.id}`, 15, 3600);
      if (action === "block") {
        await c.query(
          "INSERT INTO blocks VALUES($1,$2) ON CONFLICT DO NOTHING",
          [p.id, target],
        );
        await c.query(
          `WITH cancelled AS (UPDATE trades SET status='cancelled',updated_at=now() WHERE status='pending' AND ((sender_id=$1 AND recipient_id=$2) OR (sender_id=$2 AND recipient_id=$1)) RETURNING id) UPDATE instances SET reserved_trade=NULL WHERE reserved_trade IN (SELECT id FROM cancelled)`,
          [p.id, target],
        );
      } else if (action === "unblock")
        await c.query(
          "DELETE FROM blocks WHERE player_id=$1 AND blocked_id=$2",
          [p.id, target],
        );
      else
        await c.query(
          "INSERT INTO reports(id,reporter_id,target_id,reason) VALUES($1,$2,$3,$4)",
          [randomUUID(), p.id, target, reason],
        );
      return { ok: true };
    },
    true,
  );
}
export async function listBlocks(userId: string) {
  return withGame(
    userId,
    async (c, p) =>
      (
        await c.query(
          "SELECT p.id,p.handle FROM blocks b JOIN players p ON p.id=b.blocked_id WHERE b.player_id=$1",
          [p.id],
        )
      ).rows as { id: string; handle: string }[],
    true,
  );
}
export async function reportPublicRoom(
  userId: string,
  shareId: string,
  reason: string,
) {
  const {
    rows: [target],
  } = await pool.query(
    "SELECT id FROM players WHERE share_id=$1 AND public=true",
    [shareId],
  );
  requireThat(target, "Cette chambre est privée ou introuvable.", 404);
  return socialAction(userId, target.id, "report", reason);
}
export async function getAdmin(userId: string) {
  return withGame(userId, async (c, p) => {
    requireThat(p.role === "admin", "Accès administrateur requis.", 403);
    return {
      definitions: await definitions(c),
      settings: await settings(c),
      reports: (
        await c.query(
          "SELECT r.*,p.handle FROM reports r JOIN players p ON p.id=r.target_id ORDER BY r.created_at DESC LIMIT 100",
        )
      ).rows,
      openings: (
        await c.query(
          "SELECT o.id,o.created_at,p.handle,o.results FROM openings o JOIN players p ON p.id=o.player_id ORDER BY o.created_at DESC LIMIT 50",
        )
      ).rows,
      trades: (
        await c.query(
          "SELECT id,status,created_at FROM trades ORDER BY created_at DESC LIMIT 50",
        )
      ).rows,
      audit: (
        await c.query(
          "SELECT action,details,created_at FROM audit ORDER BY created_at DESC LIMIT 50",
        )
      ).rows,
    };
  });
}
export async function updateAdmin(
  userId: string,
  change: {
    definition?: {
      id: string;
      name: string;
      description: string;
      active: boolean;
      rarity: Definition["rarity"];
    };
    settings?: Distribution;
    reportId?: string;
  },
) {
  return withGame(userId, async (c, p) => {
    requireThat(p.role === "admin", "Accès administrateur requis.", 403);
    const defs = await definitions(c);
    const config = await settings(c);
    if (change.definition) {
      const d = change.definition;
      requireThat(
        defs.some((x) => x.id === d.id),
        "Objet inconnu.",
      );
      validateDistribution(
        config,
        defs.map((x) => (x.id === d.id ? { ...x, ...d } : x)),
      );
      await c.query(
        "UPDATE definitions SET name=$2,description=$3,active=$4,rarity=$5 WHERE id=$1",
        [d.id, d.name, d.description, d.active, d.rarity],
      );
    }
    if (change.settings) {
      validateDistribution(change.settings, defs);
      // Settle every existing recharge under the old interval before changing it.
      const all = (await c.query("SELECT id,stock,recharge_at FROM players"))
        .rows;
      const now = new Date();
      for (const player of all) {
        const updated = recharge(
          player.stock,
          player.recharge_at,
          now,
          config.rechargeHours,
        );
        const fraction =
          (now.getTime() - updated.rechargeAt.getTime()) /
          (config.rechargeHours * 3_600_000);
        const anchor = new Date(
          now.getTime() - fraction * change.settings.rechargeHours * 3_600_000,
        );
        await c.query(
          "UPDATE players SET stock=$2,recharge_at=$3 WHERE id=$1",
          [player.id, updated.stock, anchor],
        );
      }
      await c.query("UPDATE settings SET value=$1 WHERE id='distribution'", [
        JSON.stringify(change.settings),
      ]);
    }
    if (change.reportId)
      await c.query("UPDATE reports SET status='resolved' WHERE id=$1", [
        change.reportId,
      ]);
    await c.query(
      "INSERT INTO audit(actor_id,action,details) VALUES($1,$2,$3)",
      [p.id, "configuration", JSON.stringify(change)],
    );
    return { ok: true };
  });
}
