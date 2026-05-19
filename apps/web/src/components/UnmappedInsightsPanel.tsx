"use client";

import { useState } from "react";
import { TagDrillDownSheet } from "@/components/TagDrillDownSheet";

interface UnmappedInsightsPanelProps {
  insights: { text: string; count: number }[];
  businessId: string;
}

export function UnmappedInsightsPanel({ insights, businessId }: UnmappedInsightsPanelProps) {
  const [selected, setSelected] = useState<string | null>(null);

  if (insights.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No insights yet — run the analyzer to surface patterns outside your taxonomy.
      </p>
    );
  }

  const max = insights[0].count;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {insights.map(({ text, count }) => {
          const intensity = count / max;
          return (
            <button
              key={text}
              onClick={() => setSelected(text)}
              title={`Mentioned in ${count} review${count !== 1 ? "s" : ""} — click to view`}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors hover:bg-muted cursor-pointer"
              style={{
                backgroundColor: `color-mix(in srgb, var(--foreground) ${Math.round(intensity * 14)}%, transparent)`,
                borderColor: `color-mix(in srgb, var(--foreground) ${Math.round(intensity * 22)}%, transparent)`,
              }}
            >
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
