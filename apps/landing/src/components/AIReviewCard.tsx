"use client";

import { useState } from "react";
import { Zap, Star, MessageSquare, Check, RefreshCw, User, Building2, Lock, ExternalLink } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const REVIEW_DRAFTS = [
  "Had an amazing dinner here last week. The pasta was cooked to perfection and our server was incredibly attentive. Will definitely be coming back — highly recommend the tiramisu!",
  "Really good experience from start to finish. Everything came out hot, the staff were friendly and remembered our preferences. Fair prices for the quality. Will be back.",
  "Came here on a Tuesday evening and couldn't have asked for better. Food was fresh, service was attentive without being pushy, and the atmosphere was just right. Highly recommend.",
];

const REPLY_DRAFTS = [
  "Hi Maria, we're really sorry about your experience. Wait times and food temperature are both things we're actively working on. Your feedback goes straight to our team, and we hope you'll give us another chance.",
  "Hi Maria, thank you for your honest feedback. We're sorry the wait and food temperature fell short — this is not the standard we hold ourselves to. Please reach out directly so we can make it right.",
  "Thank you for sharing this, Maria. A long wait and cold food is not acceptable, and we take it seriously. We'd love to invite you back and show you what we're really about — please get in touch.",
];

function SectionLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="mb-3 flex items-center gap-1.5">
      <Icon className="size-3 text-muted-foreground" />
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

export function AIReviewCard() {
  const [reviewIndex, setReviewIndex] = useState(0);
  const [replyIndex, setReplyIndex] = useState(0);
  const [sent, setSent] = useState(false);
  const [reviewAction, setReviewAction] = useState<"anonymous" | "google" | null>(null);

  function cycleReview() {
    setReviewIndex((i) => (i + 1) % REVIEW_DRAFTS.length);
    setReviewAction(null);
  }

  function cycleReply() {
    setReplyIndex((i) => (i + 1) % REPLY_DRAFTS.length);
    setSent(false);
  }

  function handleSend() {
    setSent(true);
  }

  return (
    <Card className="md:col-span-2 md:row-span-3">
      <CardHeader>
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Zap className="size-5 text-primary" />
        </div>
        <CardTitle className="text-lg">AI Review Generation</CardTitle>
        <CardDescription>
          Most customers want to leave a review but don&apos;t know what to
          write. When they share their experience, we help write AI assisted
          review for them — they just tap Post.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Customer view */}
        <SectionLabel icon={User} label="Customer" />
        <div className="rounded-xl border border-border bg-muted/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            AI-generated preview
          </p>
          <p className="mt-3 text-sm leading-relaxed text-foreground">
            &ldquo;{REVIEW_DRAFTS[reviewIndex]}&rdquo;
          </p>
          <div className="mt-3 flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="size-4 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              onClick={cycleReview}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <RefreshCw className="size-3" />
              Regenerate
            </button>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                onClick={() => setReviewAction("anonymous")}
                disabled={reviewAction !== null}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-muted disabled:cursor-default disabled:opacity-70 sm:w-auto"
              >
                {reviewAction === "anonymous" ? (
                  <>
                    <Check className="size-3 text-green-500" />
                    Submitted privately
                  </>
                ) : (
                  <>
                    <Lock className="size-3" />
                    Post anonymous
                  </>
                )}
              </button>
              <button
                onClick={() => setReviewAction("google")}
                disabled={reviewAction !== null}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-default disabled:opacity-70 sm:w-auto"
              >
                {reviewAction === "google" ? (
                  <>
                    <Check className="size-3" />
                    Posted to Google
                  </>
                ) : (
                  <>
                    <ExternalLink className="size-3" />
                    Post to Google
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium text-muted-foreground">
            and for every new review
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Owner view */}
        <SectionLabel icon={Building2} label="You (owner)" />
        <div className="rounded-xl border border-border bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              AI reply — ready to send
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              <span className="size-1.5 rounded-full bg-primary" />
              1-click approve
            </span>
          </div>

          {/* Incoming review */}
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2">
            <div className="mt-0.5 flex shrink-0 gap-0.5">
              <Star className="size-3 fill-yellow-400 text-yellow-400" />
              <Star className="size-3 fill-muted text-muted-foreground" />
              <Star className="size-3 fill-muted text-muted-foreground" />
              <Star className="size-3 fill-muted text-muted-foreground" />
              <Star className="size-3 fill-muted text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              &ldquo;The wait was too long and the food arrived cold.&rdquo;
            </p>
          </div>

          {/* Draft reply */}
          <div className="mt-3 flex items-start gap-2.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <MessageSquare className="size-3 text-primary" />
            </div>
            <p className="text-sm leading-relaxed text-foreground">
              &ldquo;{REPLY_DRAFTS[replyIndex]}&rdquo;
            </p>
          </div>

          {/* Action row */}
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={cycleReply}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <RefreshCw className="size-3" />
              Regenerate
            </button>
            <button
              onClick={handleSend}
              disabled={sent}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-default disabled:opacity-80"
            >
              {sent ? (
                <>
                  <Check className="size-3" />
                  Sent
                </>
              ) : (
                <>
                  <MessageSquare className="size-3" />
                  Approve &amp; Send
                </>
              )}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
