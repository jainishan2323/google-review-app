"use client";

import { useState } from "react";
import { Zap, Star, MessageSquare, Check, RefreshCw, Building2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const REPLY_DRAFTS = [
  "Hi Maria, sorry to hear this. The wait was too long and cold food is on us. I'm going to look into Tuesday evening personally. Please come back and give us a chance to do better.",
  "Hi Maria, thank you for telling us. A long wait and cold food, we're not happy about that either. Reach out and we'd like to have you back, on the house.",
  "Maria, sorry this happened. Cold food and a slow evening is not what we want for anyone. Come back and ask for me directly. I'd like to make it right.",
];

function SectionLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="mb-3 flex items-center gap-1.5">
      <Icon className="size-3 text-muted-foreground" />
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

export function AIReplyCard() {
  const [replyIndex, setReplyIndex] = useState(0);
  const [sent, setSent] = useState(false);

  function cycleReply() {
    setReplyIndex((i) => (i + 1) % REPLY_DRAFTS.length);
    setSent(false);
  }

  function handleSend() {
    setSent(true);
  }

  return (
    <Card className="md:col-span-2 md:row-span-2">
      <CardHeader>
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Zap className="size-5 text-primary" />
        </div>
        <CardTitle className="text-lg">A reply ready for every review</CardTitle>
        <CardDescription>
          The moment a review lands, Jugnoo drafts a reply in your voice.
          Read it, tweak a word if you like, and send. Showing up for every
          reviewer — the happy ones and the unhappy ones — is how you build
          trust that brings people back.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
