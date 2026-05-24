import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

const ALLOWED_ORIGINS = [
  "http://localhost:3002",
  "https://jugnoo.olbaid.de",
];

function corsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  try {
    const { email, message, source } = await request.json() as {
      email: string;
      message?: string;
      source?: string;
    };

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400, headers });
    }

    await prisma.waitlistEntry.create({
      data: {
        email: email.toLowerCase().trim(),
        message: message?.trim() || null,
        source: source ?? "landing",
      },
    });

    return NextResponse.json({ ok: true }, { status: 201, headers });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") {
      // Unique constraint — already on the list, treat as success
      return NextResponse.json({ ok: true, existing: true }, { status: 200, headers });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500, headers });
  }
}
