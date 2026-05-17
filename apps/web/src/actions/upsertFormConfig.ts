"use server";

import { prisma } from "@repo/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50),
  positiveChips: z.array(z.string().min(1)).min(1, "Add at least one positive chip"),
  negativeChips: z.array(z.string().min(1)).min(1, "Add at least one negative chip"),
});

const FormConfigSchema = z.object({
  businessId: z.string().min(1),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  logoUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  welcomeMessage: z.string().min(1, "Welcome message is required").max(200),
  categories: z
    .array(categorySchema)
    .min(1, "Add at least one category")
    .max(3, "Maximum 3 categories allowed"),
});

export type FormConfigInput = z.infer<typeof FormConfigSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;

export async function upsertFormConfig(input: FormConfigInput) {
  const parsed = FormConfigSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Validation error" };
  }

  const { businessId, brandColor, logoUrl, welcomeMessage, categories } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const config = await tx.formConfig.upsert({
        where: { businessId },
        create: { businessId, brandColor, logoUrl: logoUrl || null, welcomeMessage },
        update: { brandColor, logoUrl: logoUrl || null, welcomeMessage },
      });

      // Replace all categories (delete + recreate preserves ordering)
      await tx.feedbackCategory.deleteMany({ where: { formConfigId: config.id } });
      await tx.feedbackCategory.createMany({
        data: categories.map((cat, i) => ({
          formConfigId: config.id,
          name: cat.name,
          positiveChips: cat.positiveChips,
          negativeChips: cat.negativeChips,
          order: i,
        })),
      });
    });

    revalidatePath("/dashboard/feedback/settings");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[upsertFormConfig]", message);
    return { success: false, error: message };
  }
}
