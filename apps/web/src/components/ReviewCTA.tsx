"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, X, RefreshCw, AlertTriangle } from "lucide-react";
import { useAnalysis } from "@/components/analysis/AnalysisProvider";

interface ReviewCTAProps {
  unreadCount: number;
  businessId: string;
  totalAnalyzed?: number;
  taxonomyChanged?: boolean;
}

/**
 * Contextual prompt + trigger for an analysis run. It only ever shows the *idle*
 * prompts (backlog waiting, taxonomy changed, all-analyzed) and hands the actual
 * run to the layout-level <AnalysisProvider>. Once a run is live, all progress /
 * done / error rendering belongs to the persistent corner widget, so this banner
 * hides itself while the run is non-idle. See ADR-0019.
 */
export function ReviewCTA({
  unreadCount,
  businessId,
  totalAnalyzed = 0,
  taxonomyChanged = false,
}: ReviewCTAProps) {
  const { phase, start } = useAnalysis();
  const [dismissed, setDismissed] = useState(false);

  // The corner widget owns the screen while a run is running/done/error.
  if (phase !== "idle") return null;

  const hasAnything = unreadCount > 0 || taxonomyChanged || totalAnalyzed > 0;
  if (dismissed || !hasAnything) return null;

  const analyze = () => start(businessId);
  const reAnalyze = () => start(businessId, { reset: true });

  // Orange "taxonomy changed" warning vs amber "work waiting" banner.
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
  const Icon = isTaxonomyWarning ? AlertTriangle : Sparkles;

  return (
    <div className={`flex items-start gap-3 rounded-lg border ${bannerCls} px-4 py-3 text-sm`}>
      <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${iconCls}`} />

      {taxonomyChanged && unreadCount > 0 ? (
        <div className="flex-1 flex flex-col gap-2">
          <span className={textCls}>
            <span className="font-bold">{unreadCount}</span> new{" "}
            {unreadCount === 1 ? "review" : "reviews"} to analyze, plus your categories
            were updated since the last analysis.
          </span>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" className={`h-7 ${btnCls} shrink-0`} onClick={analyze}>
              Analyze New ({unreadCount})
            </Button>
            <Button size="sm" variant="outline" className={`h-7 ${btnCls} shrink-0 gap-1.5`} onClick={reAnalyze}>
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
            <Button size="sm" variant="outline" className={`h-7 ${btnCls} gap-1.5`} onClick={reAnalyze}>
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
          <Button size="sm" variant="outline" className={`h-7 ${btnCls} shrink-0`} onClick={analyze}>
            Analyze Now
          </Button>
        </>
      ) : (
        <>
          <span className={`flex-1 ${textCls}`}>
            All <span className="font-bold">{totalAnalyzed}</span>{" "}
            {totalAnalyzed === 1 ? "review" : "reviews"} analyzed.
          </span>
          <Button size="sm" variant="outline" className={`h-7 ${btnCls} shrink-0 gap-1.5`} onClick={reAnalyze}>
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
