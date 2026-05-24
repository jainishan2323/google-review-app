import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/db";
import { draftReply } from "@repo/llm";

const DEV_BUSINESS_ID = process.env.DEV_BUSINESS_ID;

export async function POST(req: NextRequest) {
  // TODO: re-enable auth + ownership check once Google Business Profile API is approved
  // and session.userId reliably maps to the Prisma User.id (not the Google OAuth sub).

  const body = await req.json();
  const reviewId: string = body?.reviewId ?? "";
  if (!reviewId) {
    return NextResponse.json({ error: "reviewId is required" }, { status: 400 });
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: { business: true },
  });

  if (!review) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!review.text) {
    return NextResponse.json(
      { error: "Review has no text to draft a reply for" },
      { status: 400 }
    );
  }

  const draft = await draftReply(
    { rating: review.rating, text: review.text, authorName: review.authorName },
    review.business.name
  );

  return NextResponse.json({ draft });
}
