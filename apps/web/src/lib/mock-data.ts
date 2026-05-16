import reviewData from "@/mock/review.json";

const STAR_MAP: Record<string, number> = {
  ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5,
};

export interface MockReview {
  reviewId: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: Date;
  isReplied: boolean;
  replyText?: string;
}

export function getMockReviews(): MockReview[] {
  return reviewData.reviews.map((r: any) => ({
    reviewId: r.reviewId,
    authorName: r.reviewer.displayName,
    rating: STAR_MAP[r.starRating] ?? 3,
    comment: r.comment ?? "",
    createdAt: new Date(r.createTime),
    isReplied: !!r.reviewReply,
    replyText: r.reviewReply?.comment,
  }));
}

export function getMockStats() {
  const reviews = getMockReviews();
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const pending = reviews.filter((r) => !r.isReplied).length;

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return {
    averageRating: avg,
    totalReviews: reviews.length,
    pendingReplies: pending,
    distribution,
  };
}
