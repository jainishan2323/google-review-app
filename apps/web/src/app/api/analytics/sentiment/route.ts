import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/db";
import { analyzeReviews } from "@repo/llm";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const business = await prisma.business.findFirst({
    where: { ownerId: session.userId },
  });

  if (!business) {
    return NextResponse.json({ error: "No business found" }, { status: 404 });
  }

  const reviews = await prisma.review.findMany({
    where: { businessId: business.id },
    select: { text: true, rating: true },
  });

  const analysis = await analyzeReviews(
    reviews.filter((r): r is { text: string; rating: number } => r.text !== null)
  );

  return NextResponse.json({ analysis });
}
