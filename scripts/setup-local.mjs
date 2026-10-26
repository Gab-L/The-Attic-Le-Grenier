import { readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
let contents;
try {
  contents = await readFile(".env", "utf8");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  contents = await readFile(".env.example", "utf8");
}
if (!/^BETTER_AUTH_SECRET=.+$/m.test(contents)) {
  const line = `BETTER_AUTH_SECRET=${randomBytes(48).toString("base64url")}`;
  contents = /^BETTER_AUTH_SECRET=.*$/m.test(contents)
    ? contents.replace(/^BETTER_AUTH_SECRET=.*$/m, line)
    : `${contents}\n${line}\n`;
}
await writeFile(".env", contents, { mode: 0o600 });
console.log(
  "Configuration locale prête. Les valeurs existantes sont conservées ; aucun secret affiché.",
);
