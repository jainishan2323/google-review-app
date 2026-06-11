"use server";

import {
  prisma,
  Prisma,
  applyTaxonomyTemplate,
  TAXONOMY_TEMPLATES,
  DEFAULT_BUSINESS_TYPE,
} from "@repo/db";
import { revalidatePath } from "next/cache";

export type OnboardState = { ok: boolean; error?: string; createdName?: string };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Operator-driven pilot onboarding. Pre-creates the owner's placeholder User
 * (keyed by email) and the Business linked to it. On the owner's first Google
 * sign-in (apps/web), the upsert-by-email fills in their name/image — linking
 * has already happened here, so the owner just lands on their dashboard.
 *
 * Phase 1 captures the core fields plus a Business Type. googleLocationId is
 * mandatory but a placeholder until Phase 2 ("Connect Google") overwrites it with
 * the real Business Profile resource name. The business's form is seeded from its
 * Business Type's Taxonomy Template here, so the owner lands on a working form.
 * See docs/adr/0004-owner-business-linking-by-verified-email.md and ADR-0006.
 */
export async function onboardBusiness(
  _prev: OnboardState,
  formData: FormData
): Promise<OnboardState> {
  const ownerEmail = String(formData.get("ownerEmail") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const googlePlaceId = String(formData.get("googlePlaceId") ?? "").trim();
  const googleLocationId = String(formData.get("googleLocationId") ?? "").trim();
  const rawType = String(formData.get("businessType") ?? "").trim();
  const businessType = rawType in TAXONOMY_TEMPLATES ? rawType : DEFAULT_BUSINESS_TYPE;

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

    // Create the business and seed its form from the template atomically — a failed
    // seed must never leave a business without a form.
    await prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: { name, businessType, googlePlaceId, googleLocationId, ownerId: owner.id },
      });
      await applyTaxonomyTemplate(tx, business.id, businessType);
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

/**
 * Seed (or re-seed) a business's feedback form from its Business Type's Taxonomy
 * Template. For businesses onboarded before templates existed and still showing the
 * empty "No feedback form configured" state. Create-only: no-ops if a form exists.
 */
export async function reseedTaxonomy(
  businessId: string
): Promise<{ ok: boolean; error?: string }> {
  if (!businessId) return { ok: false, error: "Missing businessId." };
  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { businessType: true },
    });
    if (!business) return { ok: false, error: "Business not found." };

    const res = await prisma.$transaction((tx) =>
      applyTaxonomyTemplate(tx, businessId, business.businessType)
    );
    revalidatePath("/dashboard/businesses");
    return res.applied
      ? { ok: true }
      : { ok: false, error: "This business already has a feedback form." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
