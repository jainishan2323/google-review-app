"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { syncReviewsAction } from "@/actions/syncReviews";

const ERRORS: Record<string, string> = {
  not_connected: "Connect Google first.",
  no_token: "Google access expired — reconnect.",
};

// User-driven refresh: re-pulls reviews from Google into our DB on demand (we don't
// auto-poll, to save API bandwidth). Shows a brief outcome message after each run.
// `autoStart` fires the import once on mount for a freshly-connected business that has
// never synced — keeping the heavy first import off the server render path.
export function SyncReviewsButton({
  syncedAt,
  autoStart = false,
}: {
  syncedAt: string | null;
  autoStart?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (autoStart && !started.current) {
      started.current = true;
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  function run() {
    setMsg(null);
    startTransition(async () => {
      const res = await syncReviewsAction();
      if (res.ok) {
        const removed = res.removed ? `, ${res.removed} removed` : "";
        setMsg(`Synced ${res.synced ?? 0} review${res.synced === 1 ? "" : "s"}${removed}.`);
        router.refresh();
      } else {
        setMsg(ERRORS[res.error ?? ""] ?? "Sync failed — try again.");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      {msg ? (
        <span className="text-xs text-muted-foreground">{msg}</span>
      ) : syncedAt ? (
        <span className="text-xs text-muted-foreground">Updated {syncedAt}</span>
      ) : null}
      <Button variant="outline" size="sm" className="gap-1.5" onClick={run} disabled={pending}>
        <RefreshCw className={`h-3.5 w-3.5 ${pending ? "animate-spin" : ""}`} />
        {pending ? "Syncing…" : "Sync reviews"}
      </Button>
    </div>
  );
}
