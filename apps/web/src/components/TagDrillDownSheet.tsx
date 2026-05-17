"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface FeedbackItem {
  id: string;
  rating: number;
  text: string | null;
  source: string;
  date: string;
  authorName: string | null;
}

interface TagDrillDownSheetProps {
  tag: string | null;
  businessId: string;
  open: boolean;
  onClose: () => void;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="text-xs tracking-tight">
      <span className="text-yellow-400">{"★".repeat(rating)}</span>
      <span className="text-muted-foreground">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export function TagDrillDownSheet({
  tag,
  businessId,
  open,
  onClose,
}: TagDrillDownSheetProps) {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !tag) return;

    let cancelled = false;
    setLoading(true);
    setItems([]);

    fetch(`/api/feedback-by-tag?tag=${encodeURIComponent(tag)}&businessId=${encodeURIComponent(businessId)}`)
      .then((r) => r.json())
      .then((data: FeedbackItem[]) => {
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
  }, [open, tag, businessId]);

  const reviewText = (item: FeedbackItem) => item.text ?? null;

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-base">
            Reviews mentioning{" "}
            <span className="font-semibold text-foreground">"{tag}"</span>
          </SheetTitle>
        </SheetHeader>

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

        {!loading && items.length === 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No feedback found for this tag.
          </p>
        )}

        {!loading && items.length > 0 && (
          <div className="space-y-3">
            {items.map((item) => {
              const text = reviewText(item);
              const date = new Date(item.date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });
              const sourceLabel =
                item.source === "google" ? "Google"
                : item.source === "google_redirect" ? "→ Google"
                : "Private";
              const sourceCls =
                item.source === "google" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                : item.source === "google_redirect" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                : "bg-muted text-muted-foreground";
              return (
                <div
                  key={item.id}
                  className="rounded-lg border bg-card p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <StarRow rating={item.rating} />
                      {item.authorName && (
                        <span className="text-xs font-medium text-foreground truncate max-w-[120px]">{item.authorName}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${sourceCls}`}>
                        {sourceLabel}
                      </span>
                      <span className="text-xs text-muted-foreground">{date}</span>
                    </div>
                  </div>
                  {text ? (
                    <p className="text-sm text-foreground leading-relaxed">{text}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No review text.</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
