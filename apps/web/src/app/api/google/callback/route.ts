import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@repo/db";
import { resolveCurrentBusiness } from "@/lib/current-business";
import { exchangeCode } from "@/lib/google-oauth";
import { listAccounts, listLocations } from "@/lib/google-business";
import { syncBusinessReviews } from "@/lib/sync-reviews";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "g_connect_state";

// Redirect back to settings with a status the page can render.
function back(req: NextRequest, params: Record<string, string>) {
  const url = new URL("/dashboard/reviews", req.url);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  const jar = await cookies();
  const cookieState = jar.get(STATE_COOKIE)?.value;
  jar.delete(STATE_COOKIE); // one-shot

  if (error) return back(req, { google: "error", reason: error });
  if (!code || !state || state !== cookieState) {
    return back(req, { google: "error", reason: "invalid_state" });
  }

  const businessId = state.split(":")[0];

  // Re-verify the signed-in user may operate this business (owner, or ADMIN with
  // cross-business access). resolveCurrentBusiness returns their full candidate list.
  const resolved = await resolveCurrentBusiness();
  if (
    resolved.status !== "ok" ||
    !resolved.businesses.some((b) => b.id === businessId)
  ) {
    return back(req, { google: "error", reason: "forbidden" });
  }

  try {
    const tokens = await exchangeCode(code);

    // Discover the account → location to link. MVP: link the first location found.
    // A multi-location picker is a follow-up (we surface the count so it's visible).
    const accounts = await listAccounts(tokens.accessToken);
    let chosen: { googleLocationId: string; title: string } | null = null;
    let locationCount = 0;

    for (const account of accounts) {
      const locations = await listLocations(tokens.accessToken, account.name);
      locationCount += locations.length;
      if (!chosen && locations[0]) {
        chosen = {
          // Reviews/replies need the combined "accounts/123/locations/456" name.
          googleLocationId: `${account.name}/${locations[0].name}`,
          title: locations[0].title ?? "My Business",
        };
      }
    }

    if (!chosen) {
      return back(req, { google: "error", reason: "no_locations" });
    }

    await prisma.business.update({
      where: { id: businessId },
      data: {
        googleLocationId: chosen.googleLocationId,
        accessToken: tokens.accessToken,
        // Google omits refresh_token if one was already granted; keep the old one.
        ...(tokens.refreshToken ? { refreshToken: tokens.refreshToken } : {}),
        tokenExpiresAt: tokens.expiresAt,
      },
    });

    // Pull reviews in straight away so the dashboard has data on first render.
    // Best-effort: a sync hiccup shouldn't turn a successful connect into an error
    // (the reviews page will retry the bootstrap sync, and the Sync button exists).
    try {
      await syncBusinessReviews({
        id: businessId,
        googleLocationId: chosen.googleLocationId,
      });
    } catch (err) {
      console.error("Initial sync after connect failed", err);
    }

    return back(req, {
      google: "connected",
      loc: chosen.title,
      ...(locationCount > 1 ? { more: String(locationCount) } : {}),
    });
  } catch (err) {
    console.error("Google connect callback failed", err);
    return back(req, { google: "error", reason: "exchange_failed" });
  }
}
