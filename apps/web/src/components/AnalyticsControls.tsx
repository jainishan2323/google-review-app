"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const RANGES = [
  { value: "30d",  label: "30 days" },
  { value: "90d",  label: "90 days" },
  { value: "180d", label: "180 days" },
  { value: "all",  label: "All time" },
] as const;

type Range = typeof RANGES[number]["value"];

export function AnalyticsControls({ currentRange }: { currentRange: Range }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setRange(range: Range) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", range);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex rounded-lg border border-border overflow-hidden shrink-0">
      {RANGES.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => setRange(value)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium transition-colors border-r border-border last:border-r-0",
            currentRange === value
              ? "bg-primary text-primary-foreground"
              : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
