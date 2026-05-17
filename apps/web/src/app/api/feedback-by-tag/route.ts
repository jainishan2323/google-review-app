import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tag = searchParams.get("tag");
  const businessId = searchParams.get("businessId");

  if (!tag || !businessId) {
    return NextResponse.json({ error: "Missing tag or businessId" }, { status: 400 });
  }

  const rows = await prisma.anonymousFeedback.findMany({
    where: {
      businessId,
      tags: { has: tag },
    },
    select: {
      id: true,
      rating: true,
      text: true,
      generatedReview: true,
      source: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json(rows);
}
