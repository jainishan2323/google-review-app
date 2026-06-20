import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

/**
 * Reviews + feedback for one calendar month (`month=YYYY-MM`), for the
 * Review-volume-chart drill-down. `negative` keys on overall rating (<4),
 * matching how the stacked bars split.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const monthKey = searchParams.get("month");
  const businessId = searchParams.get("businessId");

  if (!monthKey || !businessId) {
    return NextResponse.json({ error: "Missing month or businessId" }, { status: 400 });
  }

  const [yStr, mStr] = monthKey.split("-");
  const year = Number(yStr);
  const month = Number(mStr); // 1-indexed
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "Invalid month" }, { status: 400 });
  }

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const [feedbackRows, reviewRows] = await Promise.all([
    prisma.anonymousFeedback.findMany({
      where: { businessId, createdAt: { gte: start, lt: end } },
      select: { id: true, rating: true, text: true, generatedReview: true, source: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.review.findMany({
      where: { businessId, publishedAt: { gte: start, lt: end } },
      select: { id: true, rating: true, text: true, authorName: true, publishedAt: true },
      orderBy: { publishedAt: "desc" },
      take: 50,
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
      negative: f.rating < 4,
    })),
    ...reviewRows.map((r) => ({
      id: r.id,
      rating: r.rating,
      text: r.text ?? null,
      source: "google" as string,
      date: r.publishedAt,
      authorName: r.authorName,
      negative: r.rating < 4,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 50);

  return NextResponse.json(rows);
}
