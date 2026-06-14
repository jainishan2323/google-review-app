import QRCode from "qrcode";

// Builds a QR as an SVG of **filled** unit squares (one `<path>`), not qrcode's
// default `type:"svg"` output — which strokes the modules with a 1px line tuned
// for 1:1 rendering and goes fuzzy once scaled up inside the card. Filled rects
// + `shape-rendering:crispEdges` stay sharp at any scale.
//
// Returns a standalone `<svg viewBox="0 0 N N">` ready to drop into a slot.
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
