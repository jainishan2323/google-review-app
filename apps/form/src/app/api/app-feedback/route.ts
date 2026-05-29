import { prisma } from "@repo/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  businessId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as unknown;
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    await prisma.appFeedback.create({
      data: {
        rating: parsed.data.rating,
        businessId: parsed.data.businessId ?? null,
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[POST /api/app-feedback]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
