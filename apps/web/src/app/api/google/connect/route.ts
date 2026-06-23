import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { requireCurrentBusiness } from "@/lib/current-business";
import { buildConsentUrl } from "@/lib/google-oauth";

// Kicks off the "Connect Google Reviews" incremental-auth flow for the *active*
// business. requireCurrentBusiness() redirects to /login or /no-business as needed,
// so reaching past it means we have a business the signed-in user may operate.
export const dynamic = "force-dynamic";

const STATE_COOKIE = "g_connect_state";

export async function GET() {
  const business = await requireCurrentBusiness();

  // state = "<businessId>:<nonce>". We stash the same value in an httpOnly cookie
  // and compare on callback (CSRF guard) + recover which business to link.
  const nonce = randomUUID();
  const state = `${business.id}:${nonce}`;

  (await cookies()).set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600, // 10 minutes
  });

  return NextResponse.redirect(buildConsentUrl(state));
}
