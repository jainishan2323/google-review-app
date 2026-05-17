"use server";

import { prisma } from "@repo/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const FormConfigSchema = z.object({
  businessId: z.string().min(1),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  logoUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  welcomeMessage: z.string().min(1, "Welcome message is required").max(200),
  positiveChips: z.array(z.string().min(1)).min(1, "Add at least one positive chip"),
  negativeChips: z.array(z.string().min(1)).min(1, "Add at least one negative chip"),
});

export type FormConfigInput = z.infer<typeof FormConfigSchema>;

export async function upsertFormConfig(input: FormConfigInput) {
  const parsed = FormConfigSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Validation error" };
  }

  const { businessId, brandColor, logoUrl, welcomeMessage, positiveChips, negativeChips } =
    parsed.data;

  try {
    await prisma.formConfig.upsert({
      where: { businessId },
      create: {
        businessId,
        brandColor,
        logoUrl: logoUrl || null,
        welcomeMessage,
        positiveChips,
        negativeChips,
      },
      update: {
        brandColor,
        logoUrl: logoUrl || null,
        welcomeMessage,
        positiveChips,
        negativeChips,
      },
    });

    revalidatePath("/dashboard/feedback/settings");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[upsertFormConfig]", message);
    return { success: false, error: message };
  }
}
