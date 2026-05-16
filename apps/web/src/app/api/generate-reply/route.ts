import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/db";
import { draftReply } from "@repo/llm";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
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

  if (!review || review.business.ownerId !== session.userId) {
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
