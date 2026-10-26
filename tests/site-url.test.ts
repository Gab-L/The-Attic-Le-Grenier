import { test } from "node:test";
import assert from "node:assert/strict";
import { siteOrigin, trustedSiteOrigins } from "../src/lib/site-url";

test("origine locale et domaine personnalisé explicite", () => {
  assert.equal(siteOrigin({}), "http://localhost:3000");
  assert.equal(
    siteOrigin({ BETTER_AUTH_URL: "https://grenier.example/" }),
    "https://grenier.example",
  );
});
test("Vercel production utilise son domaine stable, les previews leur propre URL", () => {
  const config = {
    VERCEL: "1",
    VERCEL_PROJECT_PRODUCTION_URL: "grenier.vercel.app",
    VERCEL_URL: "grenier-unique.vercel.app",
  };
  assert.equal(
    siteOrigin({ ...config, VERCEL_ENV: "production" }),
    "https://grenier.vercel.app",
  );
  assert.equal(
    siteOrigin({ ...config, VERCEL_ENV: "preview" }),
    "https://grenier-unique.vercel.app",
  );
  assert.equal(
    siteOrigin({ ...config, BETTER_AUTH_URL: "https://jeu.example" }),
    "https://jeu.example",
  );
});
test("refus des origines ambiguës ou absentes dans Vercel", () => {
  assert.throws(() => siteOrigin({ VERCEL: "1" }));
  for (const url of [
    "https://user:password@site.example",
    "https://site.example/path",
    "https://site.example?q=1",
    "javascript:alert(1)",
    "https://*.vercel.app",
  ])
    assert.throws(() => siteOrigin({ BETTER_AUTH_URL: url }));
});

test("les alias autorisés viennent exclusivement du déploiement configuré", () => {
  const origins = trustedSiteOrigins({
    VERCEL: "1",
    VERCEL_ENV: "production",
    BETTER_AUTH_URL: "https://jeu.example",
    VERCEL_PROJECT_PRODUCTION_URL: "grenier.vercel.app",
    VERCEL_URL: "grenier-current.vercel.app",
    VERCEL_BRANCH_URL: "grenier-git-main.vercel.app",
  });
  assert.deepEqual(origins, [
    "https://jeu.example",
    "https://grenier-current.vercel.app",
    "https://grenier-git-main.vercel.app",
    "https://grenier.vercel.app",
  ]);
  assert.equal(origins.includes("https://other-project.vercel.app"), false);
  assert.throws(() =>
    trustedSiteOrigins({
      VERCEL: "1",
      BETTER_AUTH_URL: "https://jeu.example",
      VERCEL_URL: "*.vercel.app",
    }),
  );
});

test("les previews et le développement ne font pas confiance au domaine de production", () => {
  const environment = {
    VERCEL: "1",
    VERCEL_ENV: "preview",
    VERCEL_PROJECT_PRODUCTION_URL: "grenier.vercel.app",
    VERCEL_URL: "grenier-preview.vercel.app",
    VERCEL_BRANCH_URL: "grenier-git-test.vercel.app",
  };
  assert.deepEqual(trustedSiteOrigins(environment), [
    "https://grenier-preview.vercel.app",
    "https://grenier-git-test.vercel.app",
  ]);
  assert.deepEqual(
    trustedSiteOrigins({
      ...environment,
      VERCEL: undefined,
      BETTER_AUTH_URL: "http://localhost:3000",
    }),
    ["http://localhost:3000"],
  );
});
