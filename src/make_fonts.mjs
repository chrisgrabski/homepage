#!/usr/bin/env node
/* Subsets the full Nerd Font files in fonts-src/ into small woff2 files in fonts/.
 * Kept characters: printable ASCII plus every character found in the built pages
 * and sources (Polish letters, punctuation, icon glyphs written as &#x...; entities).
 *
 *     npm run build && npm run fonts
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import subsetFont from "subset-font";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FILES = ["index.html", "pl/index.html", "build.mjs", "src/template.html",
  "src/privacy.en.html", "src/privacy.pl.html"];
const FONTS = ["JetBrainsMonoNerdFont-Regular", "JetBrainsMonoNerdFont-Bold"];

const chars = new Set();
for (let c = 0x20; c < 0x7f; c++) chars.add(String.fromCodePoint(c));
for (const file of FILES) {
  const text = readFileSync(join(ROOT, file), "utf8")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)));
  for (const ch of text) if (ch.codePointAt(0) > 0x7f) chars.add(ch);
}
const text = [...chars].join("");

mkdirSync(join(ROOT, "fonts"), { recursive: true });
for (const name of FONTS) {
  const source = readFileSync(join(ROOT, "fonts-src", `${name}.ttf`));
  const out = await subsetFont(source, text, { targetFormat: "woff2" });
  writeFileSync(join(ROOT, "fonts", `${name}.woff2`), out);
  console.log("→", `fonts/${name}.woff2`, `${(out.length / 1024).toFixed(1)} KiB`);
}
