import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { prisma } from "@repo/db";
import { authOptions } from "./auth";

// Which of a user's businesses is active in the dashboard. Set by the sidebar
// switcher; only ever trusted after re-validating against the user's own candidate
// list, so a tampered value can never select a business that isn't theirs. For an
// Operator (role=ADMIN) that candidate list is *every* business, so an admin may
// legitimately select any of them — see ADR 0014.
export const ACTIVE_BUSINESS_COOKIE = "activeBusinessId";

// Owner→business resolution keys off the *verified Google email*, never
// `session.userId` (which, with no NextAuth DB adapter, is the Google `sub`
// and does NOT equal the Prisma User.id). The owner's User row + their
// Business are pre-created by the Operator at onboarding, so by the time an
// owner signs in their business is already linked.
// See docs/adr/0004-owner-business-linking-by-verified-email.md

export type ResolvedBusiness = {
  id: string;
  name: string;
  googleLocationId: string;
};

type Resolution =
  | { status: "unauthenticated" }
  | { status: "unlinked" }
  | { status: "ok"; business: ResolvedBusiness; businesses: ResolvedBusiness[] };

// `cache` dedupes within a single request render, so the layout and the page
// don't each re-run the session + DB lookup.
export const resolveCurrentBusiness = cache(async (): Promise<Resolution> => {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return { status: "unauthenticated" };

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      role: true,
      businesses: {
        // Pilot renders the first; modelled as a list so multi-business and
        // multi-platform futures are added rows, not a rebuild.
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, googleLocationId: true },
      },
    },
  });

  if (!user) return { status: "unlinked" };

  // Owners see only the businesses they own (the `ownerId` relation). The Operator
  // (role=ADMIN) can view and operate *every* business in the dashboard — businesses
  // stay single-owner; admin access is a read of all rows, not co-ownership. Google
  // data stays walled off regardless: live Reviews/Analytics gate on a per-grant
  // `business.manage` token the admin doesn't hold. See ADR 0014.
  const businesses =
    user.role === "ADMIN"
      ? await prisma.business.findMany({
          orderBy: { createdAt: "asc" },
          select: { id: true, name: true, googleLocationId: true },
        })
      : user.businesses;

  if (businesses.length === 0) return { status: "unlinked" };

  // The active business is the cookie's choice *if* the owner actually owns it,
  // else the first. Every consumer (pages + API routes) reads `business`, so this
  // one line is what threads the switcher's selection through the whole dashboard.
  const activeId = (await cookies()).get(ACTIVE_BUSINESS_COOKIE)?.value;
  const business = businesses.find((b) => b.id === activeId) ?? businesses[0];

  return { status: "ok", business, businesses };
});

/**
 * For dashboard pages + layout: returns the signed-in owner's business, or
 * redirects — to /login if not signed in, to /no-business if signed in with an
 * email we haven't pre-provisioned.
 */
export const requireCurrentBusiness = cache(async (): Promise<ResolvedBusiness> => {
  const result = await resolveCurrentBusiness();
  if (result.status === "unauthenticated") redirect("/login");
  if (result.status === "unlinked") redirect("/no-business");
  return result.business;
});

/**
 * Like requireCurrentBusiness, but also returns the owner's full business list —
 * for the layout/sidebar switcher. Same redirect behaviour.
 */
export const requireBusinessContext = cache(
  async (): Promise<{ active: ResolvedBusiness; businesses: ResolvedBusiness[] }> => {
    const result = await resolveCurrentBusiness();
    if (result.status === "unauthenticated") redirect("/login");
    if (result.status === "unlinked") redirect("/no-business");
    return { active: result.business, businesses: result.businesses };
  }
);
