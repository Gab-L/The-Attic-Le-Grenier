import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { slots } from "../src/lib/catalog";
import type { GameState } from "../src/lib/game";
test("visiteur → carton → chambre → compte → partage → privé", async ({
  page,
  browser,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Il était une fois/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Ouvrir mon premier carton",
      exact: true,
    }),
  ).toBeEnabled();
  await page.screenshot({
    path: "test-results/accueil-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Ouvrir mon premier carton", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Vos découvertes" });
  await expect(dialog).toBeVisible();
  const reveal = page.getByRole("button", {
    name: "Tout révéler",
    exact: true,
  });
  if (await reveal.isVisible()) await reveal.click();
  await expect(dialog.locator(".reveal-card.revealed")).toHaveCount(3);
  await expect
    .poll(() =>
      dialog
        .locator(".reveal-art img")
        .evaluateAll((images) =>
          images.every(
            (image) =>
              (image as HTMLImageElement).complete &&
              (image as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
  await page.screenshot({
    path: "test-results/ouverture-desktop.png",
    animations: "disabled",
  });
  await page
    .getByRole("button", { name: "Décorer ma chambre", exact: true })
    .click();
  const state: GameState = await (
    await page.request.get("/api/game/state")
  ).json();
  expect(state.inventory).toHaveLength(3);
  expect(state.player.stock).toBe(0);
  const item = state.inventory[0];
  const def = state.definitions.find((d) => d.id === item.definition_id)!;
  const slot = slots.find(
    (s) => def.surfaces.includes(s.surface) && s.index === 0,
  )!;
  await page.locator(".inventory-item").first().click();
  await page.locator(`[data-slot="${slot.id}"]`).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Enregistré" }),
  ).toBeVisible();
  await expect
    .poll(async () => {
      const s = await (await page.request.get("/api/game/state")).json();
      return s.player.room.placements.length;
    })
    .toBe(1);
  const movedSlot = slots.find((s) => s.row === slot.row && s.index === 2)!;
  await page
    .locator(".inventory-item")
    .first()
    .dragTo(page.locator(`[data-slot="${movedSlot.id}"]`));
  await expect
    .poll(async () => {
      const s = await (await page.request.get("/api/game/state")).json();
      return s.player.room.placements[0].slotId;
    })
    .toBe(movedSlot.id);
  // The same move is possible without drag-and-drop, using only the keyboard.
  await page.locator(".inventory-item").first().focus();
  await page.keyboard.press("Enter");
  await page.locator(`[data-slot="${slot.id}"]`).focus();
  await page.keyboard.press("Enter");
  await expect
    .poll(async () => {
      const s = await (await page.request.get("/api/game/state")).json();
      return s.player.room.placements[0].slotId;
    })
    .toBe(slot.id);
  await page.screenshot({
    path: "test-results/chambre-desktop.png",
    fullPage: true,
  });
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Capturer en PNG" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("ma-chambre-le-grenier.png");
  await download.saveAs("test-results/chambre-export.png");
  await page.getByRole("button", { name: "Collection", exact: true }).click();
  await expect(page.locator(".object-card")).toHaveCount(36);
  await page.locator(".object-card").last().scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      page
        .locator(".object-art img")
        .evaluateAll((images) =>
          images.every(
            (image) =>
              (image as HTMLImageElement).complete &&
              (image as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/collection-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Conserver ma progression" }).click();
  const handle = `e2e_${randomUUID().slice(0, 8)}`;
  await page.getByLabel("Votre pseudo").fill(handle);
  await page.getByLabel("Votre email").fill(`${handle}@example.invalid`);
  await page
    .getByLabel("Mot de passe", { exact: true })
    .fill("Grenier-test-passphrase-42");
  await page
    .getByRole("button", { name: "Créer mon compte et tout conserver" })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  const registered: GameState = await (
    await page.request.get("/api/game/state")
  ).json();
  expect(registered.player.is_anonymous).toBe(false);
  expect(registered.inventory.map((i) => i.id).sort()).toEqual(
    state.inventory.map((i) => i.id).sort(),
  );
  expect(registered.player.room.placements).toHaveLength(1);
  expect(registered.player.stock).toBe(0);
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("checkbox").check();
  await expect(
    page.getByRole("link", { name: "Voir ma page publique" }),
  ).toBeVisible();
  const visitor = await browser.newContext();
  const publicPage = await visitor.newPage();
  await publicPage.goto(`/chambre/${registered.player.share_id}`);
  await expect(
    publicPage.getByRole("heading", { name: `La chambre de ${handle}.` }),
  ).toBeVisible();
  await expect(publicPage.locator(".room-slot")).toHaveCount(0);
  expect(await publicPage.locator("body").innerText()).not.toContain(
    `${handle}@example.invalid`,
  );
  await page.getByRole("checkbox").uncheck();
  await expect(
    page.getByText("Ma chambre est privée", { exact: true }),
  ).toBeVisible();
  const response = await publicPage.goto(
    `/chambre/${registered.player.share_id}`,
  );
  expect(response!.status()).toBe(404);
  await expect(
    publicPage.getByRole("heading", { name: "Cette porte est fermée." }),
  ).toBeVisible();
  await visitor.close();
  expect(errors).toEqual([]);
});
test("mobile 360 px : aucun débordement, navigation et animation réduite", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(
    page.getByRole("button", {
      name: "Ouvrir mon premier carton",
      exact: true,
    }),
  ).toBeEnabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/accueil-mobile.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Ouvrir mon premier carton", exact: true })
    .click();
  await expect(page.locator(".reveal-card.revealed")).toHaveCount(3);
  await page.screenshot({ path: "test-results/ouverture-mobile.png" });
  await page
    .getByRole("button", { name: "Voir ma collection", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/collection-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Ma chambre", exact: true }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/chambre-mobile.png",
    fullPage: true,
  });
  // Exercise a real emulated touch gesture with both source and destination visible.
  await page.setViewportSize({ width: 1024, height: 950 });
  await page.evaluate(() => window.scrollTo(0, 0));
  const state: GameState = await (
    await page.request.get("/api/game/state")
  ).json();
  const def = state.definitions.find(
    (d) => d.id === state.inventory[0].definition_id,
  )!;
  const slot = slots.find(
    (s) => def.surfaces.includes(s.surface) && s.index === 0,
  )!;
  const source = (await page.locator(".inventory-item").first().boundingBox())!;
  const target = (await page
    .locator(`[data-slot="${slot.id}"]`)
    .boundingBox())!;
  const cdp = await page.context().newCDPSession(page);
  const x = source.x + source.width / 2,
    y = source.y + source.height / 2;
  const endX = target.x + target.width / 2,
    endY = target.y + target.height / 2;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  for (let step = 1; step <= 8; step++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { x: x + ((endX - x) * step) / 8, y: y + ((endY - y) * step) / 8 },
      ],
    });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect
    .poll(async () => {
      const s = await (await page.request.get("/api/game/state")).json();
      return s.player.room.placements[0]?.slotId;
    })
    .toBe(slot.id);
  await cdp.detach();
});
test("API : CSRF, session et rôle admin protégés", async ({ request }) => {
  const unauthorized = await request.get("/api/game/state");
  expect(unauthorized.status()).toBe(401);
  const csrf = await request.post("/api/game/open", {
    headers: { Origin: "https://autre.example" },
    data: { key: randomUUID() },
  });
  expect(csrf.status()).toBe(403);
  await request.post("/api/auth/sign-in/anonymous", {
    headers: { Origin: "http://localhost:3100" },
    data: {},
  });
  expect((await request.get("/api/game/admin")).status()).toBe(403);
  expect(
    (
      await request.post("/api/game/admin", {
        headers: { Origin: "http://localhost:3100" },
        data: {
          settings: {
            common: 100,
            uncommon: 0,
            rare: 0,
            legendary: 0,
            rechargeHours: 1,
          },
        },
      })
    ).status(),
  ).toBe(403);
});

test("deux comptes : proposition par interface, acceptation et inventaires transférés", async ({
  browser,
}) => {
  const contextA = await browser.newContext(),
    contextB = await browser.newContext();
  async function register(context: typeof contextA) {
    const handle = `e2e_${randomUUID().slice(0, 8)}`;
    const response = await context.request.post("/api/auth/sign-up/email", {
      headers: { Origin: "http://localhost:3100" },
      data: {
        username: handle,
        name: handle,
        email: `${handle}@example.invalid`,
        password: "Grenier-test-passphrase-42",
      },
    });
    expect(response.status()).toBe(200);
    expect(
      (
        await context.request.post("/api/game/open", {
          headers: { Origin: "http://localhost:3100" },
          data: { key: randomUUID() },
        })
      ).status(),
    ).toBe(200);
    const state: GameState = await (
      await context.request.get("/api/game/state")
    ).json();
    return { handle, state };
  }
  const a = await register(contextA),
    b = await register(contextB);
  const pageA = await contextA.newPage();
  await pageA.goto("/");
  await expect(
    pageA.getByRole("button", { name: `Compte ${a.handle}` }),
  ).toBeVisible();
  await pageA.getByRole("button", { name: "Échanges", exact: true }).click();
  await pageA
    .getByRole("button", { name: "Proposer un échange", exact: true })
    .click();
  await pageA
    .getByRole("textbox", { name: "Pseudo du collectionneur" })
    .fill(b.handle);
  await pageA.getByRole("button", { name: "Rechercher", exact: true }).click();
  await pageA.getByRole("button", { name: b.handle, exact: true }).click();
  await pageA
    .locator(".trade-columns > div")
    .nth(0)
    .locator(".trade-item-picker button")
    .first()
    .click();
  await pageA
    .locator(".trade-columns > div")
    .nth(1)
    .locator(".trade-item-picker button")
    .first()
    .click();
  await pageA.getByRole("button", { name: "Envoyer la proposition" }).click();
  await expect(pageA.getByRole("dialog")).toHaveCount(0);
  await expect(pageA.locator(".trade-status")).toHaveText("En attente");
  const pending = await (await contextA.request.get("/api/game/trades")).json();
  expect(pending).toHaveLength(1);
  const pageB = await contextB.newPage();
  await pageB.goto("/");
  await expect(
    pageB.getByRole("button", { name: `Compte ${b.handle}` }),
  ).toBeVisible();
  await pageB.getByRole("button", { name: "Échanges", exact: true }).click();
  await pageB.getByRole("button", { name: "Accepter l’échange" }).click();
  await expect(pageB.locator(".trade-status")).toHaveText("Accepté");
  const afterA: GameState = await (
      await contextA.request.get("/api/game/state")
    ).json(),
    afterB: GameState = await (
      await contextB.request.get("/api/game/state")
    ).json();
  expect(afterA.inventory).toHaveLength(3);
  expect(afterB.inventory).toHaveLength(3);
  expect(afterA.inventory.map((i) => i.id)).toContain(pending[0].requested[0]);
  expect(afterB.inventory.map((i) => i.id)).toContain(pending[0].offered[0]);
  await pageB.screenshot({
    path: "test-results/echange-accepte.png",
    fullPage: true,
  });
  await contextA.close();
  await contextB.close();
});

test("se connecter à un compte existant conserve ce compte et garde l’essai séparé", async ({
  browser,
}) => {
  const context = await browser.newContext();
  const request = context.request;
  const handle = `e2e_${randomUUID().slice(0, 8)}`;
  const data = {
    username: handle,
    name: handle,
    email: `${handle}@example.invalid`,
    password: "Grenier-test-passphrase-42",
  };
  const headers = { Origin: "http://localhost:3100" };
  expect(
    (await request.post("/api/auth/sign-up/email", { headers, data })).status(),
  ).toBe(200);
  const account: GameState = await (
    await request.get("/api/game/state")
  ).json();
  await request.post("/api/auth/sign-out", { headers, data: {} });
  expect(
    (
      await request.post("/api/auth/sign-in/anonymous", { headers, data: {} })
    ).status(),
  ).toBe(200);
  expect(
    (
      await request.post("/api/game/open", {
        headers,
        data: { key: randomUUID(), now: "2099-01-01T00:00:00Z" },
      })
    ).status(),
  ).toBe(200);
  const guest: GameState = await (await request.get("/api/game/state")).json();
  expect(guest.inventory).toHaveLength(3);
  // Manipulated client timestamps cannot generate another box.
  expect(
    (
      await request.post("/api/game/open", {
        headers,
        data: { key: randomUUID(), now: "2099-01-01T00:00:00Z" },
      })
    ).status(),
  ).toBe(409);
  const isolatedTrial = await browser.newContext();
  await isolatedTrial.addCookies(await context.cookies());
  expect(
    (
      await request.post("/api/auth/sign-in/email", {
        headers,
        data: { email: data.email, password: data.password },
      })
    ).status(),
  ).toBe(200);
  const restored: GameState = await (
    await request.get("/api/game/state")
  ).json();
  expect(restored.player.id).toBe(account.player.id);
  expect(restored.player.stock).toBe(1);
  expect(restored.inventory).toHaveLength(0);
  const preserved: GameState = await (
    await isolatedTrial.request.get("/api/game/state")
  ).json();
  expect(preserved.player.id).toBe(guest.player.id);
  expect(preserved.inventory).toHaveLength(3);
  await context.close();
  await isolatedTrial.close();
});
