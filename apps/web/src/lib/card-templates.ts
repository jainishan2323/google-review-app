// Server-only loader for the print-ready Card Template SVGs (ADR 0011).
//
// There are four templates, one per (hasNfc × language) combination, selected by
// a hardcoded filename map. Only the files that exist on disk are returned —
// missing variants (e.g. the German artwork before it's delivered) are simply
// absent from the map and the studio shows a "coming soon" placeholder.
//
// The SVGs live in `src/assets`; `next.config.js` adds them to the cards route's
// output-file tracing so the runtime `readFile` works in production too.
// (Server-only by construction — uses node:fs and is imported only by the page.)
import { readFile } from "node:fs/promises";
import path from "node:path";

// Variant key → on-disk filename. Keys match CardStudio's `variantKey(hasNfc, language)`
// (e.g. "qr_nfc_en"). Explicit (not templated) because the artwork
// files aren't named symmetrically — e.g. `qr_only` vs `qr_and_nfc`. Add a row
// here when a new template SVG lands.
const VARIANT_FILES: Record<string, string> = {
  qr_only_en: "template_qr_only_en.svg",
  qr_only_de: "template_qr_only_de.svg",
  qr_nfc_en: "template_qr_and_nfc_en.svg",
  qr_nfc_de: "template_qr_and_nfc_de.svg",
};

const ASSET_DIR = path.join(process.cwd(), "src", "assets");

/** Stable variant key matching CardStudio's `variantKey(hasNfc, language)`. */
export function cardVariantKey(hasNfc: boolean, language: string): string {
  return `${hasNfc ? "qr_nfc" : "qr_only"}_${language}`;
}

/**
 * Variant keys whose Card Template SVG exists on disk — the only variants that
 * may be ordered. Used as the server-side backstop in `createPrintOrder` so an
 * unavailable variant can't slip past the studio's disabled state (ADR 0012).
 */
export async function availableCardVariants(): Promise<string[]> {
  return Object.keys(await loadCardTemplates());
}

/** Reads every Card Template SVG that exists on disk, keyed by variant. */
export async function loadCardTemplates(): Promise<Record<string, string>> {
  const entries = await Promise.all(
    Object.entries(VARIANT_FILES).map(async ([key, file]) => {
      try {
        const svg = await readFile(path.join(ASSET_DIR, file), "utf8");
        return [key, svg] as const;
      } catch {
        return null; // variant not yet provided
      }
    }),
  );
  return Object.fromEntries(entries.filter((e): e is readonly [string, string] => e !== null));
}
