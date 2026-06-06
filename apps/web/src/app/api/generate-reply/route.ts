import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { draftReply } from "@repo/llm";
import { getActiveBusiness } from "@/lib/active-business";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const reviewId: string = body?.reviewId ?? "";

  // Live reviews have no DB row, so the client sends the review fields directly.
  const directText: string | null = body?.text ?? null;
  const directRating: number | undefined = body?.rating;
  const directAuthor: string = body?.authorName ?? "";

  if (directText) {
    const active = await getActiveBusiness();
    const draft = await draftReply(
      { rating: directRating ?? 0, text: directText, authorName: directAuthor },
      active.businessName
    );
    return NextResponse.json({ draft });
  }

  // Fallback: look the review up in the DB by its Prisma id (test/seeded data).
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
