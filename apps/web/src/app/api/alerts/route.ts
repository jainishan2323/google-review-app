import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/db";
import type { AlertType } from "@repo/types";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const business = await prisma.business.findFirst({
    where: { ownerId: session.userId },
  });

  if (!business) {
    return NextResponse.json({ alerts: [] });
  }

  const alerts = await prisma.alertConfig.findMany({
    where: { businessId: business.id },
  });

  return NextResponse.json({ alerts });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const business = await prisma.business.findFirst({
    where: { ownerId: session.userId },
  });

  if (!business) {
    return NextResponse.json({ error: "No business found" }, { status: 404 });
  }

  const alert = await prisma.alertConfig.upsert({
    where: { businessId_alertType: { businessId: business.id, alertType } },
    update: { email, enabled },
    create: { businessId: business.id, email, alertType, enabled },
  });

  return NextResponse.json({ alert });
}
