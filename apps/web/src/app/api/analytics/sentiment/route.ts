import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { analyzeReviews } from "@repo/llm";
import { resolveCurrentBusiness } from "@/lib/current-business";

export async function GET() {
  const resolved = await resolveCurrentBusiness();
  if (resolved.status === "unauthenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (resolved.status === "unlinked") {
    return NextResponse.json({ error: "No business found" }, { status: 404 });
  }

  const reviews = await prisma.review.findMany({
    where: { businessId: resolved.business.id },
    select: { text: true, rating: true },
  });

  const analysis = await analyzeReviews(
    reviews.filter((r): r is { text: string; rating: number } => r.text !== null)
  );

  return NextResponse.json({ analysis });
}
