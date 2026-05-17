"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Props {
  businessId: string;
  businessName: string;
  googleMapsReviewUrl: string | null;
  brandColor: string;
  logoUrl: string | null;
  welcomeMessage: string;
  positiveChips: string[];
  negativeChips: string[];
}

function buildReview(rating: number, chips: string[], customText: string, businessName: string): string {
  const chipPhrase = chips.length > 0 ? chips.join(", ") : "";
  if (rating >= 4) {
    return [
      `I had a wonderful experience at ${businessName}!`,
      chipPhrase ? `The ${chipPhrase} really stood out.` : "",
      customText || "I'd definitely recommend it to friends and family.",
      rating === 5 ? "Five stars without hesitation! ⭐⭐⭐⭐⭐" : "Really happy with my visit! ⭐⭐⭐⭐",
    ].filter(Boolean).join(" ");
  }
  return [
    `My visit to ${businessName} was okay.`,
    chipPhrase ? `A few things that could be improved: ${chipPhrase}.` : "",
    customText || "I hope to see improvements on my next visit.",
  ].filter(Boolean).join(" ");
}

export default function ReviewForm({
  businessId,
  businessName,
  googleMapsReviewUrl,
  brandColor,
  logoUrl,
  welcomeMessage,
  positiveChips,
  negativeChips,
}: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [customText, setCustomText] = useState("");
  const [generatedReview, setGeneratedReview] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [doneMessage, setDoneMessage] = useState("");

  const chips = rating >= 4 ? positiveChips : negativeChips;

  const runGenerate = useCallback(() => {
    setIsGenerating(true);
    setGeneratedReview("");
    setTimeout(() => {
      setGeneratedReview(buildReview(rating, selectedChips, customText, businessName));
      setIsGenerating(false);
    }, 1000);
  }, [rating, selectedChips, customText, businessName]);

  useEffect(() => {
    if (step === 3) runGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function handleStarClick(star: number) {
    setRating(star);
    setSelectedChips([]);
    setStep(2);
  }

  function toggleChip(chip: string) {
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  }

  async function handlePostToGoogle() {
    try { await navigator.clipboard.writeText(generatedReview); } catch { /* unavailable on some mobile browsers */ }
    window.open(googleMapsReviewUrl ?? "https://maps.google.com", "_blank", "noopener,noreferrer");
    setDoneMessage("Review copied! Paste it into Google Maps. Thank you 🎉");
    setIsDone(true);
  }

  async function handleSendPrivately() {
    try {
      await fetch("/api/submit-private", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, rating, text: customText || generatedReview }),
      });
    } catch { /* best-effort */ }
    setDoneMessage("Thank you! Your feedback has been sent privately to the manager.");
    setIsDone(true);
  }

  // ── Done ─────────────────────────────────────────────────────
  if (isDone) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="text-6xl">🎉</div>
        <p className="text-lg font-semibold text-foreground max-w-xs">{doneMessage}</p>
      </div>
    );
  }

  // ── Step 1: Stars ────────────────────────────────────────────
  if (step === 1) {
    const displayRating = hovered || rating;
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-8 p-6">
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={businessName} className="h-14 w-auto object-contain" />
        )}
        <p className="text-center text-lg font-medium text-foreground max-w-xs leading-snug">
          {welcomeMessage}
        </p>
        <div className="flex gap-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="touch-manipulation p-1 transition-transform active:scale-90"
              aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
            >
              <Star
                className="size-14 transition-colors duration-100"
                style={{
                  fill: star <= displayRating ? brandColor : "transparent",
                  color: star <= displayRating ? brandColor : "var(--muted-foreground)",
                  strokeWidth: 1.5,
                }}
              />
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">Tap a star to rate</p>
      </div>
    );
  }

  // ── Step 2: Chips + text ─────────────────────────────────────
  if (step === 2) {
    return (
      <div className="flex min-h-svh flex-col p-6 pb-8 gap-6">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground w-fit touch-manipulation"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>

        <div className="space-y-1.5">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className="size-5"
                style={{
                  fill: s <= rating ? brandColor : "transparent",
                  color: s <= rating ? brandColor : "var(--muted-foreground)",
                  strokeWidth: 1.5,
                }}
              />
            ))}
          </div>
          <p className="text-base font-semibold text-foreground">
            {rating >= 4 ? "What did you love?" : "What can we improve?"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => {
            const selected = selectedChips.includes(chip);
            return (
              <button
                key={chip}
                type="button"
                onClick={() => toggleChip(chip)}
                className={cn(
                  "rounded-full border px-4 py-2.5 text-sm font-medium transition-all touch-manipulation active:scale-95",
                  selected ? "border-transparent text-white" : "border-border bg-background text-foreground"
                )}
                style={selected ? { backgroundColor: brandColor } : undefined}
              >
                {chip}
              </button>
            );
          })}
        </div>

        <Textarea
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="Tell us a bit more (optional)..."
          className="min-h-28 resize-none"
        />

        <div className="mt-auto">
          <button
            type="button"
            onClick={() => setStep(3)}
            className="w-full rounded-xl py-4 text-base font-semibold text-white transition-opacity active:opacity-80"
            style={{ backgroundColor: brandColor }}
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  // ── Step 3: Review + actions ─────────────────────────────────
  return (
    <div className="flex min-h-svh flex-col p-6 pb-8 gap-6">
      <button
        type="button"
        onClick={() => setStep(2)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground w-fit touch-manipulation"
      >
        <ArrowLeft className="size-4" />
        Back
      </button>

      <div className="space-y-1">
        <p className="text-base font-semibold text-foreground">Your review is ready</p>
        <p className="text-sm text-muted-foreground">
          Edit it if you&apos;d like, then choose how to share.
        </p>
      </div>

      {isGenerating ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
          <p className="text-sm">Drafting your review…</p>
        </div>
      ) : (
        <>
          <Textarea
            value={generatedReview}
            onChange={(e) => setGeneratedReview(e.target.value)}
            className="min-h-36 resize-none text-sm leading-relaxed"
          />
          <button
            type="button"
            onClick={runGenerate}
            className="flex items-center gap-1.5 text-sm text-muted-foreground w-fit touch-manipulation hover:text-foreground transition-colors"
          >
            <RefreshCw className="size-3.5" />
            Generate another version
          </button>
        </>
      )}

      <div className="mt-auto space-y-3">
        <button
          type="button"
          onClick={handlePostToGoogle}
          disabled={isGenerating}
          className="w-full rounded-xl py-4 text-base font-semibold text-white transition-opacity active:opacity-80 disabled:opacity-50"
          style={{ backgroundColor: brandColor }}
        >
          Copy &amp; Post to Google
        </button>
        <button
          type="button"
          onClick={handleSendPrivately}
          disabled={isGenerating}
          className="w-full rounded-xl border border-border py-4 text-base font-medium text-foreground transition-colors hover:bg-muted active:bg-muted disabled:opacity-50"
        >
          Actually, send this privately to the manager
        </button>
      </div>
    </div>
  );
}
