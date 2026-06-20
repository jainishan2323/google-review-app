"use client";

import { usePathname, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle, RefreshCw, X, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnalysis, ANALYTICS_PATH } from "./AnalysisProvider";

/**
 * Persistent bottom-right progress widget for the current analysis run. Rendered
 * once in the dashboard layout so it follows the owner across tabs. Locked on
 * screen while running (no minimize/cancel/dismiss); dismissable only once the run
 * reaches a terminal state. See ADR-0019.
 */
export function AnalysisProgressWidget() {
  const { phase, done, total, error, retry, dismiss } = useAnalysis();
  const router = useRouter();
  const pathname = usePathname();

  if (phase === "idle") return null;

  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;

  function viewResults() {
    dismiss();
    router.push(ANALYTICS_PATH);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-xl border border-border bg-background shadow-lg">
      {phase === "running" && (
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-amber-500 shrink-0" />
            <span className="text-sm font-medium text-foreground">
              Analyzing reviews
            </span>
            <span className="ml-auto text-xs tabular-nums text-muted-foreground">
              {done}/{total || "…"}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-amber-500/20">
            <div
              className="h-full bg-amber-500 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Keep this tab open — analysis continues as you move around the dashboard.
          </p>
        </div>
      )}

      {phase === "done" && (
        <div className="p-4">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Analysis complete</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {done} {done === 1 ? "record" : "records"} analyzed.
              </p>
              {pathname !== ANALYTICS_PATH && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 h-7 gap-1.5"
                  onClick={viewResults}
                >
                  <BarChart2 className="h-3 w-3" />
                  View results
                </Button>
              )}
            </div>
            <button
              aria-label="Dismiss"
              className="text-muted-foreground/60 transition-colors hover:text-foreground"
              onClick={dismiss}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {phase === "error" && (
        <div className="p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 text-red-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                Analysis failed
                {total > 0 && (
                  <span className="font-normal text-muted-foreground"> at {done}/{total}</span>
                )}
              </p>
              {error && (
                <p className="text-xs text-muted-foreground mt-0.5 break-words">{error}</p>
              )}
              <Button
                size="sm"
                variant="outline"
                className="mt-3 h-7 gap-1.5 border-red-500/40 text-red-700 hover:bg-red-500/10 dark:text-red-400"
                onClick={retry}
              >
                <RefreshCw className="h-3 w-3" />
                Retry{total > 0 ? ` from ${done}/${total}` : ""}
              </Button>
            </div>
            <button
              aria-label="Dismiss"
              className="text-muted-foreground/60 transition-colors hover:text-foreground"
              onClick={dismiss}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
