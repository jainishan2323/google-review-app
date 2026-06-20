"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface MonthFeedbackItem {
  id: string;
  rating: number;
  text: string | null;
  source: string;
  date: string;
  authorName: string | null;
  negative: boolean; // rating < 4
}

type Filter = "all" | "negative" | "positive";

interface MonthReviewsSheetProps {
  /** Month key `YYYY-MM` queried from the API; null when closed. */
  monthKey: string | null;
  monthLabel: string;
  positive: number;
  negative: number;
  businessId: string;
  open: boolean;
  onClose: () => void;
}

function StarRow({ rating }: { rating: number }) {
  const colorCls = rating >= 4 ? "text-green-500" : "text-red-400";
  return (
    <span className="text-sm tracking-tight">
      <span className={colorCls}>{"★".repeat(rating)}</span>
      <span className="text-muted-foreground/40">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

function sourceLabel(source: string): string {
  if (source === "google" || source === "google_redirect") return "Google";
  return "private form";
}

export function MonthReviewsSheet({
  monthKey,
  monthLabel,
  positive,
  negative,
  businessId,
  open,
  onClose,
}: MonthReviewsSheetProps) {
  const [items, setItems] = useState<MonthFeedbackItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    if (!open || !monthKey) return;

    let cancelled = false;
    setLoading(true);
    setItems([]);
    setFilter("all");

    fetch(`/api/feedback-by-month?month=${encodeURIComponent(monthKey)}&businessId=${encodeURIComponent(businessId)}`)
      .then((r) => r.json())
      .then((data: MonthFeedbackItem[]) => {
        if (!cancelled) setItems(data);
      })
      .catch(() => {
        // silent — empty list shown
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, monthKey, businessId]);

  const visible =
    filter === "all" ? items : items.filter((i) => (filter === "negative" ? i.negative : !i.negative));

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-full gap-0 overflow-y-auto border-l-2 border-l-primary/50 sm:max-w-md">
        <SheetHeader className="gap-1">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Review volume
          </span>
          <SheetTitle className="text-2xl font-bold">{monthLabel}</SheetTitle>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="text-red-400">
              Negative <span className="font-semibold">{negative}</span>
            </span>
            <span className="text-green-500">
              Positive <span className="font-semibold">{positive}</span>
            </span>
          </div>
        </SheetHeader>

        <div className="flex gap-2 px-4 pb-4">
          {(["all", "negative", "positive"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "cursor-pointer rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors",
                filter === f
                  ? "bg-foreground text-background"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted",
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="px-4 pb-4">
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse rounded-lg border bg-muted/30 p-4 space-y-2">
                  <div className="h-3 bg-muted rounded w-24" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </div>
              ))}
            </div>
          )}

          {!loading && visible.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No {filter !== "all" ? `${filter} ` : ""}reviews this month.
            </p>
          )}

          {!loading && visible.length > 0 && (
            <div className="space-y-3">
              {visible.map((item) => {
                const date = new Date(item.date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                });
                return (
                  <div key={item.id} className="rounded-lg border bg-card p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <StarRow rating={item.rating} />
                        {item.authorName && (
                          <span className="max-w-[120px] truncate text-xs font-medium text-foreground">
                            {item.authorName}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{date}</span>
                    </div>
                    {item.text ? (
                      <p className="text-sm leading-relaxed text-foreground">“{item.text}”</p>
                    ) : (
                      <p className="text-xs italic text-muted-foreground">No review text.</p>
                    )}
                    <p className="text-xs text-muted-foreground">via {sourceLabel(item.source)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
