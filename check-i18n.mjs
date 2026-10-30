// Verifies every messages/*.json has exactly the same keys as the default (id.json).
import { readFileSync, readdirSync } from "node:fs";

const flatten = (obj, prefix = "") =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" ? flatten(v, `${prefix}${k}.`) : [`${prefix}${k}`]
  );

const dir = new URL("../messages/", import.meta.url);
const base = new Set(flatten(JSON.parse(readFileSync(new URL("id.json", dir)))));
let failed = false;
for (const file of readdirSync(dir).filter((f) => f.endsWith(".json") && f !== "id.json")) {
  const keys = new Set(flatten(JSON.parse(readFileSync(new URL(file, dir)))));
  const missing = [...base].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !base.has(k));
  if (missing.length || extra.length) {
    failed = true;
    console.error(`${file}: missing [${missing.join(", ")}] extra [${extra.join(", ")}]`);
  }
}
if (failed) process.exit(1);
console.log(`i18n OK: ${base.size} keys, all locales match.`);
