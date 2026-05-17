"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const RANGES = [
  { value: "7d",  label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "ytd", label: "YTD" },
  { value: "all", label: "All" },
] as const;

const RATINGS = [
  { value: "all", label: "All ratings" },
  { value: "5",   label: "★★★★★" },
  { value: "4",   label: "★★★★" },
  { value: "3",   label: "★★★" },
  { value: "lte2", label: "★★ & below" },
] as const;

type RangeValue = typeof RANGES[number]["value"];
type RatingValue = typeof RATINGS[number]["value"];

interface ReviewsControlsProps {
  currentRange: RangeValue;
  currentRating: RatingValue;
}

export function ReviewsControls({ currentRange, currentRating }: ReviewsControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Range toggle */}
      <div className="flex rounded-lg border border-border overflow-hidden shrink-0">
        {RANGES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => update("range", value)}
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

      {/* Rating filter */}
      <div className="flex rounded-lg border border-border overflow-hidden shrink-0">
        {RATINGS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => update("rating", value)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium transition-colors border-r border-border last:border-r-0",
              currentRating === value
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
