import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/db";
import { postReply } from "@/lib/google-business";
import { getActiveBusiness } from "@/lib/active-business";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.userId || !session?.accessToken) {
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

  const { reviewId } = await params; // decoded by Next from the encoded path segment

  // Live path: the id is the full Google resource name (e.g.
  // "accounts/123/locations/456/reviews/abc"). Verify it belongs to the active
  // business's location, then post straight to the Google API (no DB row exists).
  if (reviewId.includes("/reviews/")) {
    const active = await getActiveBusiness();
    if (active.mode !== "live" || !reviewId.startsWith(active.googleLocationId)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await postReply(session.accessToken, reviewId, replyText);
    return NextResponse.json({ success: true });
  }

  // DB path: seeded review identified by its Prisma id.
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: { business: true },
  });

  if (!review || review.business.ownerId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await postReply(session.accessToken, review.googleReviewId, replyText);

  await prisma.review.update({
    where: { id: reviewId },
    data: { isReplied: true, replyText, repliedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
