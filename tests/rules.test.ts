import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  catalogue,
  collections,
  type Instance,
  type Room,
} from "../src/lib/catalog";
import {
  draw,
  recharge,
  validateDistribution,
  validateRoom,
} from "../src/lib/rules";
const config = {
  common: 65,
  uncommon: 23,
  rare: 10,
  legendary: 2,
  rechargeHours: 6,
};
const date = new Date("2026-01-01T00:00:00Z");
test("catalogue : 36 dessins distincts, six collections équilibrées et raretés 18/10/6/2", async () => {
  assert.equal(catalogue.length, 36);
  assert.equal(new Set(catalogue.map((d) => d.id)).size, 36);
  assert.deepEqual(
    ["common", "uncommon", "rare", "legendary"].map(
      (r) => catalogue.filter((d) => d.rarity === r).length,
    ),
    [18, 10, 6, 2],
  );
  for (const c of collections)
    assert.equal(catalogue.filter((d) => d.collection_id === c.id).length, 6);
  const illustrations = await Promise.all(
    catalogue.map((d) => readFile(`public${d.illustration}`, "utf8")),
  );
  assert.equal(new Set(illustrations).size, 36);
});
test("recharge : absence partielle, exacte et prolongée", () => {
  assert.equal(recharge(1, date, new Date(+date + 5 * 3600000)).stock, 1);
  assert.equal(recharge(1, date, new Date(+date + 6 * 3600000)).stock, 2);
  const now = new Date(+date + 300 * 3600000);
  const result = recharge(1, date, now);
  assert.equal(result.stock, 4);
  assert.equal(+result.rechargeAt, +now);
  assert.equal(result.nextAt, null);
});
test("recharge : le stock plein ne conserve pas une accumulation cachée", () => {
  const now = new Date(+date + 30 * 3600000);
  const full = recharge(4, date, now);
  const afterOpen = recharge(3, full.rechargeAt, new Date(+now + 3600000));
  assert.equal(afterOpen.stock, 3);
  assert.equal(+afterOpen.nextAt!, +now + 6 * 3600000);
});
test("recharge : une date antérieure ne crée aucun carton", () => {
  assert.equal(recharge(0, date, new Date(+date - 24 * 3600000)).stock, 0);
});
test("distribution : bornes exactes, somme à 100 et objets actifs seulement", () => {
  validateDistribution(config, catalogue);
  for (const [roll, rarity] of [
    [0, "common"],
    [64, "common"],
    [65, "uncommon"],
    [87, "uncommon"],
    [88, "rare"],
    [97, "rare"],
    [98, "legendary"],
    [99, "legendary"],
  ] as const) {
    let n = 0;
    assert.equal(
      draw(config, catalogue, () => (n++ === 0 ? roll : 0)).rarity,
      rarity,
    );
  }
  const defs = catalogue.map((d) => ({ ...d, active: d.id !== "bille" }));
  let n = 0;
  assert.notEqual(draw(config, defs, () => (n++ === 0 ? 0 : 0)).id, "bille");
  assert.throws(() =>
    validateDistribution({ ...config, common: 64 }, catalogue),
  );
  assert.throws(() =>
    validateDistribution(
      config,
      catalogue.map((d) => ({ ...d, active: d.rarity !== "rare" })),
    ),
  );
});
const item = (
  id: string,
  definition_id: string,
  reserved_trade: string | null = null,
) =>
  ({
    id,
    definition_id,
    owner_id: "p",
    acquired_at: "",
    origin: "test",
    reserved_trade,
  }) as Instance;
const room = (placements: Room["placements"]): Room => ({
  theme: "warm",
  wall: "cream",
  floor: "honey",
  placements,
});
test("placement : propriétaire, doublons, réservations et surfaces sont vérifiés", () => {
  assert.throws(() =>
    validateRoom(
      room([{ instanceId: "absent", slotId: "haut-0" }]),
      [],
      catalogue,
    ),
  );
  assert.throws(() =>
    validateRoom(
      room([
        { instanceId: "a", slotId: "haut-0" },
        { instanceId: "a", slotId: "haut-1" },
      ]),
      [item("a", "bille")],
      catalogue,
    ),
  );
  assert.throws(() =>
    validateRoom(
      room([{ instanceId: "a", slotId: "haut-0" }]),
      [item("a", "bille", "trade")],
      catalogue,
    ),
  );
  assert.throws(() =>
    validateRoom(
      room([{ instanceId: "a", slotId: "haut-0" }]),
      [item("a", "tapis")],
      catalogue,
    ),
  );
});
test("placement : empreinte de deux cases, superposition et bords", () => {
  const items = [item("a", "ecran"), item("b", "bille")];
  validateRoom(
    room([
      { instanceId: "a", slotId: "bureau-0" },
      { instanceId: "b", slotId: "bureau-2" },
    ]),
    items,
    catalogue,
  );
  assert.throws(() =>
    validateRoom(
      room([{ instanceId: "a", slotId: "bureau-3" }]),
      items,
      catalogue,
    ),
  );
  assert.throws(() =>
    validateRoom(
      room([
        { instanceId: "a", slotId: "bureau-0" },
        { instanceId: "b", slotId: "bureau-1" },
      ]),
      items,
      catalogue,
    ),
  );
});
