import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous, username } from "better-auth/plugins";
import { APIError, createAuthMiddleware } from "better-auth/api";
import nodemailer from "nodemailer";
import { db, transaction } from "./db";
import { gameLock } from "./game";
import { siteOrigin, trustedSiteOrigins } from "./site-url";
const recoveryEnabled = Boolean(process.env.SMTP_URL && process.env.MAIL_FROM);
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  baseURL: siteOrigin(),
  trustedOrigins: trustedSiteOrigins(),
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    ...(recoveryEnabled
      ? {
          sendResetPassword: async ({
            user,
            url,
          }: {
            user: { email: string };
            url: string;
          }) => {
            await nodemailer.createTransport(process.env.SMTP_URL!).sendMail({
              from: process.env.MAIL_FROM,
              to: user.email,
              subject: "Retrouver votre Grenier",
              text: `Pour choisir un nouveau mot de passe, ouvrez ce lien : ${url}\nSi vous n’avez rien demandé, ignorez cet email.`,
            });
          },
        }
      : {}),
  },
  session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 60,
    customRules: {
      "/sign-in/anonymous": { window: 3600, max: 8 },
      "/sign-up/email": { window: 3600, max: 8 },
      "/sign-in/email": { window: 60, max: 10 },
      "/request-password-reset": { window: 3600, max: 5 },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email" && !ctx.body?.username)
        throw new APIError("BAD_REQUEST", {
          message: "Choisissez un pseudo unique.",
        });
      if (
        ctx.path === "/update-user" &&
        (ctx.body?.username || ctx.body?.displayUsername)
      )
        throw new APIError("BAD_REQUEST", {
          message: "Le pseudo est permanent pour cette version.",
        });
    }),
  },
  plugins: [
    username({ minUsernameLength: 3, maxUsernameLength: 24 }),
    anonymous({
      generateName: () => "Explorateur du grenier",
      disableDeleteAnonymousUser: true,
      onLinkAccount: async ({ anonymousUser, newUser, ctx }) => {
        // A login NEVER merges with an existing account. Only a new registration can adopt the trial.
        if (
          ctx.path !== "/sign-up/email" ||
          anonymousUser.user.id === newUser.user.id
        )
          return;
        await transaction(async (c) => {
          await gameLock(c);
          const existing = await c.query(
            "SELECT id FROM players WHERE user_id=$1",
            [newUser.user.id],
          );
          if (existing.rowCount) return;
          const {
            rows: [account],
          } = await c.query('SELECT username FROM "user" WHERE id=$1', [
            newUser.user.id,
          ]);
          await c.query(
            "UPDATE players SET user_id=$1,handle=$2 WHERE user_id=$3",
            [newUser.user.id, account.username, anonymousUser.user.id],
          );
          // Old guest cookies cannot create another first box after adopting the trial.
          await c.query("DELETE FROM session WHERE user_id=$1", [
            anonymousUser.user.id,
          ]);
        });
      },
    }),
  ],
});
