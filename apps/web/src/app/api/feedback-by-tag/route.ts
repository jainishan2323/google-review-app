import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  // `tag` is a tag IDENTITY — Review.tags / AnonymousFeedback.tags store identities,
  // never display wording, so the `has` filter matches on the id directly.
  const tag = searchParams.get("tag");
  const businessId = searchParams.get("businessId");

  if (!tag || !businessId) {
    return NextResponse.json({ error: "Missing tag or businessId" }, { status: 400 });
  }

  // Query both sources in parallel. `negativeTags` carries this mention's per-tag
  // sentiment (set by the analyzer), so each row exposes whether THIS tag was
  // negative — that drives the drawer's All/Positive/Negative filter and matches
  // the Operational Zones bar split.
  const [feedbackRows, reviewRows] = await Promise.all([
    prisma.anonymousFeedback.findMany({
      where: { businessId, tags: { has: tag } },
      select: { id: true, rating: true, text: true, generatedReview: true, source: true, createdAt: true, negativeTags: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.review.findMany({
      where: { businessId, tags: { has: tag } },
      select: { id: true, rating: true, text: true, authorName: true, publishedAt: true, negativeTags: true },
      orderBy: { publishedAt: "desc" },
      take: 50,
    }),
  ]);

  // Normalise into a common shape
  const rows = [
    ...feedbackRows.map((f) => ({
      id: f.id,
      rating: f.rating,
      text: f.text ?? f.generatedReview ?? null,
      source: f.source,
      date: f.createdAt,
      authorName: null as string | null,
      negative: f.negativeTags.includes(tag),
    })),
    ...reviewRows.map((r) => ({
      id: r.id,
      rating: r.rating,
      text: r.text ?? null,
      source: "google" as string,
      date: r.publishedAt,
      authorName: r.authorName,
      negative: r.negativeTags.includes(tag),
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 50);

  return NextResponse.json(rows);
}
