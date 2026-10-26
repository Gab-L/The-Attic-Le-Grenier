import { randomInt } from "node:crypto";
import {
  rarities,
  slots,
  type Definition,
  type Instance,
  type Rarity,
  type Room,
} from "./catalog";
export class GameError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export const requireThat: (
  ok: unknown,
  message: string,
  status?: number,
) => asserts ok = (ok, message, status = 400) => {
  if (!ok) throw new GameError(message, status);
};
export type Distribution = Record<Rarity, number> & { rechargeHours: number };
export function recharge(
  stock: number,
  rechargeAt: Date,
  now: Date,
  hours = 6,
) {
  const interval = hours * 3_600_000;
  if (stock >= 4) return { stock: 4, rechargeAt: now, nextAt: null };
  const elapsed = Math.max(0, now.getTime() - rechargeAt.getTime());
  const added = Math.floor(elapsed / interval);
  const nextStock = Math.min(4, stock + added);
  const anchor =
    nextStock === 4 ? now : new Date(rechargeAt.getTime() + added * interval);
  return {
    stock: nextStock,
    rechargeAt: anchor,
    nextAt: nextStock === 4 ? null : new Date(anchor.getTime() + interval),
  };
}
export function validateDistribution(
  d: Distribution,
  definitions: Definition[],
) {
  requireThat(
    rarities.every((r) => Number.isInteger(d[r]) && d[r] >= 0) &&
      rarities.reduce((sum, r) => sum + d[r], 0) === 100,
    "Les probabilités doivent totaliser 100 %.",
  );
  requireThat(
    Number.isInteger(d.rechargeHours) &&
      d.rechargeHours >= 1 &&
      d.rechargeHours <= 48,
    "Le délai doit être compris entre 1 et 48 heures.",
  );
  for (const r of rarities)
    requireThat(
      definitions.some((item) => item.rarity === r && item.active),
      `La rareté ${r} doit conserver au moins un objet actif.`,
    );
}
export function draw(
  d: Distribution,
  definitions: Definition[],
  random = randomInt,
): Definition {
  const roll = random(100);
  let cursor = 0;
  for (const r of rarities) {
    cursor += d[r];
    if (roll < cursor) {
      const pool = definitions.filter(
        (item) => item.rarity === r && item.active,
      );
      requireThat(pool.length, "Catalogue temporairement indisponible.", 503);
      return pool[random(pool.length)];
    }
  }
  throw new GameError("Distribution incohérente.", 503);
}
export function validateRoom(
  room: Room,
  inventory: Instance[],
  definitions: Definition[],
) {
  const occupied = new Set<string>();
  const placed = new Set<string>();
  for (const p of room.placements) {
    const item = inventory.find((i) => i.id === p.instanceId);
    requireThat(item, "Cet exemplaire ne vous appartient pas.", 403);
    requireThat(
      !item.reserved_trade,
      "Cet exemplaire est réservé pour un échange.",
    );
    requireThat(
      !placed.has(item.id),
      "Un exemplaire ne peut être placé qu’une fois.",
    );
    placed.add(item.id);
    const def = definitions.find((d) => d.id === item.definition_id)!;
    const slot = slots.find((s) => s.id === p.slotId);
    requireThat(
      slot && def.surfaces.includes(slot.surface),
      "Cette surface ne convient pas à cet objet.",
    );
    for (let offset = 0; offset < def.width; offset++) {
      const cell = slots.find(
        (s) => s.row === slot.row && s.index === slot.index + offset,
      );
      requireThat(
        cell && !occupied.has(cell.id),
        "Pas assez de place : les objets ne doivent pas se chevaucher.",
      );
      occupied.add(cell.id);
    }
  }
}
