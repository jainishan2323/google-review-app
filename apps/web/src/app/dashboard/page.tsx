import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getMockReviews, getMockStats } from "@/lib/mock-data";
import { prisma } from "@repo/db";
import { Star, MessageSquare, Clock, TrendingUp } from "lucide-react";
import { ReviewCTA } from "@/components/ReviewCTA";

export const dynamic = "force-dynamic";

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="text-xs tracking-tight">
      <span className="text-yellow-400">{"★".repeat(rating)}</span>
      <span className="text-muted-foreground">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

function RatingBar({ star, count, max }: { star: number; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-4 text-right text-muted-foreground">{star}</span>
      <span className="text-yellow-400 text-[10px]">★</span>
      <div className="flex-1 rounded-full h-1.5 bg-muted">
        <div
          className="h-1.5 rounded-full bg-primary"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-4 text-muted-foreground">{count}</span>
    </div>
  );
}

export default async function DashboardPage() {
  const stats = getMockStats();
  const reviews = getMockReviews();
  const recent = reviews.slice(0, 8);
  const maxCount = Math.max(...stats.distribution.map((d) => d.count));

  const [feedbackList, totalFeedback, unreadCount] = await Promise.all([
    prisma.anonymousFeedback.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.anonymousFeedback.count(),
    prisma.anonymousFeedback.count({ where: { status: "unread" } }),
  ]);

  return (
    <main className="p-8 space-y-8">
      {/* Gamified CTA */}
      <ReviewCTA unreadCount={unreadCount} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Overview
          </h1>
          <p className="text-sm mt-1 text-muted-foreground">
            Spice Garden Berlin — Kreuzberg
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
          Live
        </Badge>
      </div>

      <Separator />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Rating
            </CardTitle>
            <Star className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{stats.averageRating.toFixed(1)}</p>
            <p className="text-xs mt-1 text-muted-foreground">out of 5.0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Reviews
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{stats.totalReviews}</p>
            <p className="text-xs mt-1 text-muted-foreground">on Google</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Replies
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{stats.pendingReplies}</p>
            <p className="text-xs mt-1 text-muted-foreground">awaiting response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Private Feedback
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{totalFeedback}</p>
            <p className="text-xs mt-1 text-muted-foreground">responses collected</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Rating distribution */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">Rating Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {stats.distribution.map(({ star, count }) => (
              <RatingBar key={star} star={star} count={count} max={maxCount} />
            ))}
          </CardContent>
        </Card>

        {/* Recent reviews */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">Recent Reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recent.map((review) => (
              <div key={review.reviewId}>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">
                        {review.authorName}
                      </span>
                      <StarDisplay rating={review.rating} />
                      <span className="text-xs text-muted-foreground">
                        {review.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    <p className="text-sm line-clamp-2 text-muted-foreground">
                      {review.comment}
                    </p>
                  </div>
                  <Badge variant={review.isReplied ? "secondary" : "destructive"} className="shrink-0 text-xs">
                    {review.isReplied ? "Replied" : "Pending"}
                  </Badge>
                </div>
                <Separator className="mt-3" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent private feedback */}
      {feedbackList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">Recent Private Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {feedbackList.map((item) => (
              <div key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs tracking-tight">
                        <span className="text-yellow-400">{"★".repeat(item.rating)}</span>
                        <span className="text-muted-foreground">{"★".repeat(5 - item.rating)}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    {item.text && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.text}</p>
                    )}
                  </div>
                  {item.status === "unread" && (
                    <Badge variant="destructive" className="shrink-0 text-xs">New</Badge>
                  )}
                </div>
                <Separator className="mt-3" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
