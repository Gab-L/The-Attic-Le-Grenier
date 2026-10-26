type Environment = Record<string, string | undefined>;

function parseOrigin(value: string): string {
  const url = new URL(value);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.hostname.includes("*") ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "L’adresse du site doit être une origine HTTP(S) exacte, sans identifiants, chemin ni paramètres.",
    );
  }
  return url.origin;
}

/** Canonical URL for links and metadata, from trusted server configuration. */
export function siteOrigin(environment: Environment = process.env): string {
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
  return parseOrigin(value || "http://localhost:3000");
}

/** Exact aliases of this deployment, never wildcard hosts or request headers. */
export function trustedSiteOrigins(
  environment: Environment = process.env,
): string[] {
  const origins = [siteOrigin(environment)];
  if (environment.VERCEL) {
    const hosts = [environment.VERCEL_URL, environment.VERCEL_BRANCH_URL];
    if (environment.VERCEL_ENV === "production")
      hosts.push(environment.VERCEL_PROJECT_PRODUCTION_URL);
    for (const host of hosts) {
      if (host) origins.push(parseOrigin(`https://${host}`));
    }
  }
  return [...new Set(origins)];
}
