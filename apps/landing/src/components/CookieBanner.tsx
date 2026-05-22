"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE_KEY = "jugnoo_cookie_consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 rounded-2xl border border-border bg-background/95 p-5 shadow-2xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          We use a single essential session cookie to keep you signed in. No tracking, no ads.{" "}
          <Link href="/privacy#cookies" className="underline hover:text-foreground">
            Learn more
          </Link>
        </p>
        <button
          onClick={accept}
          className="shrink-0 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
