import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/db";

// Dev-only endpoint to read back the Google OAuth tokens captured at login, so we
// can copy a restaurant owner's refresh token during an in-person session and reuse
// it later for offline testing of the Business Profile API.
//
// Gated behind DEV_TOKEN_CAPTURE so it 404s in normal production. Returns only the
// currently authenticated user's own tokens.
// TODO(pre-public): remove this route and the DEV_TOKEN_CAPTURE flag.
export async function GET() {
  if (process.env.DEV_TOKEN_CAPTURE !== "true") {
    return new NextResponse("Not found", { status: 404 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      email: true,
      googleAccessToken: true,
      googleRefreshToken: true,
      googleTokenExpiresAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}
