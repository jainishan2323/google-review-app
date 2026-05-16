import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const business = await prisma.business.findFirst({
    where: { ownerId: session.userId },
  });

  if (!business) {
    return NextResponse.json({ reviews: [] });
  }

  const reviews = await prisma.review.findMany({
    where: { businessId: business.id },
    orderBy: { publishedAt: "desc" },
  });

  return NextResponse.json({ reviews });
}
