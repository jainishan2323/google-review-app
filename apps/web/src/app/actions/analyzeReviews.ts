"use server";

import { prisma } from "@repo/db";
import { analyzeBatch } from "@repo/llm";
import type { ReviewAnalysisInput, TaxonomyCategory, BatchAnalysisOutput, ReviewAnalysisResult } from "@repo/types";
import { revalidatePath } from "next/cache";

const BATCH_SIZE = 15;

/** Split an array into chunks of at most `size` items. */
function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/** Run analyzeBatch over potentially more than 15 inputs by chunking sequentially. */
async function analyzeInChunks(
  inputs: ReviewAnalysisInput[],
  taxonomy: TaxonomyCategory[]
): Promise<ReviewAnalysisResult[]> {
  const results: ReviewAnalysisResult[] = [];
  for (const batch of chunk(inputs, BATCH_SIZE)) {
    const out = await analyzeBatch(batch, taxonomy);
    results.push(...out.results);
  }
  return results;
}

/**
 * Fetches up to 50 un-analyzed Google Reviews and up to 50 un-analyzed
 * AnonymousFeedback records for the given business, runs them through
 * the batch LLM analyzer in chunks of 15, then persists the results (tags + analyzedAt).
 */
export async function analyzeReviews(businessId: string): Promise<{
  reviewsAnalyzed: number;
  feedbackAnalyzed: number;
}> {
  if (!businessId || typeof businessId !== "string") {
    throw new Error("[analyzeReviews] businessId is required.");
  }

  // Fetch taxonomy from DB
  const formConfig = await prisma.formConfig.findUnique({
    where: { businessId },
    include: { categories: { orderBy: { order: "asc" } } },
  });

  const taxonomy: TaxonomyCategory[] =
    formConfig?.categories.map((cat) => ({
      name: cat.name,
      positiveTags: cat.positiveChips,
      negativeTags: cat.negativeChips,
    })) ?? [];

  if (taxonomy.length === 0) {
    return { reviewsAnalyzed: 0, feedbackAnalyzed: 0 };
  }

  // Fetch up to 50 un-analyzed Google Reviews with text
  const rawReviews = await prisma.review.findMany({
    where: { businessId, analyzedAt: null, text: { not: null } },
    select: { id: true, text: true, rating: true },
    take: 50,
    orderBy: { publishedAt: "asc" },
  });

  // Fetch up to 50 un-analyzed AnonymousFeedback with text
  const rawFeedback = await prisma.anonymousFeedback.findMany({
    where: { businessId, analyzedAt: null, text: { not: null } },
    select: { id: true, text: true, rating: true },
    take: 50,
    orderBy: { createdAt: "asc" },
  });

  const reviewInputs: ReviewAnalysisInput[] = rawReviews.map((r) => ({
    id: r.id,
    text: r.text!,
    rating: r.rating,
  }));

  const feedbackInputs: ReviewAnalysisInput[] = rawFeedback.map((f) => ({
    id: f.id,
    text: f.text!,
    rating: f.rating,
  }));

  // Run both in chunks of 15, sequentially per source to avoid rate limits
  const [reviewResultsList, feedbackResultsList] = await Promise.all([
    reviewInputs.length > 0
      ? analyzeInChunks(reviewInputs, taxonomy)
      : Promise.resolve<ReviewAnalysisResult[]>([]),
    feedbackInputs.length > 0
      ? analyzeInChunks(feedbackInputs, taxonomy)
      : Promise.resolve<ReviewAnalysisResult[]>([]),
  ]);

  const now = new Date();

  // Persist Review results
  await Promise.all(
    reviewResultsList.map((r) =>
      prisma.review.update({
        where: { id: r.reviewId },
        data: {
          tags: r.mappedTags.map((t) => t.tag),
          unmappedInsights: r.unmappedInsights,
          analyzedAt: now,
        },
      })
    )
  );

  // Persist AnonymousFeedback results
  await Promise.all(
    feedbackResultsList.map((r) =>
      prisma.anonymousFeedback.update({
        where: { id: r.reviewId },
        data: {
          tags: r.mappedTags.map((t) => t.tag),
          unmappedInsights: r.unmappedInsights,
          analyzedAt: now,
        },
      })
    )
  );

  revalidatePath("/dashboard/analytics");

  return {
    reviewsAnalyzed: reviewResultsList.length,
    feedbackAnalyzed: feedbackResultsList.length,
  };
}
