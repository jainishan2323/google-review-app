import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateReviewText, streamReviewText } from "@repo/llm";
import { prisma } from "@repo/db";

// Flip to true via AI_STREAMING=true in .env.local to enable token-by-token streaming.
const STREAMING_ENABLED = process.env.AI_STREAMING === "true";

/** Strip characters commonly used in prompt injection attempts. */
function sanitize(s: string): string {
  return s.replace(/[<>{}[\]]/g, "").trim();
}

const schema = z.object({
  businessId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  tags: z.array(z.string().max(50).transform(sanitize)).max(20).default([]),
  customText: z
    .string()
    .max(500)
    .transform(sanitize)
    .optional(),
  attempt: z.number().int().min(0).max(10).default(0),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as unknown;
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { businessId, rating, tags, customText, attempt } = parsed.data;

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const input = { rating, tags, customText, attempt };

    if (STREAMING_ENABLED) {
      const stream = await streamReviewText(input, business.name);
      return new Response(stream as ReadableStream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    const text = await generateReviewText(input, business.name);
    return NextResponse.json({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[POST /api/generate]", message);
    return NextResponse.json({ error: "Failed to generate review" }, { status: 500 });
  }
}

