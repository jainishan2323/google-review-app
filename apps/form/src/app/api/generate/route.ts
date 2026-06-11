import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateReviewText, streamReviewText } from "@repo/llm";
import { prisma } from "@repo/db";
import { resolveLabel } from "@repo/types";

// Flip to true via AI_STREAMING=true in .env.local to enable token-by-token streaming.
const STREAMING_ENABLED = process.env.AI_STREAMING === "true";

/** Strip characters commonly used in prompt injection attempts. */
function sanitize(s: string): string {
  return s.replace(/[<>{}[\]]/g, "").trim();
}

const schema = z.object({
  businessId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  // The form submits tag IDENTITIES; the route resolves them to default-language labels.
  tagIds: z.array(z.string().max(40)).max(20).default([]),
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

    const { businessId, rating, tagIds, customText, attempt } = parsed.data;

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true, formConfig: { select: { defaultLanguage: true } } },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const language = business.formConfig?.defaultLanguage ?? "en";

    // Resolve identities → labels in the default language, preserving the
    // customer's selection order. Sanitize since labels reach the LLM.
    const tags = tagIds.length
      ? await prisma.tag
          .findMany({
            where: { id: { in: tagIds } },
            select: { id: true, labels: true, authoredLanguage: true },
          })
          .then((rows) => {
            const byId = new Map(rows.map((r) => [r.id, r]));
            return tagIds
              .map((id) => byId.get(id))
              .filter((r): r is NonNullable<typeof r> => r !== undefined)
              .map((r) =>
                sanitize(resolveLabel(r.labels, { default: language, authored: r.authoredLanguage }))
              )
              .filter((label) => label.length > 0);
          })
      : [];

    const input = { rating, tags, customText, attempt, language };

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

