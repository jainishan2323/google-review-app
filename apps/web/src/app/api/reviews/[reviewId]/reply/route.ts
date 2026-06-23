import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/db";
import { postReply } from "@/lib/google-business";
import { resolveCurrentBusiness } from "@/lib/current-business";
import { REVIEW_REPLY_POSTING_ENABLED } from "@/lib/flags";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  // Kill-switch: until NEXT_PUBLIC_REVIEW_REPLY_POSTING is "true", refuse to post —
  // even a crafted request can't publish to a live Google connection by accident.
  if (!REVIEW_REPLY_POSTING_ENABLED) {
    return NextResponse.json(
      { error: "Posting replies is temporarily disabled." },
      { status: 403 }
    );
  }

  // Posting a reply needs the `business.manage` access token — a Phase 2
  // capability that only exists once the owner has connected Google. The
  // accessToken will be absent in Phase 1, so this route 401s until then.
  const session = await getServerSession(authOptions);
  const resolved = await resolveCurrentBusiness();
  if (resolved.status !== "ok" || !session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const replyText: string = body?.replyText?.trim() ?? "";
  if (!replyText) {
    return NextResponse.json(
      { error: "replyText is required" },
      { status: 400 }
    );
  }

  const { reviewId } = await params;
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: { business: true },
  });

  // Ownership: the review's business must belong to the signed-in owner.
  const ownsReview =
    review && resolved.businesses.some((b) => b.id === review.businessId);
  if (!ownsReview) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await postReply(session.accessToken, review.googleReviewId, replyText);

  await prisma.review.update({
    where: { id: reviewId },
    data: { isReplied: true, replyText, repliedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
