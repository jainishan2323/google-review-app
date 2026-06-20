"use client";

import { useState } from "react";
import { TagDrillDownSheet } from "@/components/TagDrillDownSheet";
import { cn } from "@/lib/utils";

type Sentiment = "positive" | "negative" | "neutral";

interface UnmappedInsightsPanelProps {
  insights: { text: string; count: number; sentiment: Sentiment }[];
  businessId: string;
}

// Sentiment flair: dot + matching border tint. Rating-derived (see page aggregation).
const SENTIMENT_STYLES: Record<Sentiment, { dot: string; border: string }> = {
  positive: { dot: "bg-green-500", border: "border-green-500/40" },
  negative: { dot: "bg-red-400", border: "border-red-400/40" },
  neutral: { dot: "bg-muted-foreground/50", border: "border-border" },
};

export function UnmappedInsightsPanel({ insights, businessId }: UnmappedInsightsPanelProps) {
  const [selected, setSelected] = useState<string | null>(null);

  if (insights.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No insights yet — run the analyzer to surface patterns outside your taxonomy.
      </p>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {insights.map(({ text, count, sentiment }) => {
          const style = SENTIMENT_STYLES[sentiment];
          return (
            <button
              key={text}
              onClick={() => setSelected(text)}
              title={`${sentiment} · mentioned in ${count} review${count !== 1 ? "s" : ""} — click to view`}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors hover:bg-muted cursor-pointer",
                style.border,
              )}
            >
              <span className={cn("h-2 w-2 rounded-full shrink-0", style.dot)} />
              {text}
              {count > 1 && (
                <span className="text-xs text-muted-foreground font-normal tabular-nums">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <TagDrillDownSheet
        tag={selected}
        businessId={businessId}
        open={!!selected}
        onClose={() => setSelected(null)}
        apiPath="/api/feedback-by-insight"
      />
    </>
  );
}
