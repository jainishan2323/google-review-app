import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const insight = searchParams.get("tag"); // reuse "tag" param for interface compat with TagDrillDownSheet
  const businessId = searchParams.get("businessId");

  if (!insight || !businessId) {
    return NextResponse.json({ error: "Missing tag or businessId" }, { status: 400 });
  }

  const [feedbackRows, reviewRows] = await Promise.all([
    prisma.anonymousFeedback.findMany({
      where: { businessId, unmappedInsights: { has: insight } },
      select: { id: true, rating: true, text: true, generatedReview: true, source: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.review.findMany({
      where: { businessId, unmappedInsights: { has: insight } },
      select: { id: true, rating: true, text: true, authorName: true, publishedAt: true },
      orderBy: { publishedAt: "desc" },
      take: 10,
    }),
  ]);

  const rows = [
    ...feedbackRows.map((f) => ({
      id: f.id,
      rating: f.rating,
      text: f.text ?? f.generatedReview ?? null,
      source: f.source,
      date: f.createdAt,
      authorName: null as string | null,
    })),
    ...reviewRows.map((r) => ({
      id: r.id,
      rating: r.rating,
      text: r.text ?? null,
      source: "google" as string,
      date: r.publishedAt,
      authorName: r.authorName,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);

  return NextResponse.json(rows);
}
