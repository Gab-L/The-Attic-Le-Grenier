import { test } from "node:test";
import assert from "node:assert/strict";
import { siteOrigin } from "../src/lib/site-url";

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
  ])
    assert.throws(() => siteOrigin({ BETTER_AUTH_URL: url }));
});
