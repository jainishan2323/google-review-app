import { prisma } from "@repo/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  businessId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  text: z.string().max(500).optional(),
  generatedReview: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)).max(5).default([]),
  source: z.enum(["private", "google_redirect"]).default("private"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as unknown;
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { businessId, rating, text, generatedReview, tags, source } = parsed.data;

    await prisma.anonymousFeedback.create({
      data: {
        businessId,
        rating,
        text: text?.trim() || null,
        generatedReview: generatedReview?.trim() || null,
        tags,
        source,
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
