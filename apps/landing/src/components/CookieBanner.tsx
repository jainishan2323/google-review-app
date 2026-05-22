"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE_KEY = "jugnoo_cookie_consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isLocal = window.location.hostname === "localhost";
    if (isLocal || !localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem(STORAGE_KEY, "rejected");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 rounded-2xl border border-border bg-background/95 p-5 shadow-2xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          We use essential cookies to make this site work. No tracking, no ads.{" "}
          <Link href="/privacy#cookies" className="underline hover:text-foreground">
            Learn more
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={reject}
            className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Reject
          </button>
          <button
            onClick={accept}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
