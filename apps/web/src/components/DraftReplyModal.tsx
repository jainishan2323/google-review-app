"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, RefreshCw, Send, Loader2, Info, Pencil } from "lucide-react";
import { LocalDateTime } from "@/components/LocalDateTime";
import { REVIEW_REPLY_POSTING_ENABLED } from "@/lib/flags";

function ThinkingDots() {
  const [dots, setDots] = useState(1);
  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d % 3) + 1), 500);
    return () => clearInterval(id);
  }, []);
  return <span className="inline-block w-5 text-left">{".".repeat(dots)}</span>;
}

interface DraftReplyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: {
    id: string;
    authorName: string;
    rating: number;
    text: string | null;
    publishedAtIso: string;
  };
  // TODO: replace with the connected Google Business account name once we store it
  // (we only persist business.name today). See google-business connect flow.
  businessName: string;
  onPosted?: () => void;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="tracking-tight" aria-label={`${rating} out of 5 stars`}>
      <span className="text-yellow-400">{"★".repeat(rating)}</span>
      <span className="text-muted-foreground/40">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export function DraftReplyModal({
  open,
  onOpenChange,
  review,
  businessName,
  onPosted,
}: DraftReplyModalProps) {
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function runTypewriter(text: string) {
    if (animationRef.current) clearTimeout(animationRef.current);
    setIsAnimating(true);
    setDraft("");
    let i = 0;
    function step() {
      i++;
      setDraft(text.slice(0, i));
      if (i < text.length) {
        animationRef.current = setTimeout(step, 14);
      } else {
        setIsAnimating(false);
      }
    }
    animationRef.current = setTimeout(step, 14);
  }

  async function generate() {
    if (animationRef.current) clearTimeout(animationRef.current);
    setIsAnimating(false);
    setLoading(true);
    setError(null);
    setDraft("");
    try {
      const res = await fetch("/api/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: review.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.draft) runTypewriter(data.draft);
      else setError(data.error ?? "Couldn't draft a reply. Try again.");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Auto-generate once each time the modal opens.
  useEffect(() => {
    if (open) {
      if (animationRef.current) clearTimeout(animationRef.current);
      setDraft("");
      setIsAnimating(false);
      setError(null);
      setPostError(null);
      generate();
    }
    return () => {
      if (animationRef.current) clearTimeout(animationRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handlePost() {
    if (!REVIEW_REPLY_POSTING_ENABLED || !draft.trim()) return;
    setPosting(true);
    setPostError(null);
    try {
      const res = await fetch(`/api/reviews/${review.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyText: draft }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setPostError(data.error ?? "Failed to post reply.");
      } else {
        onOpenChange(false);
        onPosted?.();
      }
    } catch {
      setPostError("Network error — please try again.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <DialogTitle>Draft reply with AI</DialogTitle>
              <DialogDescription>Replying publicly as {businessName}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Review being replied to */}
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-foreground">{review.authorName}</span>
            <Stars rating={review.rating} />
            <span className="text-muted-foreground">·</span>
            <LocalDateTime
              iso={review.publishedAtIso}
              className="text-muted-foreground"
            />
            <span className="text-muted-foreground">· Google</span>
          </div>
          {review.text ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{review.text}</p>
          ) : (
            <p className="text-sm italic text-muted-foreground">No written review.</p>
          )}
        </div>

        {/* TODO: reply-tone selector (Warm / Professional / Apologetic / Short) deferred. */}

        {/* AI draft */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">AI draft</p>
          <div className="relative">
            {loading ? (
              <div className="flex min-h-[7.5rem] items-center gap-2.5 rounded-md border border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 shrink-0 animate-pulse text-primary" />
                <span>Jugnoo AI is thinking</span>
                <ThinkingDots />
              </div>
            ) : (
              <>
                <Textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => {
                    if (animationRef.current) clearTimeout(animationRef.current);
                    setIsAnimating(false);
                    setDraft(e.target.value);
                  }}
                  rows={5}
                  className="resize-y pr-9"
                />
                {draft && (
                  <button
                    type="button"
                    onClick={() => textareaRef.current?.focus()}
                    className="absolute right-2 top-2 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    title="Edit reply"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {draft.length > 0 ? `${draft.length} characters` : ""}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={generate}
              disabled={loading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Regenerate
            </Button>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter className="items-center sm:justify-between">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5" />
            {REVIEW_REPLY_POSTING_ENABLED
              ? "Review before posting — it publishes to Google"
              : "Posting to Google is temporarily disabled"}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="gap-1.5"
              onClick={handlePost}
              disabled={!REVIEW_REPLY_POSTING_ENABLED || posting || loading || !draft.trim()}
              title={
                REVIEW_REPLY_POSTING_ENABLED
                  ? undefined
                  : "Posting is temporarily disabled"
              }
            >
              {posting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Post to Google
            </Button>
          </div>
        </DialogFooter>
        {postError && (
          <p className="text-right text-xs text-destructive">{postError}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
