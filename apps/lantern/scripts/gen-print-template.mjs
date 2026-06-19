// Regenerates the Token Print Sheet template from the artboard SVG (ADR 0017).
//
//   pnpm --filter @repo/lantern gen:print-template
//
// Two outputs, written into one generated TS module the runtime imports:
//   1. The artboard as a VECTOR PDF (via rsvg-convert) — base64-embedded so it is
//      bundled (no runtime fs / Vercel file-tracing concerns).
//   2. The resolved box of every `qr-code-*` slot, in viewBox units. Slots are
//      discovered dynamically (any count/size) by composing each element's full
//      ancestor transform chain — so re-running after an artboard redesign needs
//      no code changes. The QR is stamped into these boxes at request time.
//
// The SVG stays the single source of truth; this script is the only thing that
// needs re-running when the design changes.

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SVG_NAME = "jugnoo-counter-card-a4-grid-english.svg";
const SVG_PATH = join(HERE, "..", "src", "assets", SVG_NAME);
const OUT_PATH = join(HERE, "..", "src", "lib", "print-template.generated.ts");
const SLOT_ID_PREFIX = "qr-code-"; // lowercase, case-sensitive (≠ the `QR-Code-EN` card groups)
// Physical output size. The artboard is designed for A4; emitting an exact A4
// MediaBox makes the PDF print at true size (not scaled/clipped). The viewBox is
// mapped edge-to-edge (no keep-aspect-ratio) so it aligns to the page origin —
// the artboard's aspect matches A4 to within 0.02%, so there is no visible stretch.
const PAGE = { width: "210mm", height: "297mm" };

// ── affine matrix helpers ([a,b,c,d,e,f] == [[a c e],[b d f],[0 0 1]]) ──────────
const IDENTITY = [1, 0, 0, 1, 0, 0];
const mul = (m, n) => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
];
const apply = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

// Parse an SVG `transform` attribute (matrix/translate/scale, possibly chained).
function parseTransform(str) {
  if (!str) return IDENTITY;
  let m = IDENTITY;
  const re = /(matrix|translate|scale)\s*\(([^)]*)\)/g;
  let hit;
  while ((hit = re.exec(str))) {
    const fn = hit[1];
    const a = hit[2].split(/[\s,]+/).filter(Boolean).map(Number);
    if (fn === "matrix") m = mul(m, [a[0], a[1], a[2], a[3], a[4], a[5]]);
    else if (fn === "translate") m = mul(m, [1, 0, 0, 1, a[0] || 0, a[1] || 0]);
    else if (fn === "scale") m = mul(m, [a[0], 0, 0, a[1] ?? a[0], 0, 0]);
  }
  return m;
}

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`));
  return m ? m[1] : null;
};

// ── derive slot boxes by walking the element tree with a CTM stack ──────────────
function deriveSlots(svg) {
  const viewBox = (attr(svg.match(/<svg[^>]*>/)[0], "viewBox") || "0 0 0 0")
    .split(/[\s,]+/)
    .map(Number);
  const vb = { width: viewBox[2], height: viewBox[3] };

  const stack = [{ ctm: IDENTITY, id: null }]; // sentinel root
  const slots = [];
  const tagRe = /<\/?([a-zA-Z][\w:-]*)([^>]*?)(\/?)>/g;
  let t;
  while ((t = tagRe.exec(svg))) {
    const [raw, name, body, selfClose] = t;
    if (raw.startsWith("</")) {
      stack.pop();
      continue;
    }
    const top = stack[stack.length - 1];
    const ctm = mul(top.ctm, parseTransform(attr(raw, "transform")));
    const id = attr(raw, "id");

    // A rect that is the geometry of a `qr-code-*` slot group → resolve its box.
    if (name === "rect" && top.id && top.id.startsWith(SLOT_ID_PREFIX)) {
      const x = Number(attr(raw, "x")), y = Number(attr(raw, "y"));
      const w = Number(attr(raw, "width")), h = Number(attr(raw, "height"));
      const corners = [apply(ctm, x, y), apply(ctm, x + w, y), apply(ctm, x, y + h), apply(ctm, x + w, y + h)];
      const xs = corners.map((c) => c[0]), ys = corners.map((c) => c[1]);
      slots.push({
        id: top.id,
        x: Math.min(...xs),
        y: Math.min(...ys),
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys),
      });
    }

    if (!selfClose && name !== "svg") stack.push({ ctm, id });
  }

  slots.sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true }));
  return { vb, slots };
}

// ── run ─────────────────────────────────────────────────────────────────────
const svg = readFileSync(SVG_PATH, "utf8");
const { vb, slots } = deriveSlots(svg);
if (slots.length === 0) throw new Error(`No "${SLOT_ID_PREFIX}*" slots found in ${SVG_NAME}`);

const work = mkdtempSync(join(tmpdir(), "jugnoo-tpl-"));
const pdfTmp = join(work, "out.pdf");
try {
  // Force a deterministic raster size (= viewBox) so the PDF maps the viewBox to
  // the full page edge-to-edge, top-left origin, uniform scale. The runtime reads
  // the actual page size and scales accordingly, so the absolute pt size is moot.
  execFileSync("rsvg-convert", [
    "-f", "pdf",
    "--page-width", PAGE.width, "--page-height", PAGE.height,
    "--width", PAGE.width, "--height", PAGE.height,
    "-o", pdfTmp, SVG_PATH,
  ]);
  const pdfBase64 = readFileSync(pdfTmp).toString("base64");

  const banner = "// AUTO-GENERATED by scripts/gen-print-template.mjs — DO NOT EDIT.\n" +
    `// Regenerate after an artboard change: pnpm --filter @repo/lantern gen:print-template\n` +
    `// Source artboard: ${SVG_NAME}\n`;
  const body =
    banner +
    `\nexport interface PrintSlot {\n  /** Slot id from the artboard (e.g. "qr-code-1", "qr-code-1-mini"). */\n  id: string;\n  /** Resolved box in viewBox units, top-left origin. */\n  x: number;\n  y: number;\n  width: number;\n  height: number;\n}\n\n` +
    `export const PRINT_TEMPLATE = {\n` +
    `  source: ${JSON.stringify(SVG_NAME)},\n` +
    `  viewBox: { width: ${vb.width}, height: ${vb.height} },\n` +
    `  slots: ${JSON.stringify(slots.map((s) => ({ id: s.id, x: round(s.x), y: round(s.y), width: round(s.width), height: round(s.height) })))} as PrintSlot[],\n` +
    `} as const;\n\n` +
    `// The artboard rendered to a vector PDF (rsvg-convert), base64 so it bundles.\n` +
    `export const PRINT_TEMPLATE_PDF_BASE64 =\n  ${JSON.stringify(pdfBase64)};\n`;
  writeFileSync(OUT_PATH, body);

  console.log(`✓ ${slots.length} slot(s):`);
  for (const s of slots) console.log(`    ${s.id.padEnd(16)} ${round(s.x)},${round(s.y)} ${round(s.width)}×${round(s.height)}`);
  console.log(`✓ viewBox ${vb.width}×${vb.height}, PDF ${Math.round(pdfBase64.length / 1366)}KB → ${OUT_PATH}`);
} finally {
  rmSync(work, { recursive: true, force: true });
}

function round(n) {
  return Math.round(n * 100) / 100;
}
