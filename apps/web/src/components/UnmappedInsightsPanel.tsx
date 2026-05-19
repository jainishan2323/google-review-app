"use client";

interface UnmappedInsightsPanelProps {
  insights: { text: string; count: number }[];
}

export function UnmappedInsightsPanel({ insights }: UnmappedInsightsPanelProps) {
  if (insights.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No insights yet — run the analyzer to surface patterns outside your taxonomy.
      </p>
    );
  }

  const max = insights[0].count;

  return (
    <div className="flex flex-wrap gap-2">
      {insights.map(({ text, count }) => {
        const intensity = count / max;
        return (
          <span
            key={text}
            title={`Mentioned in ${count} review${count !== 1 ? "s" : ""}`}
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors"
            style={{
              backgroundColor: `color-mix(in srgb, var(--foreground) ${Math.round(intensity * 14)}%, transparent)`,
              borderColor: `color-mix(in srgb, var(--foreground) ${Math.round(intensity * 22)}%, transparent)`,
            }}
          >
            {text}
            <span className="text-xs text-muted-foreground font-normal tabular-nums">
              {count}
            </span>
          </span>
        );
      })}
    </div>
  );
}
