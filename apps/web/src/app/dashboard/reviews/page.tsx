import { prisma } from "@repo/db";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star } from "lucide-react";
import { ReviewsControls } from "@/components/ReviewsControls";
import { ReviewCard } from "@/components/ReviewCard";

export const dynamic = "force-dynamic";

const DEV_BUSINESS_ID = process.env.DEV_BUSINESS_ID ?? "cmpabfbxs001np8qjvk5l6s14";

type Range = "7d" | "30d" | "90d" | "ytd" | "all";
type RatingFilter = "all" | "5" | "4" | "3" | "lte2";

function getDateSince(range: Range): Date | null {
  if (range === "all") return null;
  const now = new Date();
  switch (range) {
    case "7d":  { const d = new Date(now); d.setDate(d.getDate() - 7);   return d; }
    case "30d": { const d = new Date(now); d.setDate(d.getDate() - 30);  return d; }
    case "90d": { const d = new Date(now); d.setDate(d.getDate() - 90);  return d; }
    case "ytd": return new Date(now.getFullYear(), 0, 1);
  }
}

function getRatingFilter(rating: RatingFilter): { gte?: number; lte?: number } | number | undefined {
  switch (rating) {
    case "5":    return 5;
    case "4":    return 4;
    case "3":    return 3;
    case "lte2": return { lte: 2 };
    default:     return undefined;
  }
}


interface PageProps {
  searchParams: Promise<{ range?: string; rating?: string }>;
}

export default async function ReviewsPage({ searchParams }: PageProps) {
  const { range: rawRange, rating: rawRating } = await searchParams;

  const range: Range =
    rawRange === "7d" || rawRange === "30d" || rawRange === "90d" || rawRange === "ytd" || rawRange === "all"
      ? rawRange
      : "all";

  const ratingFilter: RatingFilter =
    rawRating === "5" || rawRating === "4" || rawRating === "3" || rawRating === "lte2"
      ? rawRating
      : "all";

  const since = getDateSince(range);
  const ratingWhere = getRatingFilter(ratingFilter);

  const [reviews, business] = await Promise.all([
    prisma.review.findMany({
      where: {
        businessId: DEV_BUSINESS_ID,
        ...(since ? { publishedAt: { gte: since } } : {}),
        ...(ratingWhere !== undefined
          ? { rating: typeof ratingWhere === "number" ? ratingWhere : ratingWhere }
          : {}),
      },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.business.findUnique({
      where: { id: DEV_BUSINESS_ID },
      select: { name: true },
    }),
  ]);

  const pendingCount = reviews.filter((r) => !r.isReplied).length;

  const RANGE_LABELS: Record<Range, string> = {
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    "90d": "Last 90 days",
    ytd: "Year to date",
    all: "All time",
  };

  return (
    <main className="p-8 space-y-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Google Reviews</h1>
          <p className="text-sm mt-1 text-muted-foreground">
            {RANGE_LABELS[range]} · {business?.name} · {reviews.length} review{reviews.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {pendingCount > 0 && (
            <Badge variant="destructive" className="gap-1.5 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white/80 inline-block" />
              {pendingCount} pending
            </Badge>
          )}
          <ReviewsControls currentRange={range} currentRating={ratingFilter} />
        </div>
      </div>

      <Separator />

      {reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <Star className="h-10 w-10 text-muted-foreground opacity-40" />
          <p className="text-muted-foreground text-sm">No Google reviews synced yet.</p>
        </div>
      ) : (
        <div className="max-w-3xl">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              id={review.id}
              authorName={review.authorName}
              authorPhoto={review.authorPhoto}
              rating={review.rating}
              text={review.text}
              publishedAt={review.publishedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              isReplied={review.isReplied}
              replyText={review.replyText}
              tags={review.tags}
              negativeTags={review.negativeTags}
              unmappedInsights={review.unmappedInsights}
            />
          ))}
        </div>
      )}
    </main>
  );
}
