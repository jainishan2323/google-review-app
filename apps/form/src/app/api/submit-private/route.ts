import { prisma } from "@repo/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  businessId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  text: z.string().max(500).optional(),
  generatedReview: z.string().max(1000).optional(),
  // Tag IDENTITIES selected by the customer (never display wording).
  tagIds: z.array(z.string().max(40)).max(20).default([]),
  source: z.enum(["private", "google_redirect"]).default("private"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as unknown;
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { businessId, rating, text, generatedReview, tagIds, source } = parsed.data;

    // Keep only identities that belong to this business; derive negativeTags from
    // each tag's polarity (by identity), not by string-matching a chip list.
    const validTags = tagIds.length
      ? await prisma.tag.findMany({
          where: { id: { in: tagIds }, category: { formConfig: { businessId } } },
          select: { id: true, polarity: true },
        })
      : [];
    const validIds = new Set(validTags.map((t) => t.id));
    const tags = tagIds.filter((id) => validIds.has(id));
    const negativeTags = validTags
      .filter((t) => t.polarity === "negative")
      .map((t) => t.id);

    await prisma.anonymousFeedback.create({
      data: {
        businessId,
        rating,
        text: text?.trim() || null,
        generatedReview: generatedReview?.trim() || null,
        tags,
        negativeTags,
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
