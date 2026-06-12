"use server";

import { prisma } from "@repo/db";
import { resolveLabel } from "@repo/types";
import {
  generateReviewText,
  buildReviewPrompt,
  MODEL_REGISTRY,
  getModel,
} from "@repo/llm";

/**
 * Review playground (Operator tool, Lantern).
 *
 * Runs the REAL `generateReviewText` against a matrix of input scenarios × models,
 * so the Operator can eyeball how the production prompt behaves across ratings,
 * chip selections, and models before a pilot. The prompt is preview-only — it is
 * never edited here; it lives in code (review-generator.ts, ADR-0007). Tuning the
 * prompt means editing that file; this tool shows the effect.
 *
 * Stateless: scenarios live in the page; nothing is persisted. See ADR-0008 for
 * the model-selection seam this depends on.
 */

/** A single tappable chip of a business's taxonomy, resolved to its label. */
export interface PlaygroundChip {
  tagId: string;
  label: string;
  polarity: "positive" | "negative";
}

export interface PlaygroundBusiness {
  id: string;
  name: string;
  defaultLanguage: string;
  chips: PlaygroundChip[];
}

/** One row of the matrix: a scenario over the chosen business's taxonomy. */
export interface ScenarioInput {
  rating: number;
  tagIds: string[];
  customText?: string;
  language?: string;
  attempt?: number;
}

export interface MatrixCell {
  rowIndex: number;
  modelId: string;
  text?: string;
  error?: string;
}

export interface MatrixRowMeta {
  rowIndex: number;
  /** The exact assembled prompt for this row — identical across model columns. */
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
}

export interface MatrixResult {
  rows: MatrixRowMeta[];
  cells: MatrixCell[];
  error?: string;
}

/** Hard ceiling on generations per Run — each cell is a paid API call. */
const MAX_CELLS = 40;

/** Businesses that have a feedback form configured (a taxonomy to draw chips from). */
export async function listPlaygroundBusinesses(): Promise<{ id: string; name: string }[]> {
  const businesses = await prisma.business.findMany({
    where: { formConfig: { isNot: null } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return businesses;
}

/** Load a business's name, default language, and active chips resolved to labels. */
export async function loadPlaygroundBusiness(
  businessId: string
): Promise<PlaygroundBusiness | null> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      formConfig: {
        select: {
          defaultLanguage: true,
          categories: {
            select: {
              tags: {
                where: { active: true },
                select: { id: true, labels: true, authoredLanguage: true, polarity: true },
                orderBy: { order: "asc" },
              },
            },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!business || !business.formConfig) return null;

  const defaultLanguage = business.formConfig.defaultLanguage;
  const chips: PlaygroundChip[] = business.formConfig.categories
    .flatMap((c) => c.tags)
    .map((t) => ({
      tagId: t.id,
      label: resolveLabel(t.labels, { default: defaultLanguage, authored: t.authoredLanguage }),
      polarity: t.polarity as "positive" | "negative",
    }))
    .filter((c) => c.label.length > 0);

  return { id: business.id, name: business.name, defaultLanguage, chips };
}

/**
 * Generate the full scenario × model matrix. Resolves each row's selected tag IDs
 * to labels (same path as the form's /api/generate), builds the real prompt for
 * the row preview, and runs every (row, model) cell. Cells fail independently —
 * one model erroring doesn't sink the grid.
 */
export async function runMatrix(args: {
  businessId: string;
  scenarios: ScenarioInput[];
  modelIds: string[];
}): Promise<MatrixResult> {
  const { businessId, scenarios, modelIds } = args;

  if (scenarios.length === 0 || modelIds.length === 0) {
    return { rows: [], cells: [], error: "Add at least one scenario and one model." };
  }
  if (scenarios.length * modelIds.length > MAX_CELLS) {
    return {
      rows: [],
      cells: [],
      error: `That's ${scenarios.length * modelIds.length} generations; the cap is ${MAX_CELLS}. Trim scenarios or models.`,
    };
  }

  const business = await loadPlaygroundBusiness(businessId);
  if (!business) return { rows: [], cells: [], error: "Business not found or has no form." };

  const models = modelIds.map(getModel).filter((m): m is NonNullable<typeof m> => m != null);
  if (models.length === 0) return { rows: [], cells: [], error: "No valid models selected." };

  const labelOf = new Map(business.chips.map((c) => [c.tagId, c.label]));

  // Build each row's resolved input + prompt preview once (prompt is model-independent).
  const rowInputs = scenarios.map((s) => {
    const language = s.language || business.defaultLanguage;
    const tags = s.tagIds.map((id) => labelOf.get(id)).filter((l): l is string => !!l);
    const input = {
      rating: s.rating,
      tags,
      customText: s.customText?.trim() ? s.customText.trim() : undefined,
      attempt: s.attempt ?? 0,
      language,
    };
    return { input, preview: buildReviewPrompt(input, business.name) };
  });

  const rows: MatrixRowMeta[] = rowInputs.map((r, rowIndex) => ({
    rowIndex,
    systemPrompt: r.preview.system,
    userPrompt: r.preview.user,
    temperature: r.preview.temperature,
  }));

  // Fan out every cell; isolate failures per cell.
  const cells = await Promise.all(
    rowInputs.flatMap((r, rowIndex) =>
      models.map(async (model): Promise<MatrixCell> => {
        try {
          const text = await generateReviewText(r.input, business.name, model);
          return { rowIndex, modelId: model.id, text };
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          return { rowIndex, modelId: model.id, error: message };
        }
      })
    )
  );

  return { rows, cells };
}

/** The models the playground offers — straight from the registry. */
export async function listPlaygroundModels(): Promise<typeof MODEL_REGISTRY> {
  return MODEL_REGISTRY;
}
