import { getLLMClient } from "./client";
import type {
  ReviewAnalysisInput,
  TaxonomyCategory,
  BatchAnalysisOutput,
  ReviewAnalysisResult,
  MappedTag,
} from "@repo/types";

const SYSTEM_PROMPT = `You are an expert multilingual operational data router for local businesses. \
You will receive a 'Taxonomy Dictionary' and a batch of 'Reviews'.
REVIEWS MAY BE WRITTEN IN ANY LANGUAGE — German, French, Spanish, Italian, Turkish, Arabic, Hindi, Japanese, Chinese, Dutch, and all other world languages are fully understood. Comprehend each review in its original language without translating.
RULES:
1. Map all sentiments expressed in the review to the closest Categories and Tags in the dictionary. Set the 'sentiment' field per tag — "positive" if the customer is praising it, "negative" if complaining. Do NOT rely solely on the star rating; a 5-star review can still mention a negative tag (e.g. "food was great but the wait was long").
2. NEVER invent tag strings. Every entry in mappedTags must be an exact string from the dictionary.
3. For points that genuinely do not fit any dictionary tag, add a 2-3 word English summary to unmappedInsights. Skip trivial reviews (one-word texts like "Perfect", "Lecker", "👍") — set unmappedInsights to [] and mappedTags to [] if nothing meaningful can be extracted.
4. Only set unmappedInsights to ["unrecognized language"] if the text is completely unreadable garbage (random characters, heavy corruption). Never use this for any recognized world language including German. If you successfully mapped any tags, do NOT add "unrecognized language".
5. Respond ONLY with a valid JSON object matching the required schema. No prose, no markdown, no code fences.`;

function buildUserMessage(
  reviews: ReviewAnalysisInput[],
  taxonomy: TaxonomyCategory[]
): string {
  const dictLines = taxonomy.map((cat) => {
    const pos = cat.positiveTags.join(", ") || "none";
    const neg = cat.negativeTags.join(", ") || "none";
    return `  Category: "${cat.name}"\n    Positive tags: ${pos}\n    Negative tags: ${neg}`;
  });

  const reviewLines = reviews.map(
    (r, i) => `  [${i + 1}] id="${r.id}" rating=${r.rating}/5\n  "${r.text}"`
  );

  return (
    `TAXONOMY DICTIONARY:\n${dictLines.join("\n\n")}\n\n` +
    `REVIEWS TO ANALYZE:\n${reviewLines.join("\n\n")}\n\n` +
    `Required output schema:\n` +
    `{\n` +
    `  "results": [\n` +
    `    {\n` +
    `      "reviewId": "<exact id from input>",\n` +
    `      "mappedTags": [{ "category": "string", "tag": "string", "sentiment": "positive" | "negative" }],\n` +
    `      "unmappedInsights": ["2-3 word string", ...]\n` +
    `    }\n` +
    `  ]\n` +
    `}`
  );
}

function isValidResult(item: unknown): item is ReviewAnalysisResult {
  if (!item || typeof item !== "object") return false;
  const r = item as Record<string, unknown>;
  if (typeof r.reviewId !== "string") return false;
  if (!Array.isArray(r.mappedTags)) return false;
  if (!Array.isArray(r.unmappedInsights)) return false;
  for (const tag of r.mappedTags as unknown[]) {
    if (!tag || typeof tag !== "object") return false;
    const t = tag as Record<string, unknown>;
    if (typeof t.category !== "string") return false;
    if (typeof t.tag !== "string") return false;
    if (t.sentiment !== "positive" && t.sentiment !== "negative") return false;
  }
  return true;
}

/**
 * Batch-analyzes up to 30 reviews/feedback records against the business taxonomy.
 * Returns structured results keyed by the input review ID.
 * Does NOT write to the database — persistence is the caller's responsibility.
 */
export async function analyzeBatch(
  reviews: ReviewAnalysisInput[],
  taxonomy: TaxonomyCategory[]
): Promise<BatchAnalysisOutput> {
  if (reviews.length === 0) return { results: [] };
  if (reviews.length > 15) {
    throw new Error("[analyzeBatch] Maximum batch size is 15 reviews.");
  }
  if (taxonomy.length === 0) {
    throw new Error("[analyzeBatch] Taxonomy must have at least one category.");
  }

  const userMessage = buildUserMessage(reviews, taxonomy);

  const raw = await getLLMClient().complete(
    userMessage,
    {
      maxTokens: 4000,
      temperature: 0.1,
      json: true,
    },
    SYSTEM_PROMPT
  );

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`[analyzeBatch] LLM returned invalid JSON: ${raw.slice(0, 200)}`);
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !Array.isArray((parsed as Record<string, unknown>).results)
  ) {
    throw new Error("[analyzeBatch] LLM response missing 'results' array.");
  }

  const rawResults = (parsed as { results: unknown[] }).results;
  const validatedResults: ReviewAnalysisResult[] = [];

  for (const item of rawResults) {
    if (!isValidResult(item)) {
      // Skip malformed entries rather than crashing the whole batch
      console.warn("[analyzeBatch] Skipping malformed result entry:", JSON.stringify(item));
      continue;
    }
    // Enforce that mappedTags only contain exact tags from the taxonomy
    const allTags = new Set(
      taxonomy.flatMap((cat) => [...cat.positiveTags, ...cat.negativeTags])
    );
    const safeMappedTags: MappedTag[] = (item.mappedTags as MappedTag[]).filter((t) =>
      allTags.has(t.tag)
    );
    validatedResults.push({
      reviewId: item.reviewId,
      mappedTags: safeMappedTags,
      unmappedInsights: item.unmappedInsights.slice(0, 5),
    });
  }

  return { results: validatedResults };
}
