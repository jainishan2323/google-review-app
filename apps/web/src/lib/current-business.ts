import { cache } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { prisma } from "@repo/db";
import { authOptions } from "./auth";

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
      businesses: {
        // Pilot renders the first; modelled as a list so multi-business and
        // multi-platform futures are added rows, not a rebuild.
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, googleLocationId: true },
      },
    },
  });

  const businesses = user?.businesses ?? [];
  if (businesses.length === 0) return { status: "unlinked" };

  return { status: "ok", business: businesses[0], businesses };
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
