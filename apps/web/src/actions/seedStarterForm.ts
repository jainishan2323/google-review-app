"use server";

import { prisma, applyTaxonomyTemplate, DEFAULT_BUSINESS_TYPE } from "@repo/db";
import { revalidatePath } from "next/cache";
import { requireCurrentBusiness } from "@/lib/current-business";

/**
 * Owner self-serve: seed a starter feedback form from the business's Business Type
 * Taxonomy Template, for an owner whose business was onboarded before templates
 * existed and whose Feedback Settings is still empty. Create-only (no-ops if a form
 * already exists), so it can't clobber an edited taxonomy.
 */
export async function seedStarterForm(): Promise<{ success: boolean; error?: string }> {
  const business = await requireCurrentBusiness();
  try {
    const row = await prisma.business.findUnique({
      where: { id: business.id },
      select: { businessType: true },
    });
    const res = await prisma.$transaction((tx) =>
      applyTaxonomyTemplate(tx, business.id, row?.businessType ?? DEFAULT_BUSINESS_TYPE)
    );
    revalidatePath("/dashboard/feedback/settings");
    return res.applied
      ? { success: true }
      : { success: false, error: "A feedback form already exists." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
