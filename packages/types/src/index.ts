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
  /** Chips selected by the customer (e.g. ["Great Service", "Clean Environment"]). */
  tags: string[];
  /** Optional free-text note from the customer, max 100 chars. */
  customText?: string;
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
