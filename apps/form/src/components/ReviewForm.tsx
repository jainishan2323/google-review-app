"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { FireflyLogo } from "@/components/FireflyLogo";

interface Category {
  name: string;
  positiveChips: string[];
  negativeChips: string[];
}

interface Props {
  businessId: string;
  businessName: string;
  googlePlaceId: string | null;
  googleMapsReviewUrl: string | null;
  brandColor: string;
  logoUrl: string | null;
  welcomeMessage: string;
  categories: Category[];
}

// TODO: replace with real Place ID from Business.googlePlaceId once onboarding is built
const DEV_PLACE_ID = "ChIJU6S7CYpPqEcReRGBbxw0PRI";

const MAX_GENERATIONS = 3;

export default function ReviewForm({
  businessId,
  businessName,
  googlePlaceId,
  googleMapsReviewUrl,
  brandColor,
  logoUrl,
  welcomeMessage,
  categories,
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
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [generateCount, setGenerateCount] = useState(0);
  const [appRatingSubmitted, setAppRatingSubmitted] = useState(false);



  const runGenerate = useCallback(async () => {
    setIsGenerating(true);
    setGeneratedReview("");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, rating, tags: selectedChips, customText }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const isStreaming = response.headers.get("content-type")?.includes("text/plain");

      if (isStreaming && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let result = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          result += decoder.decode(value, { stream: true });
          setGeneratedReview(result);
        }
      } else {
        const data = await response.json() as { text: string };
        setGeneratedReview(data.text);
      }

      setGenerateCount((c) => c + 1);
    } catch {
      setGeneratedReview(
        "Couldn't generate a review right now. Feel free to write your own above."
      );
    } finally {
      setIsGenerating(false);
    }
  }, [businessId, rating, selectedChips, customText]);

  useEffect(() => {
    if (step === 3) void runGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const APP_EMOJIS = [
    { emoji: "😞", value: 1 },
    { emoji: "😐", value: 2 },
    { emoji: "🙂", value: 3 },
    { emoji: "😃", value: 4 },
    { emoji: "🤩", value: 5 },
  ];

  function handleAppRating(value: number) {
    setAppRatingSubmitted(true);
    fetch("/api/app-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: value, businessId }),
    }).catch(() => { /* best-effort */ });
  }

  function handleStarClick(star: number) {
    setRating(star);
    setSelectedChips([]);
    setStep(2);
  }

  const MAX_CHIPS_PER_CATEGORY = 3;

  function toggleChip(chip: string, categoryChips: string[]) {
    setSelectedChips((prev) => {
      if (prev.includes(chip)) return prev.filter((c) => c !== chip);
      const selectedInCategory = prev.filter((c) => categoryChips.includes(c)).length;
      if (selectedInCategory >= MAX_CHIPS_PER_CATEGORY) return prev;
      return [...prev, chip];
    });
  }

  function handlePostToGoogle() {
    const placeId = googlePlaceId ?? DEV_PLACE_ID;
    const reviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;

    // Fire-and-forget: record that the customer was redirected to Google.
    // Does NOT block the clipboard/redirect flow.
    fetch("/api/submit-private", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessId,
        rating,
        tags: selectedChips,
        text: customText || undefined,
        generatedReview,
        source: "google_redirect",
      }),
    }).catch(() => { /* best-effort */ });

    // Must call clipboard.writeText() synchronously inside the click handler
    // so mobile browsers (iOS/Android) grant permission via the user gesture.
    const clipboardPromise =
      typeof navigator !== "undefined" && navigator.clipboard?.writeText
        ? navigator.clipboard.writeText(generatedReview)
        : Promise.reject(new Error("Clipboard API unavailable"));

    clipboardPromise
      .then(() => {
        setCopyState("copied");
        setTimeout(() => {
          window.location.href = reviewUrl;
        }, 1500);
      })
      .catch(() => {
        window.alert(
          `Please copy your review below, then tap OK to open Google Maps:\n\n${generatedReview}`
        );
        window.location.href = reviewUrl;
      });
  }

  async function handleSendPrivately() {
    try {
      await fetch("/api/submit-private", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          rating,
          text: customText || undefined,
          generatedReview: generatedReview || undefined,
          tags: selectedChips,
          source: "private",
        }),
      });
    } catch { /* best-effort */ }
    setDoneMessage("Thank you! Your feedback has been sent privately to the manager.");
    setIsDone(true);
  }

  // ── Done ─────────────────────────────────────────────────────
  if (isDone) {
    return (
      <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 p-6 pb-12 text-center">
        <div className="text-6xl">🎉</div>
        <p className="text-lg font-semibold text-foreground max-w-xs">{doneMessage}</p>

        <div className="w-full max-w-xs border-t pt-6">
          {appRatingSubmitted ? (
            <p className="text-sm text-muted-foreground">Thanks for the feedback! ✓</p>
          ) : (
            <>
              <p className="text-sm font-medium text-muted-foreground mb-4">How was using Jugnoo?</p>
              <div className="flex justify-center gap-4">
                {APP_EMOJIS.map(({ emoji, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleAppRating(value)}
                    className="text-3xl touch-manipulation transition-transform active:scale-90 hover:scale-110"
                    aria-label={`Rate Jugnoo ${value} out of 5`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <a
          href="https://jugnoo.olbaid.de"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-5 flex items-center gap-1.5"
        >
          <FireflyLogo size={16} />
          <span className="text-xs text-muted-foreground">Powered by Jugnoo</span>
        </a>
      </div>
    );
  }

  // ── Step 1: Stars ────────────────────────────────────────────
  if (step === 1) {
    const displayRating = hovered || rating;
    return (
      <div className="relative flex min-h-svh flex-col items-center justify-center gap-8 p-6">
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

        <a
          href="https://jugnoo.olbaid.de"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-5 flex items-center gap-1.5"
        >
          <FireflyLogo size={16} />
          <span className="text-xs text-muted-foreground">Powered by Jugnoo</span>
        </a>
      </div>
    );
  }

  // ── Step 2: Tabs + Chips + text ──────────────────────────────
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

        {/* Categories stacked vertically */}
        <div className="space-y-6">
          {categories.map((cat) => {
            const chips = rating >= 4
              ? cat.positiveChips
              : [...cat.positiveChips, ...cat.negativeChips];
            if (chips.length === 0) return null;
            const selectedInCategory = selectedChips.filter((c) => chips.includes(c)).length;
            const limitReached = selectedInCategory >= MAX_CHIPS_PER_CATEGORY;
            return (
              <div key={cat.name} className="space-y-3">
                {categories.length > 1 && (
                  <p className="text-sm font-semibold text-foreground">{cat.name}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {chips.map((chip) => {
                    const selected = selectedChips.includes(chip);
                    const disabled = !selected && limitReached;
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => toggleChip(chip, chips)}
                        disabled={disabled}
                        className={cn(
                          "rounded-full border px-4 py-2.5 text-sm font-medium transition-all touch-manipulation active:scale-95",
                          selected ? "border-transparent text-white" : "border-border bg-background text-foreground",
                          disabled && "opacity-40 cursor-not-allowed"
                        )}
                        style={selected ? { backgroundColor: brandColor } : undefined}
                      >
                        {chip}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <Textarea
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="Tell us a bit more (optional)..."
          className="min-h-28 resize-none"
          maxLength={500}
        />

        <div className="mt-auto space-y-4">
          <button
            type="button"
            onClick={() => setStep(3)}
            className="w-full rounded-xl py-4 text-base font-semibold text-white transition-opacity active:opacity-80"
            style={{ backgroundColor: brandColor }}
          >
            Next
          </button>
          <a
            href="https://jugnoo.olbaid.de"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5"
          >
            <FireflyLogo size={16} />
            <span className="text-xs text-muted-foreground">Powered by Jugnoo</span>
          </a>
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
          {generateCount < MAX_GENERATIONS ? (
            <button
              type="button"
              onClick={() => void runGenerate()}
              disabled={isGenerating}
              className="flex items-center gap-1.5 text-sm text-muted-foreground w-fit touch-manipulation hover:text-foreground transition-colors disabled:opacity-40"
            >
              <RefreshCw className="size-3.5" />
              Generate another version
            </button>
          ) : (
            <p className="text-xs text-muted-foreground">Maximum regenerations reached</p>
          )}
        </>
      )}

      <div className="mt-auto space-y-3">
        {rating >= 4 ? (
          <>
            <button
              type="button"
              onClick={handlePostToGoogle}
              disabled={isGenerating || copyState === "copied"}
              className="w-full rounded-xl py-4 text-base font-semibold text-white transition-opacity active:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: brandColor }}
            >
              {copyState === "copied" ? "Copied! Redirecting to Google Maps…" : "Copy & Post to Google"}
            </button>
            <button
              type="button"
              onClick={handleSendPrivately}
              disabled={isGenerating}
              className="w-full rounded-xl border border-border py-4 text-base font-medium text-foreground transition-colors hover:bg-muted active:bg-muted disabled:opacity-50"
            >
              Send this privately to the manager
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={handleSendPrivately}
              disabled={isGenerating}
              className="w-full rounded-xl py-4 text-base font-semibold text-white transition-opacity active:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: brandColor }}
            >
              Send feedback to the manager
            </button>
            <button
              type="button"
              onClick={handlePostToGoogle}
              disabled={isGenerating || copyState === "copied"}
              className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 touch-manipulation"
            >
              {copyState === "copied" ? "Copied! Redirecting…" : "Still want to post to Google →"}
            </button>
          </>
        )}
        <a
          href="https://jugnoo.olbaid.de"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 pt-1"
        >
          <FireflyLogo size={16} />
          <span className="text-xs text-muted-foreground">Powered by Jugnoo</span>
        </a>
      </div>
    </div>
  );
}
