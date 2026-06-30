"use server";

import { prisma } from "@repo/db";
import { analyzeBatch } from "@repo/llm";
import { resolveLabel, type ReviewAnalysisInput, type TaxonomyCategory } from "@repo/types";
import { revalidatePath } from "next/cache";

const BATCH_SIZE = 15;

/**
 * Processes ONE batch of up to 15 records (mixing reviews + feedback) for the
 * business. Returns the number processed and the number remaining.
 *
 * Normally only un-analyzed records (`analyzedAt IS NULL`) are eligible. For a
 * re-analyze, pass `reanalyzeSince` (the run's start time): records analyzed
 * before that cutoff also become eligible and are overwritten in place. Each
 * processed record's `analyzedAt` is set to now (≥ cutoff), so it drops out of
 * the next batch — the loop is self-terminating and resumable, and a record
 * keeps its previous analysis until its fresh result lands (no up-front wipe).
 */
export async function analyzeBatchOnce(
  businessId: string,
  reanalyzeSince?: Date,
): Promise<{
  processed: number;
  remaining: number;
}> {
  if (!businessId || typeof businessId !== "string") {
    throw new Error("[analyzeBatchOnce] businessId is required.");
  }

  // Records eligible for this run: never analyzed, plus (on a re-analyze) any
  // analyzed before the run started.
  const pendingWhere = reanalyzeSince
    ? {
        businessId,
        text: { not: null },
        OR: [{ analyzedAt: null }, { analyzedAt: { lt: reanalyzeSince } }],
      }
    : { businessId, analyzedAt: null, text: { not: null } };

  // google_redirect rows represent intent to post, not confirmed posts — exclude
  // them from analysis so analytics only covers private feedback and Google reviews.
  const feedbackPendingWhere = { ...pendingWhere, source: "private" as const };

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

  // Pull up to BATCH_SIZE eligible records — reviews first, then feedback
  const reviews = await prisma.review.findMany({
    where: pendingWhere,
    select: { id: true, text: true, rating: true },
    take: BATCH_SIZE,
    orderBy: { publishedAt: "asc" },
  });

  const feedbackTake = BATCH_SIZE - reviews.length;
  const feedback =
    feedbackTake > 0
      ? await prisma.anonymousFeedback.findMany({
          where: feedbackPendingWhere,
          select: { id: true, text: true, rating: true },
          take: feedbackTake,
          orderBy: { createdAt: "asc" },
        })
      : [];

  if (reviews.length + feedback.length === 0) {
    return { processed: 0, remaining: 0 };
  }

  const reviewIds = new Set(reviews.map((r) => r.id));
  const feedbackIds = new Set(feedback.map((f) => f.id));
  const inputs: ReviewAnalysisInput[] = [
    ...reviews.map((r) => ({ id: r.id, text: r.text!, rating: r.rating })),
    ...feedback.map((f) => ({ id: f.id, text: f.text!, rating: f.rating })),
  ];

  const out = await analyzeBatch(inputs, taxonomy);
  const now = new Date();

  // The analyzer echoes each input id back as `reviewId`, but an LLM can mangle a
  // long cuid. Route each result to its table by *explicit membership* and DROP
  // ids that match neither — a blind `update` on an unknown id throws
  // "Record to update not found" and fails the whole batch.
  const updates = out.results.flatMap((r) => {
    const table = reviewIds.has(r.reviewId)
      ? "review"
      : feedbackIds.has(r.reviewId)
      ? "feedback"
      : null;
    if (!table) return [];

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
    return [
      table === "review"
        ? prisma.review.update({ where: { id: r.reviewId }, data })
        : prisma.anonymousFeedback.update({ where: { id: r.reviewId }, data }),
    ];
  });

  await Promise.all(updates);

  const [remainingReviews, remainingFeedback] = await Promise.all([
    prisma.review.count({ where: pendingWhere }),
    prisma.anonymousFeedback.count({ where: feedbackPendingWhere }),
  ]);

  const remaining = remainingReviews + remainingFeedback;
  if (remaining === 0) {
    revalidatePath("/dashboard/analytics");
  }

  return {
    // Count records actually persisted (not raw LLM results) so a batch whose ids
    // all failed to match reports 0 and the caller's stall guard halts the loop.
    processed: updates.length,
    remaining,
  };
}
