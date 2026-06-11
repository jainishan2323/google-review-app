"use server";

import { prisma, type Prisma } from "@repo/db";
import { translateLabels } from "@repo/llm";
import { type LabelMap } from "@repo/types";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const LABEL_MAX = 40;

/** Strip markup characters and length-cap a label — it's user input that reaches the LLM. */
function sanitizeLabel(s: string): string {
  return s.replace(/[<>{}[\]]/g, "").trim().slice(0, LABEL_MAX);
}

function sanitizeLabels(labels: Record<string, string>): LabelMap {
  const out: LabelMap = {};
  for (const [lang, text] of Object.entries(labels)) {
    out[lang] = sanitizeLabel(text ?? "");
  }
  return out;
}

const labelMapSchema = z.record(z.string(), z.string().max(200));

const tagSchema = z.object({
  id: z.string().min(1),
  labels: labelMapSchema,
  active: z.boolean(),
});

const categorySchema = z.object({
  id: z.string().min(1),
  labels: labelMapSchema,
  tags: z.array(tagSchema),
});

const FormConfigSchema = z.object({
  businessId: z.string().min(1),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  logoUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  welcomeMessage: z.string().min(1, "Welcome message is required").max(200),
  categories: z.array(categorySchema),
});

export type FormConfigInput = z.infer<typeof FormConfigSchema>;

/** Cap on active chips per polarity per category (form-usability guardrail). */
const ACTIVE_CHIPS_CAP = 4;

/**
 * Light-edits save: updates branding + per-language labels + active flags IN PLACE,
 * keyed by identity. It NEVER creates or deletes tags/categories — the template-seeded
 * set is frozen in v1 — so historical analytics references (which point at tag ids) are
 * always preserved. After applying edits, blank labels in supported languages are
 * auto-filled via translation (fill-blanks-only; existing labels are never overwritten).
 */
export async function upsertFormConfig(input: FormConfigInput) {
  const parsed = FormConfigSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation error" };
  }

  const { businessId, brandColor, logoUrl, welcomeMessage, categories } = parsed.data;

  // Authoritative current taxonomy — gives us polarity + ownership; we only ever touch ids
  // that actually belong to this business (no create, no cross-business writes).
  const config = await prisma.formConfig.findUnique({
    where: { businessId },
    include: { categories: { include: { tags: true } } },
  });
  if (!config) {
    return { success: false, error: "Form configuration not found." };
  }

  const supportedLanguages =
    config.supportedLanguages.length > 0 ? config.supportedLanguages : [config.defaultLanguage];
  const dbCategories = new Map(config.categories.map((c) => [c.id, c]));
  const dbTags = new Map(config.categories.flatMap((c) => c.tags).map((t) => [t.id, t]));

  // Resolve the submitted edits against the DB, dropping unknown ids.
  type ResolvedTag = { id: string; labels: LabelMap; active: boolean; polarity: "positive" | "negative"; categoryId: string };
  const tagEdits: ResolvedTag[] = [];
  const categoryEdits: { id: string; labels: LabelMap }[] = [];
  for (const cat of categories) {
    if (!dbCategories.has(cat.id)) continue;
    categoryEdits.push({ id: cat.id, labels: sanitizeLabels(cat.labels) });
    for (const tag of cat.tags) {
      const dbTag = dbTags.get(tag.id);
      if (!dbTag || dbTag.categoryId !== cat.id) continue;
      tagEdits.push({
        id: tag.id,
        labels: sanitizeLabels(tag.labels),
        active: tag.active,
        polarity: dbTag.polarity,
        categoryId: dbTag.categoryId,
      });
    }
  }

  // Guardrail: active-chips cap per polarity per category.
  const activeCounts = new Map<string, number>();
  for (const t of tagEdits) {
    if (!t.active) continue;
    const key = `${t.categoryId}:${t.polarity}`;
    const n = (activeCounts.get(key) ?? 0) + 1;
    activeCounts.set(key, n);
    if (n > ACTIVE_CHIPS_CAP) {
      return {
        success: false,
        error: `At most ${ACTIVE_CHIPS_CAP} active ${t.polarity} chips are allowed per category.`,
      };
    }
  }

  // Guardrail: no two ACTIVE tags share the same label in the same language (business-wide).
  for (const lang of supportedLanguages) {
    const seen = new Map<string, string>();
    for (const t of tagEdits.filter((x) => x.active)) {
      const label = t.labels[lang]?.toLowerCase();
      if (!label) continue;
      if (seen.has(label)) {
        return {
          success: false,
          error: `Two active chips share the label "${t.labels[lang]}" in ${lang}. Labels must be unique per language.`,
        };
      }
      seen.set(label, t.id);
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.formConfig.update({
        where: { businessId },
        data: { brandColor, logoUrl: logoUrl || null, welcomeMessage },
      });
      for (const cat of categoryEdits) {
        await tx.feedbackCategory.update({
          where: { id: cat.id },
          data: { labels: cat.labels as Prisma.InputJsonValue },
        });
      }
      for (const tag of tagEdits) {
        await tx.tag.update({
          where: { id: tag.id },
          data: { labels: tag.labels as Prisma.InputJsonValue, active: tag.active },
        });
      }
    });

    // Fill-blanks-only: for each supported language, translate the entries that have no
    // label yet from the default language. Existing labels are never overwritten.
    await fillBlankLabels(config.defaultLanguage, supportedLanguages, categoryEdits, tagEdits);

    revalidatePath("/dashboard/feedback/settings");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[upsertFormConfig]", message);
    return { success: false, error: message };
  }
}

/** Translate any labels left blank in a supported language from the default-language label. */
async function fillBlankLabels(
  defaultLanguage: string,
  supportedLanguages: string[],
  categoryEdits: { id: string; labels: LabelMap }[],
  tagEdits: { id: string; labels: LabelMap }[]
): Promise<void> {
  for (const lang of supportedLanguages) {
    if (lang === defaultLanguage) continue;

    const targets: { kind: "category" | "tag"; id: string; source: string }[] = [];
    for (const c of categoryEdits) {
      if (!c.labels[lang] && c.labels[defaultLanguage]) {
        targets.push({ kind: "category", id: c.id, source: c.labels[defaultLanguage] });
      }
    }
    for (const t of tagEdits) {
      if (!t.labels[lang] && t.labels[defaultLanguage]) {
        targets.push({ kind: "tag", id: t.id, source: t.labels[defaultLanguage] });
      }
    }
    if (targets.length === 0) continue;

    const translations = await translateLabels(
      targets.map((t) => t.source),
      defaultLanguage,
      lang
    );

    await prisma.$transaction(
      targets.map((t, i) => {
        const value = sanitizeLabel(translations[i] ?? t.source);
        return t.kind === "category"
          ? prisma.feedbackCategory.update({
              where: { id: t.id },
              data: { labels: { ...labelsOf(categoryEdits, t.id), [lang]: value } as Prisma.InputJsonValue },
            })
          : prisma.tag.update({
              where: { id: t.id },
              data: { labels: { ...labelsOf(tagEdits, t.id), [lang]: value } as Prisma.InputJsonValue },
            });
      })
    );
  }
}

function labelsOf(items: { id: string; labels: LabelMap }[], id: string): LabelMap {
  return items.find((i) => i.id === id)?.labels ?? {};
}
