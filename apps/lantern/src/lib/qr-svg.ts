import QRCode from "qrcode";

// Builds a QR as an SVG of filled unit squares (one <path>), staying crisp at any
// scale. Copied from apps/web's qr-svg (the card machinery isn't shared); used by
// the per-token "Download SVG" route so the Operator can edit + print stock
// manually (ADR 0015 — branded batch-sheet UI is Phase 2).
export function buildQrSvg(
  text: string,
  { margin = 2, ecc = "M" as "L" | "M" | "Q" | "H" } = {},
): string {
  const qr = QRCode.create(text, { errorCorrectionLevel: ecc });
  const n = qr.modules.size;
  const data = qr.modules.data; // 1 = dark module
  const dim = n + margin * 2;

  let d = "";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (data[y * n + x]) d += `M${x + margin},${y + margin}h1v1h-1z`;
    }
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dim} ${dim}" shape-rendering="crispEdges">` +
    `<path fill="#ffffff" d="M0,0h${dim}v${dim}h-${dim}z"/>` +
    `<path fill="#000000" d="${d}"/>` +
    `</svg>`
  );
}

// Builds the QR as a bare SVG path (the dark modules only) plus its overall
// square dimension in module units. Used by the Token Print Sheet PDF builder,
// which feeds `d` straight into pdf-lib's `drawSvgPath` (vector, no raster) and
// scales it by box/`dim` to fill a slot. `dim` includes the quiet-zone margin,
// so a white slot background + this path yields a correctly-padded QR.
export function buildQrPath(
  text: string,
  { margin = 2, ecc = "M" as "L" | "M" | "Q" | "H" } = {},
): { d: string; dim: number } {
  const qr = QRCode.create(text, { errorCorrectionLevel: ecc });
  const n = qr.modules.size;
  const data = qr.modules.data; // 1 = dark module
  const dim = n + margin * 2;

  let d = "";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (data[y * n + x]) d += `M${x + margin},${y + margin}h1v1h-1z`;
    }
  }

  return { d, dim };
}
