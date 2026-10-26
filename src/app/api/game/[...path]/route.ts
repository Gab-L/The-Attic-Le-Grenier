import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import * as game from "@/lib/game";
import { GameError, requireThat } from "@/lib/rules";
import { trustedSiteOrigins } from "@/lib/site-url";
export const dynamic = "force-dynamic";
const uuid = z.string().uuid();
const roomSchema = z.object({
  theme: z.enum(["warm", "pastel", "night"]),
  wall: z.enum(["cream", "pink", "blue"]),
  floor: z.enum(["honey", "light", "dark"]),
  placements: z
    .array(z.object({ instanceId: uuid, slotId: z.string().max(20) }))
    .max(20),
});
async function body(req: NextRequest) {
  const reader = req.body?.getReader();
  requireThat(reader, "Requête vide.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.length;
    if (size > 32768) {
      await reader.cancel();
      throw new GameError("Requête trop volumineuse.", 413);
    }
    chunks.push(part.value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString());
  } catch {
    throw new GameError("Requête JSON invalide.");
  }
}
async function handle(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const path = (await context.params).path.join("/");
    if (req.method !== "GET")
      requireThat(
        trustedSiteOrigins().includes(req.headers.get("origin") ?? ""),
        "Origine de la requête refusée.",
        403,
      );
    if (path === "config" && req.method === "GET")
      return respond({
        recoveryEnabled: Boolean(process.env.SMTP_URL && process.env.MAIL_FROM),
      });
    const session = await auth.api.getSession({ headers: req.headers });
    requireThat(session, "Commencez votre visite ou connectez-vous.", 401);
    const id = session.user.id;
    if (req.method === "GET") {
      if (path === "state") return respond(await game.getState(id));
      if (path === "trades") return respond(await game.listTrades(id));
      if (path === "blocks") return respond(await game.listBlocks(id));
      if (path === "players")
        return respond(
          await game.searchPlayers(
            id,
            z.string().min(2).max(24).parse(req.nextUrl.searchParams.get("q")),
          ),
        );
      if (path === "trade-inventory")
        return respond(
          await game.tradeInventory(
            id,
            uuid.parse(req.nextUrl.searchParams.get("player")),
          ),
        );
      if (path === "admin") return respond(await game.getAdmin(id));
    } else if (req.method === "POST") {
      const input = await body(req);
      if (path === "open") {
        const b = z.object({ key: uuid }).parse(input);
        return respond(await game.openBox(id, b.key));
      }
      if (path === "room") {
        const b = z
          .object({ room: roomSchema, version: z.number().int().min(0) })
          .parse(input);
        return respond(await game.saveRoom(id, b.room, b.version));
      }
      if (path === "profile")
        return respond(
          await game.profileAction(
            id,
            z
              .object({
                public: z.boolean().optional(),
                favorite: z.string().max(60).optional(),
                readNotifications: z.boolean().optional(),
              })
              .parse(input),
          ),
        );
      if (path === "trades") {
        const b = z
          .object({
            recipient: uuid,
            offered: z.array(uuid).min(1).max(6),
            requested: z.array(uuid).min(1).max(6),
            key: uuid,
          })
          .parse(input);
        return respond(
          await game.proposeTrade(
            id,
            b.recipient,
            b.offered,
            b.requested,
            b.key,
          ),
        );
      }
      if (path === "trade-action") {
        const b = z
          .object({ id: uuid, action: z.enum(["accept", "decline", "cancel"]) })
          .parse(input);
        return respond(await game.actOnTrade(id, b.id, b.action));
      }
      if (path === "social") {
        const b = z
          .object({
            target: uuid,
            action: z.enum(["block", "unblock", "report"]),
            reason: z.string().trim().min(5).max(500).optional(),
          })
          .refine((b) => b.action !== "report" || Boolean(b.reason))
          .parse(input);
        return respond(
          await game.socialAction(id, b.target, b.action, b.reason),
        );
      }
      if (path === "report-room") {
        const b = z
          .object({ shareId: uuid, reason: z.string().trim().min(5).max(500) })
          .parse(input);
        return respond(await game.reportPublicRoom(id, b.shareId, b.reason));
      }
      if (path === "admin") {
        const b = z
          .object({
            definition: z
              .object({
                id: z.string().max(60),
                name: z.string().trim().min(2).max(80),
                description: z.string().trim().min(10).max(400),
                active: z.boolean(),
                rarity: z.enum(["common", "uncommon", "rare", "legendary"]),
              })
              .optional(),
            settings: z
              .object({
                common: z.number().int().min(0).max(100),
                uncommon: z.number().int().min(0).max(100),
                rare: z.number().int().min(0).max(100),
                legendary: z.number().int().min(0).max(100),
                rechargeHours: z.number().int().min(1).max(48),
              })
              .optional(),
            reportId: uuid.optional(),
          })
          .parse(input);
        return respond(await game.updateAdmin(id, b));
      }
    }
    throw new GameError("Action introuvable.", 404);
  } catch (error) {
    if (error instanceof GameError)
      return respond({ error: error.message }, error.status);
    if (error instanceof z.ZodError)
      return respond({ error: "Vérifiez les champs de votre demande." }, 400);
    console.error(
      "Game operation failed",
      error instanceof Error ? error.name : "UnknownError",
    );
    return respond(
      {
        error:
          "Le grenier est momentanément inaccessible. Réessayez ; vos trouvailles sont sauvegardées.",
      },
      500,
    );
  }
}
function respond(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}
export const GET = handle;
export const POST = handle;
