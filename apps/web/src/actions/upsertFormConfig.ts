"use server";

import { prisma, type Prisma } from "@repo/db";
import { translateLabels } from "@repo/llm";
import { type LabelMap } from "@repo/types";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const LABEL_MAX = 40;
const WELCOME_MAX = 200;

/** Strip markup characters and length-cap user text that also reaches the LLM. */
function sanitizeText(s: string, max: number): string {
  return s.replace(/[<>{}[\]]/g, "").trim().slice(0, max);
}

function sanitizeMap(labels: Record<string, string>, max: number): LabelMap {
  const out: LabelMap = {};
  for (const [lang, text] of Object.entries(labels)) {
    out[lang] = sanitizeText(text ?? "", max);
  }
  return out;
}

const labelMapSchema = z.record(z.string(), z.string().max(400));

const tagSchema = z.object({
  // Existing tags carry their cuid; newly-added chips carry a client temp id ("new:…").
  id: z.string().min(1),
  labels: labelMapSchema,
  active: z.boolean(),
  order: z.number().int().min(0),
  // Used only when creating a new chip (existing tags keep their immutable DB polarity).
  polarity: z.enum(["positive", "negative"]),
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
  // Per-language welcome map; the base language entry is required non-empty.
  welcomeMessage: labelMapSchema,
  supportedLanguages: z.array(z.string().min(2).max(8)).min(1),
  categories: z.array(categorySchema),
  // Tag ids the owner permanently removed; server re-validates each is safe to hard-delete.
  deletedIds: z.array(z.string().min(1)).default([]),
});

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type FormConfigInput = z.infer<typeof FormConfigSchema>;

/** Cap on active chips per polarity per category (form-usability guardrail). */
const ACTIVE_CHIPS_CAP = 4;

/**
 * Light-edits save: updates branding, per-language labels, active flags, chip ORDER,
 * the welcome map, and the supportedLanguages set — all IN PLACE, keyed by identity.
 * Never creates/deletes tags or categories (the template-seeded set is frozen), so
 * historical analytics references are always preserved. Newly-enabled languages get
 * their blank labels auto-filled; the base language is always retained.
 */
export async function upsertFormConfig(input: FormConfigInput) {
  const parsed = FormConfigSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation error" };
  }

  const { businessId, brandColor, logoUrl, welcomeMessage, supportedLanguages, categories, deletedIds } =
    parsed.data;

  const config = await prisma.formConfig.findUnique({
    where: { businessId },
    include: { categories: { include: { tags: true } } },
  });
  if (!config) {
    return { success: false, error: "Form configuration not found." };
  }

  // The base language is immutable and always supported; dedupe the rest.
  const langs = Array.from(new Set([config.defaultLanguage, ...supportedLanguages]));

  const welcome = sanitizeMap(welcomeMessage, WELCOME_MAX);
  if (!welcome[config.defaultLanguage]) {
    return { success: false, error: "A welcome message in the base language is required." };
  }

  const dbCategories = new Map(config.categories.map((c) => [c.id, c]));
  const dbTags = new Map(config.categories.flatMap((c) => c.tags).map((t) => [t.id, t]));

  // Re-validate hard-deletes server-side: a tag is deletable only if it belongs to this
  // business, is < 7 days old, and is referenced by no feedback (never orphan history).
  let toDelete: string[] = [];
  if (deletedIds.length > 0) {
    const [refReviews, refFeedback] = await Promise.all([
      prisma.review.findMany({ where: { businessId }, select: { tags: true, negativeTags: true } }),
      prisma.anonymousFeedback.findMany({ where: { businessId }, select: { tags: true, negativeTags: true } }),
    ]);
    const referenced = new Set<string>();
    for (const r of [...refReviews, ...refFeedback]) {
      for (const id of r.tags) referenced.add(id);
      for (const id of r.negativeTags) referenced.add(id);
    }
    toDelete = deletedIds.filter((id) => {
      const t = dbTags.get(id);
      return !!t && Date.now() - t.createdAt.getTime() < WEEK_MS && !referenced.has(id);
    });
  }

  type ResolvedTag = {
    id: string;
    isNew: boolean;
    labels: LabelMap;
    active: boolean;
    order: number;
    polarity: "positive" | "negative";
    categoryId: string;
  };
  const tagEdits: ResolvedTag[] = [];
  const categoryEdits: { id: string; labels: LabelMap }[] = [];
  for (const cat of categories) {
    // Categories are never created here — only the template seeds them. Ignore unknown ids.
    if (!dbCategories.has(cat.id)) continue;
    categoryEdits.push({ id: cat.id, labels: sanitizeMap(cat.labels, LABEL_MAX) });
    for (const tag of cat.tags) {
      const dbTag = dbTags.get(tag.id);
      const isNew = !dbTag;
      // An existing tag must belong to this category; ignore cross-category mismatches.
      if (dbTag && dbTag.categoryId !== cat.id) continue;
      const labels = sanitizeMap(tag.labels, LABEL_MAX);
      // A brand-new chip with no base-language label is an empty row the owner left — skip it.
      if (isNew && !labels[config.defaultLanguage]) continue;
      tagEdits.push({
        id: tag.id,
        isNew,
        labels,
        active: tag.active,
        order: tag.order,
        polarity: isNew ? tag.polarity : dbTag!.polarity,
        categoryId: cat.id,
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
  for (const lang of langs) {
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
    // Real ids of every tag after the write (created ids for new chips) — fed to fill-blanks.
    const persistedTags: { id: string; labels: LabelMap }[] = [];
    await prisma.$transaction(async (tx) => {
      await tx.formConfig.update({
        where: { businessId },
        data: {
          brandColor,
          logoUrl: logoUrl || null,
          welcomeMessage: welcome as Prisma.InputJsonValue,
          supportedLanguages: langs,
        },
      });
      for (const cat of categoryEdits) {
        await tx.feedbackCategory.update({
          where: { id: cat.id },
          data: { labels: cat.labels as Prisma.InputJsonValue },
        });
      }
      // Permanent deletes (already re-validated as young + unreferenced).
      if (toDelete.length > 0) {
        await tx.tag.deleteMany({ where: { id: { in: toDelete } } });
      }
      for (const tag of tagEdits) {
        if (tag.isNew) {
          // Per-business CUSTOM chip — never touches the restaurant-level template.
          const created = await tx.tag.create({
            data: {
              categoryId: tag.categoryId,
              polarity: tag.polarity,
              labels: tag.labels as Prisma.InputJsonValue,
              active: tag.active,
              order: tag.order,
              source: "custom",
              authoredLanguage: config.defaultLanguage,
            },
          });
          persistedTags.push({ id: created.id, labels: tag.labels });
        } else {
          await tx.tag.update({
            where: { id: tag.id },
            data: {
              labels: tag.labels as Prisma.InputJsonValue,
              active: tag.active,
              order: tag.order,
            },
          });
          persistedTags.push({ id: tag.id, labels: tag.labels });
        }
      }
    });

    // Fill-blanks-only: translate labels missing in a supported language from the base
    // language. Existing labels are never overwritten; welcome is excluded (base fallback).
    await fillBlankLabels(config.defaultLanguage, langs, categoryEdits, persistedTags);

    revalidatePath("/dashboard/feedback/settings");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[upsertFormConfig]", message);
    return { success: false, error: message };
  }
}

/** Translate any labels left blank in a supported language from the base-language label. */
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
        const value = sanitizeText(translations[i] ?? t.source, LABEL_MAX);
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
