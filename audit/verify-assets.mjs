import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(path.join(root, "index.html"), "utf8");
const refs = [...html.matchAll(/(?:src|srcset|href)=["']([^"']+)["']/g)]
  .map((m) => m[1])
  .filter((u) => !u.startsWith("http") && !u.startsWith("#") && !u.startsWith("data:") && !u.includes("fonts.googleapis"));
const unique = [...new Set(refs)];
const results = unique.map((rel) => {
  const file = path.join(root, rel.split("?")[0]);
  return { ref: rel, exists: existsSync(file), bytes: existsSync(file) ? readFileSync(file).length : 0 };
});
const missing = results.filter((r) => !r.exists);
console.log(JSON.stringify({ total: results.length, missing: missing.length, results }, null, 2));
process.exit(missing.length ? 1 : 0);
