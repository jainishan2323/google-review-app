// Builds a Token Print Sheet PDF (ADR 0017): loads the vector artboard template
// and stamps a token's QR into every `qr-code-*` slot — fully vector, no raster.
//
// pdf-lib's `drawSvgPath` maps a path point (px,py) to PDF (x + scale·px,
// y − scale·py), so (x,y) is the QR's top-left and `scale = side/dim` sizes it.
// The slot boxes (viewBox units, top-left origin) come from the generated module;
// we scale them to the loaded page and flip Y (PDF origin is bottom-left). Slots
// are data-driven, so a redesigned artboard with more/fewer/differently-sized
// slots works after re-running `gen:print-template` — no change here.
import { PDFDocument, rgb } from "pdf-lib";
import { buildQrPath } from "./qr-svg";
import { PRINT_TEMPLATE, PRINT_TEMPLATE_PDF_BASE64 } from "./print-template.generated";

const TEMPLATE_BYTES = Uint8Array.from(Buffer.from(PRINT_TEMPLATE_PDF_BASE64, "base64"));

/** Stamps `url`'s QR into all template slots; returns the PDF bytes. */
export async function buildTokenPrintSheetPdf(url: string): Promise<Uint8Array> {
  const { d, dim } = buildQrPath(url);

  const pdf = await PDFDocument.load(TEMPLATE_BYTES);
  const page = pdf.getPage(0);
  const { width: pageW, height: pageH } = page.getSize();
  const sx = pageW / PRINT_TEMPLATE.viewBox.width;
  const sy = pageH / PRINT_TEMPLATE.viewBox.height;

  for (const slot of PRINT_TEMPLATE.slots) {
    const boxX = slot.x * sx;
    const boxW = slot.width * sx;
    const boxH = slot.height * sy;
    // White backing covers the artboard's placeholder rect and gives the QR its
    // quiet-zone contrast.
    page.drawRectangle({
      x: boxX,
      y: pageH - (slot.y + slot.height) * sy,
      width: boxW,
      height: boxH,
      color: rgb(1, 1, 1),
    });
    // Keep the QR square and centred even if the box isn't exactly square.
    const side = Math.min(boxW, boxH);
    page.drawSvgPath(d, {
      x: boxX + (boxW - side) / 2,
      y: pageH - slot.y * sy - (boxH - side) / 2, // QR top edge, PDF (bottom-up) coords
      scale: side / dim,
      color: rgb(0, 0, 0),
    });
  }

  return pdf.save();
}
