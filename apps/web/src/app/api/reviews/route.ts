import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { resolveCurrentBusiness } from "@/lib/current-business";

export async function GET() {
  const resolved = await resolveCurrentBusiness();
  if (resolved.status === "unauthenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (resolved.status === "unlinked") {
    return NextResponse.json({ reviews: [] });
  }

  const reviews = await prisma.review.findMany({
    where: { businessId: resolved.business.id },
    orderBy: { publishedAt: "desc" },
  });

  return NextResponse.json({ reviews });
}
