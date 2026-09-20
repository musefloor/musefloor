import { readdirSync, readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { team } from "../public/studio-data.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const publicRoot = path.join(root, "public");
const failures = [];
function files(folder) {
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    if ([".git", "node_modules", ".firebase"].includes(entry.name)) return [];
    const target = path.join(folder, entry.name);
    return entry.isDirectory() ? files(target) : [target];
  });
}
function reference(file, value) {
  if (/^(?:[a-z]+:|\/\/|#)/i.test(value)) return;
  const target = value.split(/[?#]/)[0];
  if (!target) return;
  const resolved = path.resolve(target.startsWith("/") ? publicRoot : path.dirname(file), target.replace(/^\//, ""));
  if (!existsSync(resolved)) failures.push(`${path.relative(root, file)}: missing ${value}`);
}
const all = files(root);
for (const file of all) {
  const extension = path.extname(file);
  if ([".js", ".mjs"].includes(extension)) {
    try { execFileSync(process.execPath, ["--check", file], { stdio: "pipe" }); }
    catch (error) { failures.push(error.stderr.toString()); }
    for (const match of readFileSync(file, "utf8").matchAll(/(?:from\s+|import\s*)["'](\.[^"']+)["']/g)) reference(file, match[1]);
  }
  if (extension === ".html") {
    const html = readFileSync(file, "utf8");
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    if (new Set(ids).size !== ids.length) failures.push(`${path.basename(file)}: duplicate element IDs`);
    for (const match of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) reference(file, match[1]);
  }
  if (extension === ".css") {
    for (const match of readFileSync(file, "utf8").matchAll(/url\(["']?([^"')]+)["']?\)/g)) reference(file, match[1]);
  }
  if (extension === ".md") {
    for (const match of readFileSync(file, "utf8").matchAll(/\]\(([^)]+)\)/g)) reference(file, match[1]);
  }
}
for (const member of Object.values(team)) reference(path.join(publicRoot, "studio-data.js"), member.image);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`Checked ${all.length} files: JavaScript syntax, element IDs, imports, and local references pass.`);
