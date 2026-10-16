#!/usr/bin/env node
/* Generates og-en.png, og-pl.png (1200×630) and apple-touch-icon.png (180×180)
 * from src/og.html using headless Chromium.
 *
 *     node src/make_images.mjs
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
// Snap Chromium can only write inside its own home directory.
const TMP = join(homedir(), "snap/chromium/common");
mkdirSync(TMP, { recursive: true });

const JOBS = [["og-en.png", "lang=en", "1200,630"],
  ["og-pl.png", "lang=pl", "1200,630"],
  ["apple-touch-icon.png", "icon=1", "180,180"]];

const page = pathToFileURL(join(ROOT, "src/og.html")).href;

for (const [name, query, size] of JOBS) {
  const tmp = join(TMP, name);
  execFileSync("chromium", ["--headless", "--disable-gpu", "--hide-scrollbars",
    "--virtual-time-budget=3000", `--window-size=${size}`,
    `--screenshot=${tmp}`, `${page}?${query}`], { stdio: "pipe" });
  copyFileSync(tmp, join(ROOT, name));
  rmSync(tmp);
  console.log("→", name);
}
