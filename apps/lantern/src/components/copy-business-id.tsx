"use client";

import { useState } from "react";

/**
 * Operator helper: shows a business's id (needed for the seed-import scripts —
 * we don't surface it anywhere else in the UI). The id text is selectable; only
 * the icon copies to clipboard.
 */
export function CopyBusinessId({ businessId }: { businessId: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <span className="mt-1 inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
      <span className="select-all truncate">{businessId}</span>
      <button
        type="button"
        title="Copy business id"
        aria-label="Copy business id"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(businessId);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            /* clipboard blocked — id is still selectable to copy manually */
          }
        }}
        className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
      >
        {copied ? (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-green-600"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>
    </span>
  );
}
