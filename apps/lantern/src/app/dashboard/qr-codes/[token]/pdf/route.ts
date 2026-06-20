import { NextResponse } from "next/server";
import { normaliseToken } from "@repo/db";
import { buildTokenPrintSheetPdf } from "@/lib/token-print-sheet";

// Token Print Sheet download (ADR 0017): one A4 PDF carrying this token's QR
// stamped into all four counter-card variants of the artboard — fully vector.
// Mirrors the sibling per-token `/svg` route; filename = the code.
const FORM_BASE_URL = (
  process.env.NEXT_PUBLIC_FORM_URL ?? "https://feedback.jugnoo.de"
).replace(/\/$/, "");

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token: raw } = await params;
  const token = normaliseToken(raw);
  const pdf = await buildTokenPrintSheetPdf(`${FORM_BASE_URL}/q/${token}`);

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${token}.pdf"`,
    },
  });
}
