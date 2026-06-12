"use server";

import { cookies } from "next/headers";
import { ACTIVE_BUSINESS_COOKIE, resolveCurrentBusiness } from "@/lib/current-business";

/**
 * Set the dashboard's active business. Validates that the signed-in owner actually
 * owns the target before writing the cookie — a client can't switch into a business
 * that isn't theirs. The caller hard-reloads afterwards so server-rendered pages and
 * client-fetched API data both pick up the new selection.
 */
export async function setActiveBusiness(businessId: string): Promise<void> {
  const resolved = await resolveCurrentBusiness();
  if (resolved.status !== "ok") return;
  if (!resolved.businesses.some((b) => b.id === businessId)) return;

  (await cookies()).set(ACTIVE_BUSINESS_COOKIE, businessId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
