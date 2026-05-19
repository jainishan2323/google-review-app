"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

interface ReviewCardProps {
  id: string;
  authorName: string;
  authorPhoto?: string | null;
  rating: number;
  text: string | null;
  publishedAt: Date;
  isReplied: boolean;
  replyText?: string | null;
  tags: string[];
  negativeTags: string[];
  unmappedInsights: string[];
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="text-sm tracking-tight" aria-label={`${rating} out of 5 stars`}>
      <span className="text-yellow-400">{"★".repeat(rating)}</span>
      <span className="text-muted-foreground">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

const COLLAPSE_THRESHOLD = 280;

export function ReviewCard({
  authorName,
  rating,
  text,
  publishedAt,
  isReplied,
  tags,
  negativeTags,
  unmappedInsights,
}: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const negSet = new Set(negativeTags);
  const isLong = !!text && text.length > COLLAPSE_THRESHOLD;
  const displayText = isLong && !expanded ? text!.slice(0, COLLAPSE_THRESHOLD).trimEnd() + "…" : text;

  return (
    <div className="flex flex-col gap-3 py-5 border-b border-border last:border-b-0">
      {/* Top row: author + meta + badge */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-foreground">{authorName}</p>
          <div className="flex items-center gap-2">
            <StarDisplay rating={rating} />
            <span className="text-xs text-muted-foreground">
              {publishedAt.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant={isReplied ? "secondary" : "destructive"}
            className="text-[10px]"
          >
            {isReplied ? "Replied" : "Pending"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            disabled
            title="AI reply drafting coming soon"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Reply
          </Button>
        </div>
      </div>

      {/* Review text */}
      {text ? (
        <div className="space-y-1">
          <p className="text-sm text-foreground leading-relaxed">{displayText}</p>
          {isLong && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="text-xs text-primary hover:underline"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">No written review.</p>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => {
            const isNeg = negSet.has(tag);
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

      {/* Unmapped insights */}
      {unmappedInsights.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {unmappedInsights.map((insight) => (
            <span
              key={insight}
              className="inline-block rounded-md bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-[11px] text-amber-700 dark:text-amber-400"
              title="Novel insight outside your taxonomy"
            >
              ✦ {insight}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
