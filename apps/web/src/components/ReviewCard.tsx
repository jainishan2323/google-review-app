"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Copy, Check, Loader2, RefreshCw, Send } from "lucide-react";

interface ReviewCardProps {
  id: string;
  authorName: string;
  authorPhoto?: string | null;
  rating: number;
  text: string | null;
  publishedAt: string;
  isReplied: boolean;
  replyText?: string | null;
  // Display labels, already resolved by the caller. Review.tags / negativeTags store tag
  // IDENTITIES (see ADR-0005); the page that renders this must resolve id→label first.
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
  id,
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
  const [draft, setDraft] = useState<string | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [copied, setCopied] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [replied, setReplied] = useState(isReplied);

  const negSet = new Set(negativeTags);
  const chars = text ? [...text] : [];
  const isLong = chars.length > COLLAPSE_THRESHOLD;
  const displayText = isLong && !expanded ? chars.slice(0, COLLAPSE_THRESHOLD).join("").trimEnd() + "…" : text;

  async function handleDraftReply() {
    setLoadingDraft(true);
    try {
      const res = await fetch("/api/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: id }),
      });
      const data = await res.json();
      if (data.draft) setDraft(data.draft);
    } finally {
      setLoadingDraft(false);
    }
  }

  async function handlePostReply() {
    if (!draft) return;
    setPosting(true);
    setPostError(null);
    try {
      const res = await fetch(`/api/reviews/${id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyText: draft }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setPostError(data.error ?? "Failed to post reply.");
      } else {
        setReplied(true);
        setDraft(null);
      }
    } catch {
      setPostError("Network error — please try again.");
    } finally {
      setPosting(false);
    }
  }

  async function handleCopy() {
    if (!draft) return;
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3 py-5 border-b border-border last:border-b-0">
      {/* Top row: author + meta + badge */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-foreground">{authorName}</p>
          <div className="flex items-center gap-2">
            <StarDisplay rating={rating} />
            <span className="text-xs text-muted-foreground">{publishedAt}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant={replied ? "secondary" : "destructive"}
            className="text-[10px]"
          >
            {replied ? "Replied" : "Pending"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={handleDraftReply}
            disabled={loadingDraft || !text}
            title={!text ? "No review text to reply to" : undefined}
          >
            {loadingDraft ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : draft ? (
              <RefreshCw className="h-3.5 w-3.5" />
            ) : (
              <MessageSquare className="h-3.5 w-3.5" />
            )}
            {draft ? "Regenerate" : "Draft Reply"}
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

      {/* Draft reply */}
      {draft && (
        <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Draft reply</p>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="text-sm bg-background"
            rows={4}
          />
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={handleDraftReply}
              disabled={loadingDraft}
            >
              {loadingDraft ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              {loadingDraft ? "Regenerating…" : "Regenerate"}
            </Button>
            <Button
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={handlePostReply}
              disabled={posting}
            >
              {posting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              {posting ? "Posting…" : "Post to Google"}
            </Button>
          </div>
          {postError && (
            <p className="text-xs text-destructive">{postError}</p>
          )}
        </div>
      )}
    </div>
  );
}
