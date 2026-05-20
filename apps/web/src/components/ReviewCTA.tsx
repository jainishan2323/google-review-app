"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Sparkles,
  X,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import { analyzeBatchOnce, resetAnalysis } from "@/app/actions/analyzeReviews";

interface ReviewCTAProps {
  unreadCount: number;
  businessId: string;
  totalAnalyzed?: number;
  taxonomyChanged?: boolean;
}

type Phase = "idle" | "running" | "done" | "error";

export function ReviewCTA({
  unreadCount,
  businessId,
  totalAnalyzed = 0,
  taxonomyChanged = false,
}: ReviewCTAProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const hasAnything = unreadCount > 0 || taxonomyChanged || totalAnalyzed > 0;
  if (dismissed || !hasAnything) return null;

  /**
   * Drives the incremental analyze loop. Each iteration is one batch (<=15 records).
   * Safe to call again after an error — already-analyzed records are skipped
   * server-side, so the loop naturally resumes from where it failed.
   */
  async function runLoop(startingDone: number) {
    setPhase("running");
    setError(null);
    let doneSoFar = startingDone;
    let totalWork = total;

    try {
      while (true) {
        const { processed, remaining } = await analyzeBatchOnce(businessId);

        // First successful call: derive the total work for the progress bar
        if (totalWork === 0) {
          totalWork = doneSoFar + processed + remaining;
          setTotal(totalWork);
        }

        doneSoFar += processed;
        setDone(doneSoFar);

        if (remaining === 0) break;
        if (processed === 0) {
          // Defensive: something un-analyzed exists but the batch returned nothing.
          // Bail rather than spin forever.
          throw new Error("Analysis stalled — no records were processed in the last batch.");
        }
      }
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed.");
      setPhase("error");
    }
  }

  async function handleAnalyze() {
    setDone(0);
    setTotal(0);
    await runLoop(0);
  }

  async function handleReAnalyze() {
    setPhase("running");
    setError(null);
    setDone(0);
    setTotal(0);
    try {
      await resetAnalysis(businessId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reset analysis.");
      setPhase("error");
      return;
    }
    await runLoop(0);
  }

  function handleRetry() {
    void runLoop(done);
  }

  // ── Banner styling ──────────────────────────────────────────
  const isTaxonomyWarning = taxonomyChanged && unreadCount === 0;
  const isErrorState = phase === "error";

  const bannerCls = isErrorState
    ? "border-red-500/30 bg-red-500/10"
    : isTaxonomyWarning
    ? "border-orange-500/30 bg-orange-500/10"
    : "border-amber-500/30 bg-amber-500/10";

  const iconCls = isErrorState
    ? "text-red-500"
    : isTaxonomyWarning
    ? "text-orange-500"
    : "text-amber-500";

  const textCls = isErrorState
    ? "text-red-700 dark:text-red-400"
    : isTaxonomyWarning
    ? "text-orange-700 dark:text-orange-400"
    : "text-amber-700 dark:text-amber-400";

  const btnCls = isTaxonomyWarning
    ? "border-orange-500/40 text-orange-700 dark:text-orange-400 hover:bg-orange-500/20"
    : "border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20";

  const dismissCls = isErrorState
    ? "text-red-500/60 hover:text-red-500"
    : isTaxonomyWarning
    ? "text-orange-500/60 hover:text-orange-500"
    : "text-amber-500/60 hover:text-amber-500";

  const Icon = isErrorState
    ? AlertCircle
    : isTaxonomyWarning
    ? AlertTriangle
    : Sparkles;

  const progressPct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;

  return (
    <div className={`flex items-start gap-3 rounded-lg border ${bannerCls} px-4 py-3 text-sm`}>
      <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${iconCls}`} />

      {phase === "running" ? (
        <div className="flex-1 flex flex-col gap-2">
          <span className={`flex items-center gap-2 ${textCls} font-medium`}>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Analyzing {done}/{total || "…"} reviews
          </span>
          {total > 0 && (
            <div className="h-1.5 w-full rounded-full bg-amber-500/20 overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}
        </div>
      ) : phase === "done" ? (
        <span className={`flex items-center gap-2 flex-1 ${textCls} font-medium`}>
          <CheckCircle2 className="h-3.5 w-3.5" />
          Done — {done} {done === 1 ? "record" : "records"} analyzed. Refresh to see updated charts.
        </span>
      ) : phase === "error" ? (
        <div className="flex-1 flex flex-col gap-2">
          <span className={textCls}>
            <span className="font-medium">Analysis failed</span>
            {total > 0 && (
              <> at <span className="font-medium">{done}/{total}</span></>
            )}
            . {error}
          </span>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              className="h-7 border-red-500/40 text-red-700 dark:text-red-400 hover:bg-red-500/20 shrink-0 gap-1.5"
              onClick={handleRetry}
            >
              <RefreshCw className="h-3 w-3" />
              Retry from {done}/{total}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-red-700 dark:text-red-400 hover:bg-red-500/20 shrink-0"
              onClick={() => setDismissed(true)}
            >
              Stop
            </Button>
          </div>
        </div>
      ) : taxonomyChanged && unreadCount > 0 ? (
        <div className="flex-1 flex flex-col gap-2">
          <span className={textCls}>
            <span className="font-bold">{unreadCount}</span> new{" "}
            {unreadCount === 1 ? "review" : "reviews"} to analyze, plus your categories
            were updated since the last analysis.
          </span>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              className={`h-7 ${btnCls} shrink-0`}
              onClick={() => void handleAnalyze()}
            >
              Analyze New ({unreadCount})
            </Button>
            <Button
              size="sm"
              variant="outline"
              className={`h-7 ${btnCls} shrink-0 gap-1.5`}
              onClick={() => void handleReAnalyze()}
            >
              <RefreshCw className="h-3 w-3" />
              Re-analyze All ({totalAnalyzed + unreadCount})
            </Button>
          </div>
        </div>
      ) : taxonomyChanged ? (
        <div className="flex-1 flex flex-col gap-1.5">
          <span className={`${textCls} font-medium`}>
            Your categories or tags were updated since the last analysis.
          </span>
          <span className={`${textCls} text-xs opacity-80`}>
            Re-analyzing will update all {totalAnalyzed} reviews with your new taxonomy.
          </span>
          <div className="mt-1">
            <Button
              size="sm"
              variant="outline"
              className={`h-7 ${btnCls} gap-1.5`}
              onClick={() => void handleReAnalyze()}
            >
              <RefreshCw className="h-3 w-3" />
              Re-analyze All ({totalAnalyzed})
            </Button>
          </div>
        </div>
      ) : unreadCount > 0 ? (
        <>
          <span className={`flex-1 ${textCls}`}>
            <span className="font-bold">{unreadCount}</span>{" "}
            {unreadCount === 1 ? "review" : "reviews"} waiting to be analyzed.
          </span>
          <Button
            size="sm"
            variant="outline"
            className={`h-7 ${btnCls} shrink-0`}
            onClick={() => void handleAnalyze()}
          >
            Analyze Now
          </Button>
        </>
      ) : (
        <>
          <span className={`flex-1 ${textCls}`}>
            All <span className="font-bold">{totalAnalyzed}</span>{" "}
            {totalAnalyzed === 1 ? "review" : "reviews"} analyzed.
          </span>
          <Button
            size="sm"
            variant="outline"
            className={`h-7 ${btnCls} shrink-0 gap-1.5`}
            onClick={() => void handleReAnalyze()}
          >
            <RefreshCw className="h-3 w-3" />
            Re-analyze All
          </Button>
        </>
      )}

      <button
        aria-label="Dismiss"
        className={`${dismissCls} transition-colors mt-0.5`}
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
