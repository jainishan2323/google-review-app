import { prisma } from "@repo/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;
    const { businessId, rating, text } = body;

    if (!businessId || typeof businessId !== "string") {
      return NextResponse.json({ error: "businessId required" }, { status: 400 });
    }
    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: "rating must be 1–5" }, { status: 400 });
    }

    await prisma.anonymousFeedback.create({
      data: {
        businessId,
        rating: ratingNum,
        text: typeof text === "string" && text.trim() ? text.trim() : null,
        status: "unread",
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[POST /api/submit-private]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
