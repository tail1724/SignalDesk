import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Generates app/(frontend)/vapornet.css from the design prototype
 * (redesign/vapornet/styles.css) — the pixel-perfect plan's "verbatim
 * port, no re-derivation" rule (docs/vapornet-pixel-perfect-plan.md §4).
 *
 * Transforms applied (everything else is byte-preserved):
 *  1. Prototype-shell chrome is dropped (toolbar, toast, mock-view
 *     switching, shell frame, prototype modals, admin/studio mocks).
 *  2. `.prototype-shell.is-mobile X` emulation rules become real
 *     `@media (max-width: 640px)` rules, appended after everything else
 *     so they win at phone widths exactly like the emulation class did.
 *  3. `.prototype-shell.density-revenue X` loses the shell prefix — the
 *     production page toggles `density-revenue` on <body>.
 *  4. `.night-mode X` gains a `[data-theme="dark"] X` twin so one
 *     stylesheet serves both the reference build (body class) and
 *     production (html attribute).
 *  5. The font custom properties re-point at the next/font variables
 *     (Newsreader / Inter / JetBrains Mono — plan §3 decision).
 *  6. The prototype's dark page-frame background on <body> is removed;
 *     `.publication-page` carries the newsprint surface in production.
 *
 * Regenerate with:  node --import tsx scripts/generate-vapornet-css.mts
 */

const here = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(here, "../../redesign/vapornet/styles.css");
const OUT = resolve(here, "../app/(frontend)/vapornet.css");

type Rule = { kind: "rule"; selector: string; body: string };
type AtBlock = { kind: "at"; prelude: string; rules: Rule[] };
type Node = Rule | AtBlock;

function parse(css: string): Node[] {
  const nodes: Node[] = [];
  let i = 0;
  const n = css.length;
  const skipWs = () => {
    while (i < n) {
      if (/\s/.test(css[i])) i++;
      else if (css.startsWith("/*", i)) {
        const end = css.indexOf("*/", i + 2);
        i = end === -1 ? n : end + 2;
      } else break;
    }
  };
  const readBlockBody = (): string => {
    // positioned after '{'; returns body text, consumes closing '}'
    let depth = 1;
    const start = i;
    while (i < n && depth > 0) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}") depth--;
      i++;
    }
    return css.slice(start, i - 1);
  };
  while (i < n) {
    skipWs();
    if (i >= n) break;
    const braceAt = css.indexOf("{", i);
    if (braceAt === -1) break;
    const prelude = css.slice(i, braceAt).trim();
    i = braceAt + 1;
    if (prelude.startsWith("@")) {
      if (prelude.startsWith("@media") || prelude.startsWith("@supports")) {
        const inner = readBlockBody();
        nodes.push({ kind: "at", prelude, rules: parse(inner).filter((x): x is Rule => x.kind === "rule") });
      } else {
        // @font-face, @keyframes etc — keep verbatim as a pseudo-rule
        const body = readBlockBody();
        nodes.push({ kind: "rule", selector: prelude, body });
      }
    } else {
      nodes.push({ kind: "rule", selector: prelude, body: readBlockBody() });
    }
  }
  return nodes;
}

const DROP = [
  ".prototype-toolbar",
  ".prototype-toast",
  ".prototype-frame",
  ".mock-view",
  ".viewport-name",
  ".toolbar",
  ".control",
  ".modal-backdrop",
  ".modal-card",
  ".modal-actions",
  ".modal-close",
  ".transfer",
  ".confirm-row",
  ".choice-row",
  ".consent-modal",
  ".admin-",
  ".studio-",
  ".editor-",
  ".manuscript",
  ".gate-score",
  ".dek-field",
  ".editable-copy",
  ".queue-",
  ".creative-panel",
  ".creative-preview",
  ".creative-thumb",
  ".governance-panel",
  ".revenue-panel",
];

function shouldDrop(sel: string): boolean {
  return DROP.some((d) => sel.includes(d));
}

/** Split a selector list, transform each part, drop dead parts. */
function transformSelector(selector: string): { keep: string | null; mobile: string | null } {
  const kept: string[] = [];
  const mobile: string[] = [];
  for (const raw of selector.split(",")) {
    let part = raw.trim();
    if (!part) continue;
    if (part.includes(".is-mobile")) {
      const stripped = part
        .replace(/\.prototype-shell\.is-mobile\s*/g, "")
        .replace(/\.is-mobile\s*/g, "")
        .trim();
      if (stripped && !shouldDrop(stripped)) mobile.push(stripped);
      continue;
    }
    if (part.includes(".prototype-shell")) {
      const stripped = part.replace(/\.prototype-shell\s*/g, "").trim();
      // bare shell rule (frame sizing) — prototype chrome, drop
      if (!stripped || stripped.startsWith(".density-revenue") === false && stripped.startsWith(".") === false) continue;
      part = stripped;
      if (!part) continue;
    }
    if (shouldDrop(part)) continue;
    if (part.includes(".night-mode")) {
      kept.push(part, part.replace(/(?:body)?\.night-mode/g, '[data-theme="dark"]'));
      continue;
    }
    kept.push(part);
  }
  return {
    keep: kept.length ? kept.join(", ") : null,
    mobile: mobile.length ? mobile.join(", ") : null,
  };
}

function transformBody(selector: string, body: string): string {
  if (selector === "body") {
    // Drop the prototype's dark page-frame background; keep the rest.
    return body.replace(/background:[^;]*;?/, "").trim();
  }
  if (selector === ":root") {
    return body
      .replace(/--display:[^;]*;/, '--display: var(--font-serif, "Iowan Old Style", Baskerville), "Iowan Old Style", Baskerville, "Times New Roman", serif;')
      .replace(/--sans:[^;]*;/, "--sans: var(--font-sans, Inter), Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif;")
      .replace(/--mono:[^;]*;/, '--mono: var(--font-mono, "SFMono-Regular"), "SFMono-Regular", Consolas, "Liberation Mono", monospace;')
      .trim();
  }
  // Prototype-relative asset URLs become absolute public paths (Next.js
  // module-resolves relative url()s in CSS). Drop the production art into
  // public/vapornet/ — see redesign/vapornet/README.md: the prototype webp
  // is itself a placeholder awaiting commissioned, region-accurate artwork.
  return body.replace(/url\(["']?assets\//g, 'url("/vapornet/').trim();
}

const src = readFileSync(SRC, "utf8");
const nodes = parse(src);

const out: string[] = [];
const mobileRules: string[] = [];

function emitRule(rule: Rule, indent: string, sink: string[], mobileSink: string[] | null) {
  if (rule.selector.startsWith("@")) {
    sink.push(`${indent}${rule.selector} { ${rule.body.trim()} }`);
    return;
  }
  const { keep, mobile } = transformSelector(rule.selector);
  const body = transformBody(rule.selector, rule.body);
  if (keep && body) sink.push(`${indent}${keep} { ${body} }`);
  if (mobile && body && mobileSink) mobileSink.push(`  ${mobile} { ${body} }`);
}

for (const node of nodes) {
  if (node.kind === "rule") {
    emitRule(node, "", out, mobileRules);
  } else {
    const inner: string[] = [];
    for (const rule of node.rules) emitRule(rule, "  ", inner, mobileRules);
    if (inner.length) out.push(`${node.prelude} {\n${inner.join("\n")}\n}`);
  }
}

const header = `/* ============================================================
   VaporNet Americana — public-surface styles (GENERATED FILE)
   Source of truth: redesign/vapornet/styles.css
   Generator: scripts/generate-vapornet-css.mts  (do not hand-edit
   values here — change the prototype, then regenerate; see
   docs/vapornet-pixel-perfect-plan.md §4)

   This file is intentionally UNLAYERED so it beats Tailwind v4's
   layered preflight/utilities by cascade rule.
   ============================================================ */

/* Rendering normalization — identical on the visual-test reference
   build so CI rasterizes both sides the same way (plan §3.4). */
html {
  font-synthesis: none;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
`;

const mobileBlock = mobileRules.length
  ? `\n/* Mobile composition — translated from the prototype's .is-mobile\n   emulation class into a real breakpoint (plan §4). */\n@media (max-width: 640px) {\n${mobileRules.join("\n")}\n}\n`
  : "";

writeFileSync(OUT, header + out.join("\n") + "\n" + mobileBlock);
console.log(`vapornet.css written: ${out.length} rules, ${mobileRules.length} mobile rules`);
