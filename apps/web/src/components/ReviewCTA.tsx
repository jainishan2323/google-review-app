"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, X } from "lucide-react";

interface ReviewCTAProps {
  unreadCount: number;
}

export function ReviewCTA({ unreadCount }: ReviewCTAProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || unreadCount === 0) return null;

  function handleAnalyze() {
    setAnalyzing(true);
    setTimeout(() => setDismissed(true), 1800);
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
      <Sparkles className="h-4 w-4 shrink-0 text-amber-500" />
      {analyzing ? (
        <span className="flex items-center gap-2 flex-1 text-amber-700 dark:text-amber-400 font-medium">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Analyzing feedback…
        </span>
      ) : (
        <>
          <span className="flex-1 text-amber-700 dark:text-amber-400">
            You have{" "}
            <span className="font-bold">{unreadCount}</span>{" "}
            {unreadCount === 1 ? "review" : "reviews"} waiting to be analyzed.
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 shrink-0"
            onClick={handleAnalyze}
          >
            Analyze Now
          </Button>
          <button
            aria-label="Dismiss"
            className="text-amber-500/60 hover:text-amber-500 transition-colors"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}
