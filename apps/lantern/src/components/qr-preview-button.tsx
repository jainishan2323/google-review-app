"use client";

import { useState } from "react";

/**
 * Per-row "Preview" action (ADR 0015): opens a modal with an enlarged, scannable
 * QR plus the code and the Download SVG button — so the Operator can scan straight
 * off the screen for quick testing before downloading. The QR SVG is pre-rendered
 * server-side and passed in as a string (no QR lib on the client).
 */
export function QrPreviewButton({
  token,
  url,
  qrSvg,
}: {
  token: string;
  url: string;
  qrSvg: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
      >
        Preview
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xs rounded-2xl border border-border bg-card p-6 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="mx-auto h-56 w-56 rounded-lg border border-border bg-white p-2"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
            <p className="mt-4 font-mono text-lg font-semibold text-foreground">{token}</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block break-all text-xs text-primary underline-offset-2 hover:underline"
            >
              {url}
            </a>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <a
                href={`/dashboard/qr-codes/${token}/pdf`}
                download
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Print sheet (PDF)
              </a>
              <a
                href={`/dashboard/qr-codes/${token}/svg`}
                download
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Download SVG
              </a>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Close
              </button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Print sheet: one A4 page, this token&apos;s QR on all four counter-card designs.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
