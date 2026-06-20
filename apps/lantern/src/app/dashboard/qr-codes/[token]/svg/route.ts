import { NextResponse } from "next/server";
import { normaliseToken } from "@repo/db";
import { buildQrSvg } from "@/lib/qr-svg";

// Per-token QR SVG download (ADR 0015). The QR encodes the public resolver URL
// …/q/{token}; filename = the code so the file self-identifies. The Operator edits
// + prints manually for now (batch-sheet UI is Phase 2).
const FORM_BASE_URL = (
  process.env.NEXT_PUBLIC_FORM_URL ?? "https://feedback.jugnoo.de"
).replace(/\/$/, "");

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token: raw } = await params;
  const token = normaliseToken(raw);
  const svg = buildQrSvg(`${FORM_BASE_URL}/q/${token}`);

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${token}.svg"`,
    },
  });
}
