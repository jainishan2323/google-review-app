import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/db";
import { postReply } from "@/lib/google-business";

export async function POST(
  req: NextRequest,
  { params }: { params: { reviewId: string } }
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

  const review = await prisma.review.findUnique({
    where: { id: params.reviewId },
    include: { business: true },
  });

  if (!review || review.business.ownerId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await postReply(session.accessToken, review.googleReviewId, replyText);

  await prisma.review.update({
    where: { id: params.reviewId },
    data: { isReplied: true, replyText, repliedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
