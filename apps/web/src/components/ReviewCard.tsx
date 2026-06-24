"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { LocalDateTime } from "@/components/LocalDateTime";
import { DraftReplyModal } from "@/components/DraftReplyModal";
import { GoogleLogo } from "@/components/GoogleLogo";

interface ReviewCardProps {
  id: string;
  authorName: string;
  authorPhoto?: string | null;
  rating: number;
  text: string | null;
  publishedAtIso: string;
  isReplied: boolean;
  replyText?: string | null;
  repliedAtIso?: string | null;
  // Display labels, already resolved by the caller. Review.tags / negativeTags store tag
  // IDENTITIES (see ADR-0005); the page that renders this must resolve id→label first.
  tags: string[];
  negativeTags: string[];
  unmappedInsights: string[];
  businessName: string;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="text-sm tracking-tight" aria-label={`${rating} out of 5 stars`}>
      <span className="text-yellow-400">{"★".repeat(rating)}</span>
      <span className="text-muted-foreground/40">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

const COLLAPSE_THRESHOLD = 280;

export function ReviewCard({
  id,
  authorName,
  rating,
  text,
  publishedAtIso,
  isReplied,
  replyText,
  repliedAtIso,
  tags,
  negativeTags,
  unmappedInsights,
  businessName,
}: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const negSet = new Set(negativeTags);
  const chars = text ? [...text] : [];
  const isLong = chars.length > COLLAPSE_THRESHOLD;
  const displayText =
    isLong && !expanded
      ? chars.slice(0, COLLAPSE_THRESHOLD).join("").trimEnd() + "…"
      : text;

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      {/* Top row: author + meta + badge */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{authorName}</p>
            <GoogleLogo className="h-3.5 w-3.5" />
          </div>
          <div className="flex items-center gap-2">
            <StarDisplay rating={rating} />
            <LocalDateTime
              iso={publishedAtIso}
              className="text-xs text-muted-foreground"
            />
          </div>
        </div>
        <Badge
          variant={isReplied ? "secondary" : "destructive"}
          className={isReplied ? "" : "text-amber-500 bg-amber-500/10"}
        >
          {isReplied ? "Replied" : "Awaiting reply"}
        </Badge>
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

      {/* Existing reply (replied reviews) */}
      {isReplied && replyText ? (
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Your reply
            </p>
            {repliedAtIso && (
              <LocalDateTime
                iso={repliedAtIso}
                withTime
                className="text-[11px] text-muted-foreground"
              />
            )}
          </div>
          <p className="text-sm text-foreground leading-relaxed">{replyText}</p>
        </div>
      ) : (
        text && (
          <div>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => setModalOpen(true)}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Draft reply with AI
            </Button>
          </div>
        )
      )}

      <DraftReplyModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        review={{ id, authorName, rating, text, publishedAtIso }}
        businessName={businessName}
      />
    </div>
  );
}
