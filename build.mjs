#!/usr/bin/env node
/* Builds the site in two languages from a single template.
 *
 *     node build.mjs
 *
 * Output:
 *     index.html      — English version (default, x-default)
 *     pl/index.html   — Polish version
 *     sitemap.xml, robots.txt
 *
 * Sources: src/template.html, src/privacy.{en,pl}.html.
 * After a domain change, just update SITE_URL and run the script again.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const SITE_URL = "https://chrisgrabski.github.io/homepage/";

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, "src");

const NAMES = { en: "Christopher Grabski", pl: "Krzysztof Grabski" };
const FIRST_NAMES = { en: "Christopher", pl: "Krzysztof" };
const EMAIL = "chris.grabski.dev@gmail.com";
const PHONE = "+48517499860";
const SKILLS = ["Software architecture", "Fullstack development", "DevOps", "SPA", "Web3",
  "Next.js", "React", "NestJS", "Express", "JavaScript",
  "AWS", "CI/CD", "Docker", "Monitoring", "DNS"];

const NB = "&nbsp;";

const LANGS = {
  en: {
    path: "",
    locale: "en_US",
    title: `${NAMES.en} — Software Architect, Fullstack & DevOps`,
    description: "Software architect, fullstack developer and DevOps engineer. " +
      "SPA apps, web3 and websites with Next.js, React and NestJS, " +
      "running on AWS. Get in touch.",
    job_title: "Software Architect",
    og_alt: `${NAMES.en} — software architect, fullstack, devops`,
    texts: {
      architect: `software${NB}architect`,
      spa: "spa applications",
      websites: "websites",
      maintenance: "maintenance",
      dns: "domains &amp; dns",
      hint_email: "send me an email <em>(preferred)</em>",
      hint_phone: "give me a call",
      copy_email: "Copy email address",
      copied: "copied",
      theme: "Toggle light / dark theme",
      privacy: "privacy policy",
      close: "Close",
      egg: "I'm like a corner shop: open 24/7, but I don't strike a deal with everyone ;)",
      lang_label: "Language",
      logo_label: "KG logo",
    },
  },
  pl: {
    path: "pl/",
    locale: "pl_PL",
    title: `${NAMES.pl} — architekt oprogramowania, fullstack i DevOps`,
    description: "Architekt oprogramowania, fullstack developer i DevOps. " +
      "Aplikacje SPA, web3 i strony www w Next.js, React i NestJS, " +
      "utrzymanie na AWS. Napisz do mnie.",
    job_title: "Architekt oprogramowania",
    og_alt: `${NAMES.pl} — architekt oprogramowania, fullstack, devops`,
    texts: {
      architect: `architekt${NB}oprogramowania`,
      spa: "aplikacje spa",
      websites: "strony www",
      maintenance: "utrzymanie",
      dns: "domeny i dns",
      hint_email: "napisz maila <em>(preferowane)</em>",
      hint_phone: "zadzwoń",
      copy_email: "Kopiuj adres e-mail",
      copied: "skopiowano",
      theme: "Przełącz jasny / ciemny motyw",
      privacy: "polityka prywatności",
      close: "Zamknij",
      egg: "Jestem jak sklep: otwarty 24/7, ale nie z każdym dobijam targu ;)",
      lang_label: "Język",
      logo_label: "Logo KG",
    },
  },
};
const DEFAULT = "en";

// Only the default version (/) redirects, to /pl/, if the visitor chose Polish
// or has a Polish browser locale and has not chosen anything yet. Bots stay on /.
const REDIRECT = `    // Language: / is English, /pl/ is Polish. Redirect to /pl/ only when "pl" is
    // the saved choice or, with no saved choice, when the browser locale is pl.
    {
      let l = null;
      try { l = localStorage.getItem("lang"); } catch (e) {}
      const wantPl = l ? l === "pl" : (navigator.language || "").toLowerCase().startsWith("pl");
      if (wantPl && !/bot|crawl|spider|slurp|preview/i.test(navigator.userAgent)) {
        location.replace("pl/" + location.search + location.hash);
      }
    }
`;

const escape = (s) => s
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#x27;");

const url = (lang) => SITE_URL + LANGS[lang].path;
const depthOf = (path) => path.split("/").length - 1;

// JSON with spaces after ":" and "," and without escaping non-ASCII characters.
function toJson(v) {
  if (Array.isArray(v)) return "[" + v.map(toJson).join(", ") + "]";
  if (v && typeof v === "object") {
    return "{" + Object.entries(v).map(([k, x]) => `${JSON.stringify(k)}: ${toJson(x)}`).join(", ") + "}";
  }
  return JSON.stringify(v);
}

function seoHead(lang) {
  const c = LANGS[lang];
  const root = "../".repeat(depthOf(c.path));
  const image = `${SITE_URL}og-${lang}.png`;
  const other = Object.keys(LANGS).filter((k) => k !== lang);
  const person = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: url(lang),
    inLanguage: lang,
    mainEntity: {
      "@type": "Person",
      name: NAMES[lang],
      url: url(lang),
      image,
      jobTitle: c.job_title,
      email: `mailto:${EMAIL}`,
      telephone: PHONE,
      address: { "@type": "PostalAddress", addressCountry: "PL" },
      knowsAbout: SKILLS,
      knowsLanguage: ["pl", "en"],
    },
  };
  const lines = [
    `<title>${escape(c.title)}</title>`,
    `<meta name="description" content="${escape(c.description)}">`,
    `<meta name="author" content="${NAMES[lang]}">`,
    '<meta name="robots" content="index, follow">',
    `<link rel="canonical" href="${url(lang)}">`,
    ...Object.keys(LANGS).map((k) => `<link rel="alternate" hreflang="${k}" href="${url(k)}">`),
    `<link rel="alternate" hreflang="x-default" href="${url(DEFAULT)}">`,
    `<link rel="icon" type="image/svg+xml" href="${root}kg.svg">`,
    `<link rel="apple-touch-icon" href="${root}apple-touch-icon.png">`,
    '<meta name="theme-color" content="#f4f4f2" media="(prefers-color-scheme: light)">',
    '<meta name="theme-color" content="#1d1c1a" media="(prefers-color-scheme: dark)">',
    '<meta property="og:type" content="profile">',
    `<meta property="og:site_name" content="${NAMES[lang]}">`,
    `<meta property="og:title" content="${escape(c.title)}">`,
    `<meta property="og:description" content="${escape(c.description)}">`,
    `<meta property="og:url" content="${url(lang)}">`,
    `<meta property="og:locale" content="${c.locale}">`,
    ...other.map((k) => `<meta property="og:locale:alternate" content="${LANGS[k].locale}">`),
    `<meta property="og:image" content="${image}">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    `<meta property="og:image:alt" content="${escape(c.og_alt)}">`,
    `<meta property="profile:first_name" content="${FIRST_NAMES[lang]}">`,
    '<meta property="profile:last_name" content="Grabski">',
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${escape(c.title)}">`,
    `<meta name="twitter:description" content="${escape(c.description)}">`,
    `<meta name="twitter:image" content="${image}">`,
    '<script type="application/ld+json">' + toJson(person) + "</script>",
  ];
  return lines.map((l) => "  " + l).join("\n");
}

function render(lang) {
  const c = LANGS[lang];
  const root = "../".repeat(depthOf(c.path));
  const values = {
    ...c.texts,
    lang,
    name: NAMES[lang],
    root,
    seo_head: seoHead(lang),
    lang_redirect: lang === DEFAULT ? REDIRECT : "",
    // Relative links, so they also work under a subdirectory (e.g. GitHub Pages /repo/).
    href_en: root || "./",
    href_pl: lang !== "pl" ? root + LANGS.pl.path : "./",
    current_en: lang === "en" ? ' aria-current="page"' : "",
    current_pl: lang === "pl" ? ' aria-current="page"' : "",
    privacy_body: readFileSync(join(SRC, `privacy.${lang}.html`), "utf8"),
  };
  const html = readFileSync(join(SRC, "template.html"), "utf8")
    .replace(/\{\{(\w+)\}\}/g, (_, key) => values[key]);
  const out = join(ROOT, c.path, "index.html");
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  console.log("→", relative(ROOT, out));
}

function sitemap() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const today = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const alts = Object.keys(LANGS)
    .map((k) => `    <xhtml:link rel="alternate" hreflang="${k}" href="${url(k)}"/>`)
    .join("\n") + `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${url(DEFAULT)}"/>`;
  const entries = Object.keys(LANGS)
    .map((k) => `  <url>\n    <loc>${url(k)}</loc>\n    <lastmod>${today}</lastmod>\n${alts}\n  </url>`)
    .join("\n");
  writeFileSync(join(ROOT, "sitemap.xml"),
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n' +
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    `${entries}\n</urlset>\n`);
  writeFileSync(join(ROOT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}sitemap.xml\n`);
  console.log("→ sitemap.xml, robots.txt");
}

for (const lang of Object.keys(LANGS)) render(lang);
sitemap();
