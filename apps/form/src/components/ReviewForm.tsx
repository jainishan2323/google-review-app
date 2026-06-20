"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Star, ArrowLeft, RefreshCw, Loader2, CheckCircle2, Copy, ExternalLink, Info, VenetianMask, Camera, ChevronLeft, ChevronRight } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { FireflyLogo } from "@/components/FireflyLogo";
import { GenerationInfoSheet } from "@/components/GenerationInfoSheet";
import { GoogleLogo } from "@/components/GoogleLogo";

// Paste-gesture demo, shown below the preview on the handoff screen. Lazy-loaded
// (ssr:false) so its animation code stays out of the initial step-1 bundle.
const PasteCoachmark = dynamic(
  () => import("@/components/PasteCoachmark").then((m) => m.PasteCoachmark),
  { ssr: false }
);

import type { FormTag } from "@repo/types";

interface Category {
  name: string;
  tags: FormTag[];
}

interface Props {
  businessId: string;
  businessName: string;
  googlePlaceId: string | null;
  googleMapsReviewUrl: string | null;
  brandColor: string;
  logoUrl: string | null;
  welcomeMessage: string;
  defaultLanguage: string;
  categories: Category[];
}

// TODO: replace with real Place ID from Business.googlePlaceId once onboarding is built
const DEV_PLACE_ID = "ChIJQ9oatEZRqEcRlRVb2Cpqx1w";

const MAX_GENERATIONS = 3;

// The two share-action buttons (Post to Google / Send privately) are styled from
// these two variants and only their ORDER flips by rating — so both rating paths
// render structurally identical CTAs. De-emphasising the public path on low ratings
// (faint link, smaller weight) would be review gating; equal-weight buttons are not.
// See docs/adr/0009-symmetric-share-ctas-on-both-rating-paths.md.
const ACTION_PRIMARY_CLASS =
  "flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-semibold text-white transition-opacity active:opacity-80 disabled:opacity-50";
const ACTION_SECONDARY_CLASS =
  "flex w-full items-center justify-center gap-2 rounded-xl border border-border py-4 text-base font-medium text-foreground transition-colors hover:bg-muted active:bg-muted disabled:opacity-50";

export default function ReviewForm({
  businessId,
  businessName,
  googlePlaceId,
  googleMapsReviewUrl,
  brandColor,
  logoUrl,
  welcomeMessage,
  defaultLanguage,
  categories,
}: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  // Tag IDENTITIES the customer selected (never display wording).
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [customText, setCustomText] = useState("");
  // Every AI draft is kept so the customer can navigate between them; each slot is
  // independently editable and retains its edits. Regenerating appends a slot (cap
  // MAX_GENERATIONS); the submitted text is always the slot on screen.
  const [versions, setVersions] = useState<string[]>([]);
  const [currentVersion, setCurrentVersion] = useState(0);
  // True only when a *regenerate* (not the first draft) fails — surfaced inline so
  // the attempt is a no-op that doesn't burn a slot or clobber the current draft.
  const [regenError, setRegenError] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [doneMessage, setDoneMessage] = useState("");
  // "idle" → step-3 editor; "copied"/"error" → guided handoff screen before Google.
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [appRatingSubmitted, setAppRatingSubmitted] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  // Drives the logo's fade-in: the reserved slot shows a pulsing backdrop until
  // the image decodes, then the logo eases in over it (no hard pop).
  const [logoLoaded, setLogoLoaded] = useState(false);

  // The text currently on screen — the one that gets edited, copied, and submitted.
  const currentText = versions[currentVersion] ?? "";

  // Auto-focus the first draft once (cursor at end) to invite editing; never on
  // regenerate or arrow navigation, which would thrash the mobile keyboard.
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const didFocusFirstDraft = useRef(false);



  const runGenerate = useCallback(async () => {
    // Index this draft would land at — also the count of prior successful drafts,
    // sent as `attempt` so the model varies each regeneration. Existing versions are
    // left untouched while generating, so a failure restores cleanly.
    const attempt = versions.length;
    setIsGenerating(true);
    setRegenError(false);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, rating, tagIds: selectedTagIds, customText, attempt }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const isStreaming = response.headers.get("content-type")?.includes("text/plain");

      let result: string;
      if (isStreaming && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        result = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          result += decoder.decode(value, { stream: true });
        }
      } else {
        result = (await response.json() as { text: string }).text;
      }

      // Success → append the new draft and jump to it.
      setVersions((prev) => [...prev, result]);
      setCurrentVersion(attempt);
    } catch {
      if (attempt === 0) {
        // First draft failed: seed version 1 with editable fallback so the customer
        // still has a box to write in.
        setVersions(["Couldn't generate a review right now. Feel free to write your own above."]);
        setCurrentVersion(0);
      } else {
        // Regenerate failed: no-op. Keep the current draft, surface an inline error.
        setRegenError(true);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [businessId, rating, selectedTagIds, customText, versions.length]);

  useEffect(() => {
    if (step === 3) void runGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Focus the first draft once, cursor at end (see didFocusFirstDraft above).
  useEffect(() => {
    if (didFocusFirstDraft.current || isGenerating || versions.length === 0) return;
    const el = textareaRef.current;
    if (!el) return;
    didFocusFirstDraft.current = true;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [versions.length, isGenerating]);

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
    setSelectedTagIds([]);
    setStep(2);
  }

  const MAX_CHIPS_PER_CATEGORY = 3;

  function toggleChip(tagId: string, categoryTagIds: string[]) {
    setSelectedTagIds((prev) => {
      if (prev.includes(tagId)) return prev.filter((id) => id !== tagId);
      const selectedInCategory = prev.filter((id) => categoryTagIds.includes(id)).length;
      if (selectedInCategory >= MAX_CHIPS_PER_CATEGORY) return prev;
      return [...prev, tagId];
    });
  }

  // Google's review box can't be pre-filled (no API/URL param), so the customer
  // must paste. We copy + show a guided handoff screen, then hand off on their tap.
  const reviewUrl = `https://search.google.com/local/writereview?placeid=${googlePlaceId ?? DEV_PLACE_ID}`;

  /**
   * Copy the review to the clipboard. MUST be called synchronously from a click
   * handler so mobile browsers (iOS/Android) grant clipboard access via the user
   * gesture. Drives the handoff screen via copyState ("copied" | "error").
   */
  function copyReview() {
    const clipboardPromise =
      typeof navigator !== "undefined" && navigator.clipboard?.writeText
        ? navigator.clipboard.writeText(currentText)
        : Promise.reject(new Error("Clipboard API unavailable"));

    clipboardPromise
      .then(() => setCopyState("copied"))
      .catch(() => setCopyState("error"));
  }

  function handlePostToGoogle() {
    // Copy + show the guided handoff screen. The google_redirect record is written
    // only when the customer actually taps through (handleOpenGoogle), so the count
    // reflects real handoffs, not intent.
    copyReview();
  }

  function handleOpenGoogle() {
    // Record the handoff at the moment of the deliberate tap. `keepalive` lets the
    // request survive the navigation below — a plain fetch would be aborted on unload.
    fetch("/api/submit-private", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        businessId,
        rating,
        tagIds: selectedTagIds,
        text: customText || undefined,
        generatedReview: currentText,
        source: "google_redirect",
      }),
    }).catch(() => { /* best-effort */ });

    window.location.href = reviewUrl;
  }

  // Defined once; rendered on both rating paths with only the variant + order
  // flipped, so the public and private CTAs stay structurally identical.
  function postToGoogleButton(variant: "primary" | "secondary") {
    return (
      <button
        type="button"
        onClick={handlePostToGoogle}
        disabled={isGenerating}
        className={variant === "primary" ? ACTION_PRIMARY_CLASS : ACTION_SECONDARY_CLASS}
        style={variant === "primary" ? { backgroundColor: brandColor } : undefined}
      >
        <GoogleLogo className="size-5" />
        Copy &amp; Post to Google
      </button>
    );
  }

  function sendPrivatelyButton(variant: "primary" | "secondary") {
    return (
      <button
        type="button"
        onClick={handleSendPrivately}
        disabled={isGenerating}
        className={variant === "primary" ? ACTION_PRIMARY_CLASS : ACTION_SECONDARY_CLASS}
        style={variant === "primary" ? { backgroundColor: brandColor } : undefined}
      >
        <VenetianMask className="size-5" />
        Send privately to the manager
      </button>
    );
  }

  // Write an edit back to the version currently on screen, leaving the others intact.
  function updateCurrentVersion(text: string) {
    setVersions((prev) => prev.map((v, i) => (i === currentVersion ? text : v)));
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
          generatedReview: currentText || undefined,
          tagIds: selectedTagIds,
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
          href="https://jugnoo.de"
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
        {/* The fixed h-14 w-40 logo slot is reserved UNCONDITIONALLY (matching
            FormSkeleton's placeholder) — whether or not this business has a logo —
            so the skeleton→form swap never changes the column height and recenters
            the stars. While the image decodes the slot shows a pulsing backdrop
            (consistent with the skeleton); the logo then eases in over it instead of
            popping. `priority` preloads it as the first-screen hero; next/image
            serves WebP/AVIF. With no logo the slot is just transparent whitespace. */}
        <div
          className={cn(
            "flex h-14 w-40 items-center justify-center overflow-hidden rounded-md",
            logoUrl && !logoLoaded && "animate-pulse bg-muted/40"
          )}
        >
          {logoUrl && (
            <Image
              src={logoUrl}
              alt={businessName}
              width={160}
              height={56}
              priority
              sizes="160px"
              onLoad={() => setLogoLoaded(true)}
              className={cn(
                "h-14 w-auto object-contain transition-opacity duration-500",
                logoLoaded ? "opacity-100" : "opacity-0"
              )}
            />
          )}
        </div>
        {/* Reserve a fixed-height slot (fits ~2 lines) so the welcome text settling
            in — font load, skeleton→form swap — never reflows and shifts the stars. */}
        <div className="flex min-h-14 w-full max-w-xs items-center justify-center">
          <p className="text-center text-lg font-medium text-foreground leading-snug">
            {welcomeMessage}
          </p>
        </div>
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
          href="https://jugnoo.de"
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
            // Rating ≥4 shows positive chips; <4 shows all. Driven by polarity.
            const chips = rating >= 4
              ? cat.tags.filter((t) => t.polarity === "positive")
              : cat.tags;
            if (chips.length === 0) return null;
            const chipIds = chips.map((t) => t.id);
            const selectedInCategory = selectedTagIds.filter((id) => chipIds.includes(id)).length;
            const limitReached = selectedInCategory >= MAX_CHIPS_PER_CATEGORY;
            return (
              <div key={cat.name} className="space-y-3">
                {categories.length > 1 && (
                  <p className="text-sm font-semibold text-foreground">{cat.name}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {chips.map((chip) => {
                    const selected = selectedTagIds.includes(chip.id);
                    const disabled = !selected && limitReached;
                    return (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => toggleChip(chip.id, chipIds)}
                        disabled={disabled}
                        className={cn(
                          "rounded-full border px-4 py-2.5 text-sm font-medium transition-all touch-manipulation active:scale-95",
                          selected ? "border-transparent text-white" : "border-border bg-background text-foreground",
                          disabled && "opacity-40 cursor-not-allowed"
                        )}
                        style={selected ? { backgroundColor: brandColor } : undefined}
                      >
                        {chip.label}
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
            href="https://jugnoo.de"
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

  // ── Step 3 handoff: guide the paste before sending to Google ─
  if (copyState !== "idle") {
    const failed = copyState === "error";
    return (
      <div className="flex min-h-svh flex-col gap-6 p-6">
        <button
          type="button"
          onClick={() => setCopyState("idle")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground w-fit touch-manipulation"
        >
          <ArrowLeft className="size-4" />
          Back to edit
        </button>

        {failed ? (
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">Almost there — copy your review</p>
            <p className="text-sm text-muted-foreground">
              We couldn&apos;t copy it automatically. Tap the button below (or select the text), then
              open Google and paste.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="flex items-center gap-2 text-base font-semibold text-foreground">
              <CheckCircle2 className="size-5" style={{ color: brandColor }} />
              Review copied!
            </p>
            <p className="text-sm text-muted-foreground">
              On the next screen, tap the review box and <strong>hold to Paste</strong>.
            </p>
          </div>
        )}

        {/* Preview of what they're about to post: their rating + final review text.
            Reminder only — Google doesn't receive these automatically; the stars are
            re-picked and the text pasted on Google's own screen. */}
        <div className="space-y-2">
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
          {failed ? (
            <Textarea
              value={currentText}
              readOnly
              onFocus={(e) => e.currentTarget.select()}
              className="min-h-36 resize-none text-sm leading-relaxed"
            />
          ) : (
            <div className="rounded-xl border border-border p-4">
              <p className="select-text whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {currentText}
              </p>
            </div>
          )}
          {rating >= 4 && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Camera className="size-4 shrink-0" style={{ color: brandColor }} />
              Don&apos;t forget to add photos too!
            </p>
          )}
        </div>

        {!failed && <PasteCoachmark brandColor={brandColor} />}

        <div className="sticky bottom-0 -mx-6 mt-auto space-y-3 border-t border-border bg-background px-6 pb-8 pt-4">
          {failed && (
            <button
              type="button"
              onClick={copyReview}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-4 text-base font-medium text-foreground transition-colors hover:bg-muted active:bg-muted"
            >
              <Copy className="size-4" />
              Copy review text
            </button>
          )}
          <button
            type="button"
            onClick={handleOpenGoogle}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-semibold text-white transition-opacity active:opacity-80"
            style={{ backgroundColor: brandColor }}
          >
            Open Google Reviews
            <ExternalLink className="size-4" />
          </button>
          <a
            href="https://jugnoo.de"
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
        <p className="text-base font-semibold text-foreground">Your review is ready</p>
        <p className="text-sm text-muted-foreground">
          Edit it if you&apos;d like, then choose how to share.
        </p>
      </div>

      {infoOpen && (
        <GenerationInfoSheet
          rating={rating}
          brandColor={brandColor}
          onClose={() => setInfoOpen(false)}
        />
      )}

      {isGenerating ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
          <p className="text-sm">Drafting your review…</p>
        </div>
      ) : (
        <>
          <Textarea
            ref={textareaRef}
            value={currentText}
            onChange={(e) => updateCurrentVersion(e.target.value)}
            className="min-h-36 resize-none text-sm leading-relaxed"
          />

          {/* Navigate between preserved drafts. Hidden until a 2nd version exists —
              nothing to navigate with a single draft. */}
          {versions.length >= 2 && (
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setCurrentVersion((v) => Math.max(0, v - 1))}
                disabled={currentVersion === 0}
                aria-label="Previous version"
                className="touch-manipulation text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
              >
                <ChevronLeft className="size-5" />
              </button>
              <span className="text-sm text-muted-foreground tabular-nums">
                Version {currentVersion + 1} of {versions.length}
              </span>
              <button
                type="button"
                onClick={() => setCurrentVersion((v) => Math.min(versions.length - 1, v + 1))}
                disabled={currentVersion === versions.length - 1}
                aria-label="Next version"
                className="touch-manipulation text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          )}

          <div className="flex flex-col items-start gap-3">
            {versions.length < MAX_GENERATIONS ? (
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
              <p className="text-xs text-muted-foreground">Maximum versions reached</p>
            )}
            {regenError && (
              <p className="text-xs text-destructive">
                Couldn&apos;t generate another version — try again.
              </p>
            )}
            <button
              type="button"
              onClick={() => setInfoOpen(true)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground touch-manipulation hover:text-foreground transition-colors"
            >
              <Info className="size-3.5" />
              How was this written?
            </button>
          </div>
        </>
      )}

      <div className="mt-auto space-y-3">
        {rating >= 4 ? (
          <>
            {postToGoogleButton("primary")}
            {sendPrivatelyButton("secondary")}
          </>
        ) : (
          <>
            {sendPrivatelyButton("primary")}
            {postToGoogleButton("secondary")}
          </>
        )}
        <a
          href="https://jugnoo.de"
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
