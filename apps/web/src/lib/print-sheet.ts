// Client-side "Print Sheet" generator (Phase 2, ADR 0013).
//
// Builds a self-serve, print-at-home PDF: a 2×3 grid of six identical QR-only
// cards on one A4 page with hairline cut lines. Browser-only — it composites the
// card with `injectCard` (DOMParser), rasterizes it via the canvas, and lays the
// PNG out with pdf-lib. The sheet is deliberately LOGO-LESS (logoUrl: null) to
// avoid cross-origin canvas taint; the business logo only appears on ordered
// cards. See docs/cards-feature.md.
import { PDFDocument, rgb } from "pdf-lib";
import { injectCard } from "@/lib/inject-card";

// A4 in PDF points (72pt/inch): 210 × 297 mm.
const A4 = { width: 595.28, height: 841.89 };
// One card is 9 × 9 cm = 90mm → 90/25.4 * 72 pt.
const CARD_PT = (90 / 25.4) * 72; // ≈ 255.12
const COLS = 2;
const ROWS = 3;
// Rasterize each card at ~300 DPI for the 9cm box (90/25.4 * 300 ≈ 1063px).
const CARD_PX = Math.round((90 / 25.4) * 300);

const CUT_LINE = { color: rgb(0.8, 0.8, 0.8), thickness: 0.5 };

interface PrintSheetOptions {
  /** Raw Card Template SVG (the QR-only variant). */
  rawTemplate: string;
  /** Generated QR as a standalone `<svg>` string. */
  qrSvg: string;
  /** Download filename, e.g. "review-cards-en.pdf". */
  fileName: string;
}

/** Composites a logo-less card, tiles it 6-up on A4, and downloads the PDF. */
export async function downloadPrintSheet({ rawTemplate, qrSvg, fileName }: PrintSheetOptions) {
  // Self-print is logo-less by design (ADR 0013) — only the QR is injected.
  const composed = injectCard(rawTemplate, { qrSvg, logoUrl: null });
  const pngDataUrl = await rasterizeSvg(composed, CARD_PX);

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([A4.width, A4.height]);
  const png = await pdf.embedPng(pngDataUrl);

  const gridW = COLS * CARD_PT;
  const gridH = ROWS * CARD_PT;
  const originX = (A4.width - gridW) / 2;
  const originY = (A4.height - gridH) / 2; // distance from the bottom edge

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      page.drawImage(png, {
        x: originX + c * CARD_PT,
        // pdf-lib's origin is bottom-left; place rows top-to-bottom.
        y: A4.height - originY - (r + 1) * CARD_PT,
        width: CARD_PT,
        height: CARD_PT,
      });
    }
  }

  // Hairline cut grid (vector) around and between the cards.
  for (let c = 0; c <= COLS; c++) {
    const x = originX + c * CARD_PT;
    page.drawLine({
      start: { x, y: originY },
      end: { x, y: originY + gridH },
      color: CUT_LINE.color,
      thickness: CUT_LINE.thickness,
    });
  }
  for (let r = 0; r <= ROWS; r++) {
    const y = originY + r * CARD_PT;
    page.drawLine({
      start: { x: originX, y },
      end: { x: originX + gridW, y },
      color: CUT_LINE.color,
      thickness: CUT_LINE.thickness,
    });
  }

  const bytes = await pdf.save();
  // pdf-lib types the result as Uint8Array<ArrayBufferLike>; it's a plain byte
  // array at runtime — cast to satisfy the BlobPart signature.
  triggerDownload(new Blob([bytes as BlobPart], { type: "application/pdf" }), fileName);
}

// Draws an SVG string onto a square canvas and returns a PNG data URL. The
// template's root is sized in % so we pin explicit pixel dimensions first, else
// the rasterized <img> has no intrinsic size and draws blank.
async function rasterizeSvg(svg: string, sizePx: number): Promise<string> {
  const sized = svg
    .replace(/width="100%"/, `width="${sizePx}"`)
    .replace(/height="100%"/, `height="${sizePx}"`);

  const url = URL.createObjectURL(new Blob([sized], { type: "image/svg+xml" }));
  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = sizePx;
    canvas.height = sizePx;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    ctx.fillStyle = "#ffffff"; // flatten any transparency to white for print
    ctx.fillRect(0, 0, sizePx, sizePx);
    ctx.drawImage(img, 0, 0, sizePx, sizePx);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load SVG for rasterization"));
    img.src = src;
  });
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
