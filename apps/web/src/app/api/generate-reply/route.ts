import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { draftReply } from "@repo/llm";
import { resolveCurrentBusiness } from "@/lib/current-business";

export async function POST(req: NextRequest) {
  // Auth + ownership re-enabled: now that owner→business resolution keys off the
  // verified email (not the unreliable session.userId / Google sub), we can
  // safely scope this to the signed-in owner's reviews.
  // See docs/adr/0004-owner-business-linking-by-verified-email.md
  const resolved = await resolveCurrentBusiness();
  if (resolved.status !== "ok") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const reviewId: string = body?.reviewId ?? "";
  if (!reviewId) {
    return NextResponse.json({ error: "reviewId is required" }, { status: 400 });
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: { business: true },
  });

  const ownsReview =
    review && resolved.businesses.some((b) => b.id === review.businessId);
  if (!ownsReview) {
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
