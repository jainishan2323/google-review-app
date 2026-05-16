import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { businessId, rating, text, photos } = body as {
    businessId?: string;
    rating?: number;
    text?: string;
    photos?: string[];
  };

  if (!businessId || !rating) {
    return NextResponse.json(
      { error: "businessId and rating are required" },
      { status: 400 }
    );
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true },
  });

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  await prisma.anonymousFeedback.create({
    data: {
      businessId,
      rating: Number(rating),
      text: text?.trim() || null,
      photos: photos ?? [],
    },
  });

  return NextResponse.json({ success: true });
}
