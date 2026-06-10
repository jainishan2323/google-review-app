import { prisma } from "@repo/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentBusiness } from "@/lib/current-business";

export const dynamic = "force-dynamic";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MessageSquare } from "lucide-react";

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="text-sm tracking-tight" aria-label={`${rating} out of 5 stars`}>
      <span className="text-yellow-400">{"★".repeat(rating)}</span>
      <span className="text-muted-foreground">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default async function FeedbackPage() {
  const business = await requireCurrentBusiness();
  const feedbackList = await prisma.anonymousFeedback.findMany({
    where: { businessId: business.id, source: "private" },
    orderBy: { createdAt: "desc" },
  });

  const unreadCount = feedbackList.filter((f) => f.status === "unread").length;

  return (
    <main className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Private Feedback Inbox
          </h1>
          <p className="text-sm mt-1 text-muted-foreground">
            Feedback submitted privately via your QR form — not posted to Google.
          </p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="destructive" className="gap-1.5 text-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-white/80 inline-block" />
            {unreadCount} new
          </Badge>
        )}
      </div>

      <Separator />

      {feedbackList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <MessageSquare className="h-10 w-10 text-muted-foreground opacity-40" />
          <p className="text-muted-foreground text-sm">No feedback yet.</p>
          <p className="text-muted-foreground text-xs">
            Feedback submitted via your review form will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {feedbackList.map((item) => (
            <Card key={item.id} className="relative flex flex-col">
              <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
                <div className="space-y-1">
                  <StarDisplay rating={item.rating} />
                  <CardTitle className="text-xs font-normal text-muted-foreground">
                    {item.createdAt.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {item.status === "unread" && (
                    <Badge variant="destructive" className="text-[10px]">New</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 flex-1 flex flex-col">
                {item.generatedReview ? (
                  <p className="text-sm text-foreground leading-relaxed">{item.generatedReview}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No generated review.</p>
                )}
                {item.text && (
                  <div className="border-l-2 border-muted pl-2">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">Customer note</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
                  </div>
                )}
                {(item.tags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
                    {(item.tags ?? []).map((tag) => {
                      const isNeg = (item.negativeTags ?? []).includes(tag);
                      return (
                        <span
                          key={tag}
                          className={`inline-flex items-center rounded-md border-l-2 bg-muted px-2 py-0.5 text-[11px] text-muted-foreground ${
                            isNeg ? "border-l-red-500" : "border-l-green-500"
                          }`}
                        >
                          {tag}
                        </span>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
