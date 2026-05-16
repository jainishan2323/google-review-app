import { prisma } from "@repo/db";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const { businessId, rating, text } = body as Record<string, unknown>;

    if (!businessId || typeof businessId !== "string" || businessId.trim() === "") {
      return NextResponse.json({ error: "businessId is required" }, { status: 400 });
    }

    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: "rating must be an integer between 1 and 5" }, { status: 400 });
    }

    const businessExists = await prisma.business.findUnique({
      where: { id: businessId.trim() },
      select: { id: true },
    });
    if (!businessExists) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const feedback = await prisma.anonymousFeedback.create({
      data: {
        businessId: businessId.trim(),
        rating: ratingNum,
        text: typeof text === "string" && text.trim() !== "" ? text.trim() : null,
        status: "unread",
      },
    });

    revalidatePath("/dashboard/feedback");

    return NextResponse.json({ success: true, id: feedback.id }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[POST /api/feedback]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
