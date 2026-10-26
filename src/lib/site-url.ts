/** Resolve from trusted server configuration, never from a request Host header. */
export function siteOrigin(
  environment: Record<string, string | undefined> = process.env,
): string {
  const detected =
    environment.VERCEL_ENV === "production"
      ? environment.VERCEL_PROJECT_PRODUCTION_URL || environment.VERCEL_URL
      : environment.VERCEL_URL || environment.VERCEL_PROJECT_PRODUCTION_URL;
  const value =
    environment.BETTER_AUTH_URL ||
    (detected ? `https://${detected}` : undefined);
  if (!value && environment.VERCEL)
    throw new Error(
      "Adresse du déploiement Vercel absente. Activez les variables système ou définissez BETTER_AUTH_URL.",
    );
  const url = new URL(value || "http://localhost:3000");
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "L’adresse du site doit être une origine HTTP(S), sans identifiants, chemin ni paramètres.",
    );
  }
  return url.origin;
}
