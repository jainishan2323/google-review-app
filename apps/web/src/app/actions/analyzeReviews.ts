"use server";

import { prisma } from "@repo/db";
import { analyzeBatch } from "@repo/llm";
import { resolveLabel, type ReviewAnalysisInput, type TaxonomyCategory } from "@repo/types";
import { revalidatePath } from "next/cache";

const BATCH_SIZE = 15;

/**
 * Processes ONE batch of up to 15 un-analyzed records (mixing reviews + feedback)
 * for the business. Returns the number processed and the number remaining.
 *
 * Idempotent — already-analyzed records are filtered out by the WHERE clause,
 * so the client can safely retry after a failure to resume where it left off.
 */
export async function analyzeBatchOnce(businessId: string): Promise<{
  processed: number;
  remaining: number;
}> {
  if (!businessId || typeof businessId !== "string") {
    throw new Error("[analyzeBatchOnce] businessId is required.");
  }

  const formConfig = await prisma.formConfig.findUnique({
    where: { businessId },
    include: {
      categories: {
        orderBy: { order: "asc" },
        // Inactive tags stay resolvable for history but are not offered to the analyzer.
        include: { tags: { where: { active: true }, orderBy: { order: "asc" } } },
      },
    },
  });

  const language = formConfig?.defaultLanguage ?? "en";

  // Build the taxonomy dictionary from default-language labels, and a reverse map
  // (canonical-language label → tag identity) so analyzer output maps back to ids.
  // Labels are business-wide unique per language (guardrail), so label alone is unambiguous.
  const labelToId = new Map<string, string>();
  const taxonomy: TaxonomyCategory[] =
    formConfig?.categories.map((cat) => {
      const byPolarity = { positive: [] as string[], negative: [] as string[] };
      for (const tag of cat.tags) {
        const label = resolveLabel(tag.labels, { default: language, authored: tag.authoredLanguage });
        if (!label) continue;
        labelToId.set(label, tag.id);
        byPolarity[tag.polarity].push(label);
      }
      return {
        name: resolveLabel(cat.labels, { default: language }),
        positiveTags: byPolarity.positive,
        negativeTags: byPolarity.negative,
      };
    }) ?? [];

  if (taxonomy.length === 0) {
    return { processed: 0, remaining: 0 };
  }

  // Pull up to BATCH_SIZE un-analyzed records — reviews first, then feedback
  const reviews = await prisma.review.findMany({
    where: { businessId, analyzedAt: null, text: { not: null } },
    select: { id: true, text: true, rating: true },
    take: BATCH_SIZE,
    orderBy: { publishedAt: "asc" },
  });

  const feedbackTake = BATCH_SIZE - reviews.length;
  const feedback =
    feedbackTake > 0
      ? await prisma.anonymousFeedback.findMany({
          where: { businessId, analyzedAt: null, text: { not: null } },
          select: { id: true, text: true, rating: true },
          take: feedbackTake,
          orderBy: { createdAt: "asc" },
        })
      : [];

  if (reviews.length + feedback.length === 0) {
    return { processed: 0, remaining: 0 };
  }

  const reviewIds = new Set(reviews.map((r) => r.id));
  const inputs: ReviewAnalysisInput[] = [
    ...reviews.map((r) => ({ id: r.id, text: r.text!, rating: r.rating })),
    ...feedback.map((f) => ({ id: f.id, text: f.text!, rating: f.rating })),
  ];

  const out = await analyzeBatch(inputs, taxonomy);
  const now = new Date();

  await Promise.all(
    out.results.map((r) => {
      // Map the analyzer's label strings back to tag IDENTITIES before storage.
      // A label with no match (e.g. edited away mid-batch) is dropped.
      const mapped = r.mappedTags
        .map((t) => ({ id: labelToId.get(t.tag), sentiment: t.sentiment }))
        .filter((t): t is { id: string; sentiment: "positive" | "negative" } => t.id !== undefined);
      const data = {
        tags: mapped.map((t) => t.id),
        negativeTags: mapped.filter((t) => t.sentiment === "negative").map((t) => t.id),
        unmappedInsights: r.unmappedInsights,
        analyzedAt: now,
      };
      return reviewIds.has(r.reviewId)
        ? prisma.review.update({ where: { id: r.reviewId }, data })
        : prisma.anonymousFeedback.update({ where: { id: r.reviewId }, data });
    })
  );

  const [remainingReviews, remainingFeedback] = await Promise.all([
    prisma.review.count({ where: { businessId, analyzedAt: null, text: { not: null } } }),
    prisma.anonymousFeedback.count({ where: { businessId, analyzedAt: null, text: { not: null } } }),
  ]);

  const remaining = remainingReviews + remainingFeedback;
  if (remaining === 0) {
    revalidatePath("/dashboard/analytics");
  }

  return {
    processed: out.results.length,
    remaining,
  };
}

/**
 * Clears analysis flags + tags on every Review and AnonymousFeedback for the business.
 * Caller then runs analyzeBatchOnce in a loop to re-analyze everything.
 */
export async function resetAnalysis(businessId: string): Promise<void> {
  if (!businessId || typeof businessId !== "string") {
    throw new Error("[resetAnalysis] businessId is required.");
  }
  await Promise.all([
    prisma.review.updateMany({
      where: { businessId },
      data: { analyzedAt: null, tags: [], negativeTags: [], unmappedInsights: [] },
    }),
    prisma.anonymousFeedback.updateMany({
      where: { businessId },
      data: { analyzedAt: null, tags: [], negativeTags: [], unmappedInsights: [] },
    }),
  ]);
}
