"use server";

import { prisma, Prisma } from "@repo/db";
import { revalidatePath } from "next/cache";

export type OnboardState = { ok: boolean; error?: string; createdName?: string };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Operator-driven pilot onboarding. Pre-creates the owner's placeholder User
 * (keyed by email) and the Business linked to it. On the owner's first Google
 * sign-in (apps/web), the upsert-by-email fills in their name/image — linking
 * has already happened here, so the owner just lands on their dashboard.
 *
 * Phase 1 captures four fields only. googleLocationId is mandatory but a
 * placeholder until Phase 2 ("Connect Google") overwrites it with the real
 * Business Profile resource name. No taxonomy/brand here — those are managed
 * later in the owner's own Feedback Settings.
 * See docs/adr/0004-owner-business-linking-by-verified-email.md
 */
export async function onboardBusiness(
  _prev: OnboardState,
  formData: FormData
): Promise<OnboardState> {
  const ownerEmail = String(formData.get("ownerEmail") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const googlePlaceId = String(formData.get("googlePlaceId") ?? "").trim();
  const googleLocationId = String(formData.get("googleLocationId") ?? "").trim();

  if (!ownerEmail || !name || !googlePlaceId || !googleLocationId) {
    return { ok: false, error: "All four fields are required." };
  }
  if (!EMAIL_RE.test(ownerEmail)) {
    return { ok: false, error: "Enter a valid owner email." };
  }

  try {
    const owner = await prisma.user.upsert({
      where: { email: ownerEmail },
      update: {},
      create: { email: ownerEmail, role: "OWNER" },
    });

    await prisma.business.create({
      data: { name, googlePlaceId, googleLocationId, ownerId: owner.id },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return {
        ok: false,
        error: "That Google Location ID is already in use — pick a unique value.",
      };
    }
    throw e;
  }

  revalidatePath("/dashboard/businesses");
  return { ok: true, createdName: name };
}
