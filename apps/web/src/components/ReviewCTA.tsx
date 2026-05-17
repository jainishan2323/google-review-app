"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, X, CheckCircle2, RefreshCw, AlertTriangle } from "lucide-react";
import { analyzeReviews, reAnalyzeReviews } from "@/app/actions/analyzeReviews";

interface ReviewCTAProps {
  unreadCount: number;
  businessId: string;
  totalAnalyzed: number;
  taxonomyChanged: boolean;
}

export function ReviewCTA({ unreadCount, businessId, totalAnalyzed, taxonomyChanged }: ReviewCTAProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [result, setResult] = useState<{ reviewsAnalyzed: number; feedbackAnalyzed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasAnything = unreadCount > 0 || taxonomyChanged || totalAnalyzed > 0;
  if (dismissed || !hasAnything) return null;

  async function handleAnalyze(reAnalyze = false) {
    setAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      const res = reAnalyze
        ? await reAnalyzeReviews(businessId)
        : await analyzeReviews(businessId);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  // Taxonomy-changed banner style (orange-red, more urgent)
  const isTaxonomyWarning = taxonomyChanged && unreadCount === 0;

  const bannerCls = isTaxonomyWarning
    ? "border-orange-500/30 bg-orange-500/10"
    : "border-amber-500/30 bg-amber-500/10";
  const iconCls = isTaxonomyWarning ? "text-orange-500" : "text-amber-500";
  const textCls = isTaxonomyWarning
    ? "text-orange-700 dark:text-orange-400"
    : "text-amber-700 dark:text-amber-400";
  const btnCls = isTaxonomyWarning
    ? "border-orange-500/40 text-orange-700 dark:text-orange-400 hover:bg-orange-500/20"
    : "border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20";
  const dismissCls = isTaxonomyWarning
    ? "text-orange-500/60 hover:text-orange-500"
    : "text-amber-500/60 hover:text-amber-500";

  return (
    <div className={`flex items-start gap-3 rounded-lg border ${bannerCls} px-4 py-3 text-sm`}>
      {isTaxonomyWarning
        ? <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${iconCls}`} />
        : <Sparkles className={`h-4 w-4 shrink-0 mt-0.5 ${iconCls}`} />
      }

      {analyzing ? (
        <span className={`flex items-center gap-2 flex-1 ${textCls} font-medium`}>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Analyzing reviews… this may take a moment.
        </span>
      ) : result ? (
        <span className={`flex items-center gap-2 flex-1 ${textCls} font-medium`}>
          <CheckCircle2 className="h-3.5 w-3.5" />
          Done — {result.reviewsAnalyzed + result.feedbackAnalyzed} records analyzed. Refresh to see updated charts.
        </span>
      ) : error ? (
        <span className="flex-1 text-red-600 dark:text-red-400">{error}</span>
      ) : taxonomyChanged && unreadCount > 0 ? (
        // Both: new reviews AND taxonomy changed
        <div className="flex-1 flex flex-col gap-2">
          <span className={textCls}>
            <span className="font-bold">{unreadCount}</span> new {unreadCount === 1 ? "review" : "reviews"} to analyze,
            plus your categories were updated since the last analysis.
          </span>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" className={`h-7 ${btnCls} shrink-0`}
              onClick={() => void handleAnalyze(false)}>
              Analyze New ({unreadCount})
            </Button>
            <Button size="sm" variant="outline" className={`h-7 ${btnCls} shrink-0 gap-1.5`}
              onClick={() => void handleAnalyze(true)}>
              <RefreshCw className="h-3 w-3" />
              Re-analyze All ({totalAnalyzed + unreadCount})
            </Button>
          </div>
        </div>
      ) : taxonomyChanged ? (
        // Taxonomy changed, all already analyzed
        <div className="flex-1 flex flex-col gap-1.5">
          <span className={`${textCls} font-medium`}>
            Your categories or tags were updated since the last analysis.
          </span>
          <span className={`${textCls} text-xs opacity-80`}>
            Re-analyzing will update all {totalAnalyzed} reviews with your new taxonomy. This may take some time.
          </span>
          <div className="mt-1">
            <Button size="sm" variant="outline" className={`h-7 ${btnCls} gap-1.5`}
              onClick={() => void handleAnalyze(true)}>
              <RefreshCw className="h-3 w-3" />
              Re-analyze All ({totalAnalyzed})
            </Button>
          </div>
        </div>
      ) : unreadCount > 0 ? (
        // New unanalyzed reviews only
        <>
          <span className={`flex-1 ${textCls}`}>
            <span className="font-bold">{unreadCount}</span>{" "}
            {unreadCount === 1 ? "review" : "reviews"} waiting to be analyzed.
          </span>
          <Button size="sm" variant="outline" className={`h-7 ${btnCls} shrink-0`}
            onClick={() => void handleAnalyze(false)}>
            Analyze Now
          </Button>
        </>
      ) : (
        // Everything analyzed, no taxonomy change — just offer re-analyze
        <>
          <span className={`flex-1 ${textCls}`}>
            All <span className="font-bold">{totalAnalyzed}</span>{" "}
            {totalAnalyzed === 1 ? "review" : "reviews"} analyzed.
          </span>
          <Button size="sm" variant="outline" className={`h-7 ${btnCls} shrink-0 gap-1.5`}
            onClick={() => void handleAnalyze(true)}>
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
