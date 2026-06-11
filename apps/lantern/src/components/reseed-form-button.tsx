"use client";

import { useState, useTransition } from "react";
import { reseedTaxonomy } from "@/actions/businesses";

/** Operator action: seed a starter feedback form for a business that has none. */
export function ReseedFormButton({ businessId }: { businessId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const res = await reseedTaxonomy(businessId);
            if (!res.ok) setError(res.error ?? "Failed to seed form.");
          })
        }
        className="w-full rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
      >
        {pending ? "Seeding…" : "Seed feedback form"}
      </button>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
