"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { VenetianMask } from "lucide-react";
import { GoogleLogo } from "@/components/GoogleLogo";
import { cn } from "@/lib/utils";

interface FeedbackItem {
  id: string;
  rating: number;
  text: string | null;
  source: string;
  date: string;
  authorName: string | null;
  /** Whether THIS tag was negative for this mention (per-tag sentiment). Absent for insights. */
  negative?: boolean;
}

type Filter = "all" | "negative" | "positive";

interface TagDrillDownSheetProps {
  /** The query value sent to the API: a tag IDENTITY for zones, or an insight text for insights. */
  tag: string | null;
  /** Human-readable text shown in the title (defaults to `tag` when omitted). */
  displayLabel?: string | null;
  businessId: string;
  open: boolean;
  onClose: () => void;
  apiPath?: string;
  /** Rich-header extras — present for the zone drill-down, absent for insights. */
  zone?: string;
  positive?: number;
  negative?: number;
  delta?: number;
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

export function TagDrillDownSheet({
  tag,
  displayLabel,
  businessId,
  open,
  onClose,
  apiPath = "/api/feedback-by-tag",
  zone,
  positive,
  negative,
  delta,
}: TagDrillDownSheetProps) {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  // Rich header + filter only when the caller supplies polarity context (zones).
  const rich = zone !== undefined && positive !== undefined && negative !== undefined;

  useEffect(() => {
    if (!open || !tag) return;

    let cancelled = false;
    setLoading(true);
    setItems([]);
    setFilter("all");

    fetch(`${apiPath}?tag=${encodeURIComponent(tag)}&businessId=${encodeURIComponent(businessId)}`)
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
  }, [open, tag, businessId, apiPath]);

  const visible =
    rich && filter !== "all"
      ? items.filter((i) => (filter === "negative" ? i.negative : !i.negative))
      : items;

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-full gap-0 sm:max-w-md overflow-y-auto">
        <SheetHeader className="gap-1">
          {rich && zone && (
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {zone}
            </span>
          )}
          <SheetTitle className={rich ? "text-2xl font-bold" : "text-base"}>
            {rich ? (
              displayLabel ?? tag
            ) : (
              <>
                Reviews mentioning{" "}
                <span className="font-semibold text-foreground">"{displayLabel ?? tag}"</span>
              </>
            )}
          </SheetTitle>

          {rich && (
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="text-red-400">
                Negative <span className="font-semibold">{negative}</span>
              </span>
              <span className="text-green-500">
                Positive <span className="font-semibold">{positive}</span>
              </span>
              {delta !== undefined && delta !== 0 && (
                <span className="text-muted-foreground">
                  Trend{" "}
                  <span className={cn("font-semibold", delta > 0 ? "text-red-400" : "text-green-500")}>
                    {delta > 0 ? "↑" : "↓"}
                    {Math.abs(delta)}%
                  </span>
                </span>
              )}
            </div>
          )}
        </SheetHeader>

        {rich && (
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
        )}

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
              No {filter !== "all" ? `${filter} ` : ""}feedback found for this tag.
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
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {item.source === "google" || item.source === "google_redirect"
                        ? <GoogleLogo className="h-3 w-3 shrink-0" />
                        : <VenetianMask className="h-3 w-3 shrink-0" />}
                      <span>via {sourceLabel(item.source)}</span>
                    </div>
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
