import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@repo/db";
import { Star, MessageSquare, Inbox, ArrowUpRight } from "lucide-react";
import { requireCurrentBusiness } from "@/lib/current-business";

export const dynamic = "force-dynamic";

// Phase 1 Overview is private-feedback-first: it surfaces the metrics that
// actually have data during the pilot (the form → AnonymousFeedback funnel).
// Google-review stats (average rating, total reviews, pending replies) are
// deferred to Phase 2 along with the Reviews/Analytics tabs.
// See docs/adr/0003-google-signin-split-identity-then-authorization.md

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
  const business = await requireCurrentBusiness();

  const [feedbackList, allFeedback, unreadCount, googleRedirectCount] = await Promise.all([
    prisma.anonymousFeedback.findMany({
      where: { businessId: business.id, source: "private" },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.anonymousFeedback.findMany({
      where: { businessId: business.id },
      select: { rating: true },
    }),
    prisma.anonymousFeedback.count({ where: { businessId: business.id, status: "unread" } }),
    prisma.anonymousFeedback.count({ where: { businessId: business.id, source: "google_redirect" } }),
  ]);

  const totalFeedback = allFeedback.length;
  const avgRating = totalFeedback
    ? (allFeedback.reduce((sum, f) => sum + f.rating, 0) / totalFeedback).toFixed(1)
    : "—";
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: allFeedback.filter((f) => f.rating === star).length,
  }));
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Overview
          </h1>
          <p className="text-sm mt-1 text-muted-foreground">{business.name}</p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
          Live
        </Badge>
      </div>

      <Separator />

      {/* Stat cards — all from private feedback (AnonymousFeedback) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Rating
            </CardTitle>
            <Star className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{avgRating}</p>
            <p className="text-xs mt-1 text-muted-foreground">out of 5.0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Feedback Collected
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{totalFeedback}</p>
            <p className="text-xs mt-1 text-muted-foreground">responses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unread
            </CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{unreadCount}</p>
            <p className="text-xs mt-1 text-muted-foreground">awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sent to Google
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{googleRedirectCount}</p>
            <p className="text-xs mt-1 text-muted-foreground">happy customers redirected</p>
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
            {distribution.map(({ star, count }) => (
              <RatingBar key={star} star={star} count={count} max={maxCount} />
            ))}
          </CardContent>
        </Card>

        {/* Recent private feedback */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">Recent Private Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {feedbackList.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No feedback collected yet. Share your QR code to start gathering responses.
              </p>
            ) : (
              feedbackList.map((item) => (
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
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
