import { NextRequest, NextResponse } from "next/server";
import { generateReviewText } from "@repo/llm";
import { prisma } from "@repo/db";
import type { ReviewFormData } from "@repo/types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { businessId, rating, whatDidYouEnjoy, howWasService, additionalComments } =
    body as { businessId?: string; rating?: number } & Partial<ReviewFormData>;

  if (!businessId || !rating) {
    return NextResponse.json(
      { error: "businessId and rating are required" },
      { status: 400 }
    );
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { name: true },
  });

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const text = await generateReviewText(
    { rating, whatDidYouEnjoy, howWasService, additionalComments },
    business.name
  );

  return NextResponse.json({ text });
}
