import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import type { AlertType } from "@repo/types";
import { resolveCurrentBusiness } from "@/lib/current-business";

export async function GET() {
  const resolved = await resolveCurrentBusiness();
  if (resolved.status === "unauthenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (resolved.status === "unlinked") {
    return NextResponse.json({ alerts: [] });
  }

  const alerts = await prisma.alertConfig.findMany({
    where: { businessId: resolved.business.id },
  });

  return NextResponse.json({ alerts });
}

export async function POST(req: NextRequest) {
  const resolved = await resolveCurrentBusiness();
  if (resolved.status === "unauthenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (resolved.status === "unlinked") {
    return NextResponse.json({ error: "No business found" }, { status: 404 });
  }

  const body = await req.json();
  const email: string = body?.email?.trim() ?? "";
  const alertType: AlertType = body?.alertType;
  const enabled: boolean = body?.enabled ?? true;

  if (!email || !alertType) {
    return NextResponse.json(
      { error: "email and alertType are required" },
      { status: 400 }
    );
  }

  const alert = await prisma.alertConfig.upsert({
    where: { businessId_alertType: { businessId: resolved.business.id, alertType } },
    update: { email, enabled },
    create: { businessId: resolved.business.id, email, alertType, enabled },
  });

  return NextResponse.json({ alert });
}
