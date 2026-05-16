// ── Review Form ────────────────────────────────────────────

export interface ReviewFormData {
  rating: number;
  whatDidYouEnjoy?: string;
  howWasService?: string;
  additionalComments?: string;
  photos?: string[]; // base64 or presigned URLs
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
