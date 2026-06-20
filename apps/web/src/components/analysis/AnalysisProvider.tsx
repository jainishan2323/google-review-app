"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { analyzeBatchOnce } from "@/app/actions/analyzeReviews";

// Owns the client-driven "analysis run" — one batch at a time via the
// `analyzeBatchOnce` server action — and exposes its live progress to the whole
// dashboard. Mounted in the dashboard layout (not a page), so the run + its
// progress survive in-app navigation between tabs. There is deliberately no
// server-tracked job: a hard reload ends the run, but each completed batch is
// already persisted, so a fresh run resumes the remainder. See ADR-0019.

export type AnalysisPhase = "idle" | "running" | "done" | "error";

interface AnalysisContextValue {
  phase: AnalysisPhase;
  done: number;
  total: number;
  error: string | null;
  /** Kick off a run for a business. `reset` re-analyzes every record, not just the backlog. */
  start: (businessId: string, opts?: { reset?: boolean }) => void;
  /** Resume a failed run from where it stopped (already-analyzed records are skipped server-side). */
  retry: () => void;
  /** Clear a terminal (done/error) widget. No-op while a run is live. */
  dismiss: () => void;
}

const AnalysisContext = createContext<AnalysisContextValue | null>(null);

export function useAnalysis(): AnalysisContextValue {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis must be used within <AnalysisProvider>");
  return ctx;
}

export const ANALYTICS_PATH = "/dashboard/analytics";

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // Read the live route inside the async loop without re-creating it on every navigation.
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const [phase, setPhase] = useState<AnalysisPhase>("idle");
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const businessIdRef = useRef<string | null>(null);
  const runningRef = useRef(false);
  // Non-null for a re-analyze run: the run's start time. Records analyzed before
  // it are re-processed in place (no up-front wipe). Persisted across retry so a
  // resumed re-analyze still picks up the records it hasn't refreshed yet.
  const reanalyzeSinceRef = useRef<Date | null>(null);

  /**
   * One run: drive the batch loop to completion. `reanalyzeSince` (non-null) makes
   * it a re-analyze. Single source of truth for start/retry; guards against a
   * second concurrent run.
   */
  const execute = useCallback(
    async (
      businessId: string,
      startingDone: number,
      startingTotal: number,
      reanalyzeSince: Date | null,
    ) => {
      if (runningRef.current) return;
      runningRef.current = true;
      businessIdRef.current = businessId;
      reanalyzeSinceRef.current = reanalyzeSince;
      setError(null);
      setPhase("running");

      let doneSoFar = startingDone;
      let totalWork = startingTotal;
      setDone(doneSoFar);
      setTotal(totalWork);

      try {
        for (;;) {
          const { processed, remaining } = await analyzeBatchOnce(
            businessId,
            reanalyzeSince ?? undefined,
          );

          // First successful batch: derive total work for the progress bar.
          if (totalWork === 0) {
            totalWork = doneSoFar + processed + remaining;
            setTotal(totalWork);
          }
          doneSoFar += processed;
          setDone(doneSoFar);

          if (remaining === 0) break;
          if (processed === 0) {
            throw new Error("Analysis stalled — no records were processed in the last batch.");
          }
        }

        setPhase("done");
        // Charts are server-rendered from a pre-run snapshot; refresh them in place
        // when the user is looking at them. Elsewhere the widget offers "View results".
        if (pathnameRef.current === ANALYTICS_PATH) router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Analysis failed.");
        setPhase("error");
      } finally {
        runningRef.current = false;
      }
    },
    [router]
  );

  const start = useCallback(
    (businessId: string, opts?: { reset?: boolean }) => {
      // A re-analyze stamps the run's start time; a normal run only picks up the backlog.
      void execute(businessId, 0, 0, opts?.reset ? new Date() : null);
    },
    [execute]
  );

  const retry = useCallback(() => {
    const businessId = businessIdRef.current;
    if (businessId) void execute(businessId, done, total, reanalyzeSinceRef.current);
  }, [execute, done, total]);

  const dismiss = useCallback(() => {
    if (runningRef.current) return;
    setPhase("idle");
    setDone(0);
    setTotal(0);
    setError(null);
  }, []);

  return (
    <AnalysisContext.Provider value={{ phase, done, total, error, start, retry, dismiss }}>
      {children}
    </AnalysisContext.Provider>
  );
}
