import { readFile, readdir, stat } from "node:fs/promises";
import { resolve, relative, dirname } from "node:path";

const root = resolve(import.meta.dirname, "..");
const failures = [];
const htmlFiles = [];

async function walk(directory) {
  for (const name of await readdir(directory)) {
    if (name === ".git" || name === "node_modules") continue;
    const path = resolve(directory, name);
    const info = await stat(path);
    if (info.isDirectory()) await walk(path);
    else if (name.endsWith(".html")) htmlFiles.push(path);
  }
}

function localTarget(file, url) {
  const clean = url.split(/[?#]/)[0];
  if (!clean || clean.startsWith("mailto:") || clean.startsWith("http:" ) || clean.startsWith("https:")) return null;
  if (clean.startsWith("#")) return { fragment: clean.slice(1), file };
  const sitePrefix = "/takestack-launch/";
  const path = clean.startsWith(sitePrefix) ? clean.slice(sitePrefix.length) : clean.startsWith("/") ? clean.slice(1) : resolve(dirname(file), clean).slice(root.length + 1);
  const target = resolve(root, path);
  return { file: clean.endsWith("/") || !clean.split("/").at(-1).includes(".") ? resolve(target, "index.html") : target };
}

await walk(root);
const knownFiles = new Set(await Promise.all(htmlFiles.map(async file => resolve(file))));
for (const extra of ["styles.css", "favicon.svg", "assets/takestack-hero-product.png"]) knownFiles.add(resolve(root, extra));

for (const file of htmlFiles) {
  const source = await readFile(file, "utf8");
  const label = relative(root, file);
  if (!/<html[^>]+lang=/.test(source)) failures.push(`${label}: missing document language`);
  if (!/<meta[^>]+name=["']viewport["']/.test(source)) failures.push(`${label}: missing viewport meta`);
  if (!/<title>[^<]+<\/title>/.test(source)) failures.push(`${label}: missing title`);
  if (!/<main(?:\s|>)/.test(source)) failures.push(`${label}: missing main landmark`);
  if (/<img(?![^>]*\balt=)[^>]*>/g.test(source)) failures.push(`${label}: image missing alt text`);
  for (const match of source.matchAll(/(?:href|src)=["']([^"']+)["']/g)) {
    const target = localTarget(file, match[1]);
    if (!target) continue;
    if (target.fragment) {
      const escaped = target.fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (!new RegExp(`\\bid=["']${escaped}["']`).test(source)) failures.push(`${label}: missing fragment #${target.fragment}`);
    } else if (!knownFiles.has(resolve(target.file))) failures.push(`${label}: broken local reference ${match[1]}`);
  }
}

const publicSource = (await Promise.all(htmlFiles.map(file => readFile(file, "utf8")))).join("\n");
for (const forbidden of ["buy.stripe.com", "Founder license", "direct-download beta", "$49", "$149", "$499"]) {
  if (publicSource.toLowerCase().includes(forbidden.toLowerCase())) failures.push(`retired campaign language remains: ${forbidden}`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`QA passed: ${htmlFiles.length} HTML pages, local links, landmarks, alt text, and retired-offer scan.`);
