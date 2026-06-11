// ── Taxonomy (multilingual tags) ─────────────────────────────

/** A tag/category's per-language display strings, e.g. { en: "Long Wait", de: "Lange Wartezeit" }. */
export type LabelMap = Record<string, string>;

export type Polarity = "positive" | "negative";

/** Inputs to the label fallback chain. */
export interface LabelResolveOptions {
  /** Preferred language (e.g. the form's render language). */
  active?: string;
  /** Business default language — second in the chain. */
  default: string;
  /** Language the tag was authored in — the anchor before "any available". */
  authored?: string;
}

/**
 * Resolve a label to a single string via the fallback chain:
 * active language → business default → authored language → any available label → "".
 * `labels` is the raw JSON map off a Tag/Category; tolerant of unknown shapes.
 */
export function resolveLabel(labels: unknown, opts: LabelResolveOptions): string {
  const map: LabelMap =
    labels && typeof labels === "object" ? (labels as LabelMap) : {};
  const pick = (lang?: string): string | undefined => {
    if (!lang) return undefined;
    const v = map[lang];
    return typeof v === "string" && v.length > 0 ? v : undefined;
  };
  return (
    pick(opts.active) ??
    pick(opts.default) ??
    pick(opts.authored) ??
    Object.values(map).find((v) => typeof v === "string" && v.length > 0) ??
    ""
  );
}

/** A tag as the form consumes it: identity + resolved label + polarity. */
export interface FormTag {
  id: string;
  label: string;
  polarity: Polarity;
}

// ── Review Form ────────────────────────────────────────────

export interface ReviewFormData {
  rating: number;
  whatDidYouEnjoy?: string;
  howWasService?: string;
  additionalComments?: string;
  photos?: string[]; // base64 or presigned URLs
}

/** Input shape for the chip-based AI review generator (form app). */
export interface ReviewGenerateInput {
  rating: number;
  /**
   * Tag labels resolved to the target language (e.g. ["Great Service", "Clean Environment"]).
   * The form submits identities; the generate route resolves them to labels before calling.
   */
  tags: string[];
  /** Optional free-text note from the customer, max 100 chars. */
  customText?: string;
  /** 0-indexed regeneration attempt; drives output variety and temperature ramp. */
  attempt?: number;
  /** ISO 639-1 language to write the review in (the business default language). */
  language?: string;
}

export interface GeneratedReview {
  text: string;
}

// ── Business ────────────────────────────────────────────────

export interface BusinessProfile {
  id: string;
  name: string;
  googleLocationId: string;
  googlePlaceId?: string;
  googleMapsReviewUrl?: string;
}

// ── Reviews ─────────────────────────────────────────────────

export interface GoogleReview {
  id: string;
  googleReviewId: string;
  authorName: string;
  authorPhoto?: string;
  rating: number;
  text?: string;
  publishedAt: Date;
  isReplied: boolean;
  replyText?: string;
  repliedAt?: Date;
}

// ── Sentiment ───────────────────────────────────────────────

export interface SentimentAnalysis {
  positiveThemes: string[];
  areasForImprovement: string[];
  overallSentiment: "positive" | "neutral" | "negative";
  summary: string;
}

// ── Alerts ──────────────────────────────────────────────────

export type AlertType = "NEW_REVIEW" | "RATING_DROP";

export interface ReviewAlert {
  businessId: string;
  reviewId: string;
  authorName: string;
  rating: number;
  text?: string;
}

// ── Anonymous Feedback ──────────────────────────────────────

export interface AnonymousFeedbackEntry {
  id: string;
  businessId: string;
  rating: number;
  text?: string;
  photos: string[];
  createdAt: Date;
}

// ── Batch Review Analyzer ────────────────────────────────────

/** A single review/feedback record fed into the batch analyzer. */
export interface ReviewAnalysisInput {
  id: string;
  text: string;
  rating: number;
}

/** One category from the business's taxonomy dictionary. */
export interface TaxonomyCategory {
  name: string;
  positiveTags: string[];
  negativeTags: string[];
}

/** A single tag mapped from a review to the business taxonomy. */
export interface MappedTag {
  category: string;
  tag: string;
  sentiment: "positive" | "negative";
}

/** Analysis result for a single review. */
export interface ReviewAnalysisResult {
  reviewId: string;
  mappedTags: MappedTag[];
  /** Short (≤3 word) insights that didn't match any taxonomy tag. */
  unmappedInsights: string[];
}

/** Output shape returned by analyzeBatch(). */
export interface BatchAnalysisOutput {
  results: ReviewAnalysisResult[];
}
