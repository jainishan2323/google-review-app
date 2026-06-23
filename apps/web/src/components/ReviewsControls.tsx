"use client";

import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const RATINGS = [
  { value: "all", label: "All ratings" },
  { value: "5",   label: "★★★★★" },
  { value: "4",   label: "★★★★" },
  { value: "3",   label: "★★★" },
  { value: "lte2", label: "★★ & below" },
] as const;

const REPLY = [
  { value: "all",      label: "All" },
  { value: "awaiting", label: "Awaiting" },
  { value: "replied",  label: "Replied" },
] as const;

type RatingValue = typeof RATINGS[number]["value"];
type ReplyValue = typeof REPLY[number]["value"];

interface ReviewsControlsProps {
  currentRating: RatingValue;
  currentReply: ReplyValue;
}

export function ReviewsControls({ currentRating, currentReply }: ReviewsControlsProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Omitting `page` resets pagination to 1 on any filter change.
  function update(key: string, value: string) {
    const params = new URLSearchParams({
      rating: currentRating,
      reply: currentReply,
      [key]: value,
    });
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
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

      {/* Reply-status filter */}
      <div className="flex rounded-lg border border-border overflow-hidden shrink-0">
        {REPLY.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => update("reply", value)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium transition-colors border-r border-border last:border-r-0",
              currentReply === value
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
