import { Star, Flag, ArrowUp, ArrowDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ── Growth pill (period-over-period delta) ──────────────────────────────────

export interface GrowthPillProps {
  label: string; // "positive" | "negative"
  pct: number | null; // null = no prior period to compare against
  tone: "positive" | "negative"; // colour matches the chart series, not good/bad
}

export function GrowthPill({ label, pct, tone }: GrowthPillProps) {
  if (pct === null) return null;
  const up = pct > 0;
  const flat = pct === 0;
  const colorCls = flat
    ? "text-muted-foreground"
    : tone === "positive"
      ? "text-green-500"
      : "text-red-400";
  const Arrow = up ? ArrowUp : ArrowDown;
  return (
    <span className={cn("flex items-center gap-0.5 text-xs font-medium", colorCls)}>
      {!flat && <Arrow className="h-3 w-3" />}
      {Math.abs(pct)}% {label}
    </span>
  );
}

// ── Stats strip (the old summary cards, condensed to one line) ──────────────

export interface StatsStripProps {
  total: number;
  fromGoogle: number;
  formToGoogle: number;
  pending: number;
}

export function StatsStrip({ total, fromGoogle, formToGoogle, pending }: StatsStripProps) {
  const segments: { value: number; label: string }[] = [
    { value: total, label: total === 1 ? "total review" : "total reviews" },
    { value: fromGoogle, label: "from Google" },
    { value: formToGoogle, label: "Form → Google" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
      {segments.map((s, i) => (
        <span key={s.label} className="flex items-center gap-2">
          {i > 0 && <span className="text-muted-foreground/40">•</span>}
          <span>
            <span className="font-semibold text-foreground">{s.value}</span> {s.label}
          </span>
        </span>
      ))}
      <span className="flex items-center gap-2">
        <span className="text-muted-foreground/40">•</span>
        <span>
          {pending > 0 ? (
            <>
              <span className="font-semibold text-foreground">{pending}</span> new{" "}
              {pending === 1 ? "record" : "records"}
            </>
          ) : (
            "all analyzed"
          )}
        </span>
      </span>
    </div>
  );
}

// ── Overall sentiment panel ─────────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "h-6 w-6",
            i <= filled ? "fill-amber-400 text-amber-400" : "fill-muted/40 text-muted/40",
          )}
        />
      ))}
    </div>
  );
}

export interface OverallSentimentProps {
  avg: number | null;
  total: number;
  rangeLabel: string;
  distribution: { star: number; count: number }[]; // 5 → 1
  negativeCount: number;
  negativePct: number;
}

export function OverallSentimentPanel({
  avg,
  total,
  rangeLabel,
  distribution,
  negativeCount,
  negativePct,
}: OverallSentimentProps) {
  const maxCount = Math.max(1, ...distribution.map((d) => d.count));
  return (
    <Card className="px-6 py-5 gap-5">
      <h2 className="text-base font-semibold text-foreground">Overall sentiment</h2>

      <div className="flex items-end gap-3">
        <span className="text-5xl font-bold leading-none text-foreground">
          {avg !== null ? avg.toFixed(1) : "—"}
        </span>
        {avg !== null && <Stars rating={avg} />}
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">
        based on {total} {total === 1 ? "review" : "reviews"} · {rangeLabel}
      </p>

      <div className="flex flex-col gap-2">
        {distribution.map(({ star, count }) => (
          <div key={star} className="flex items-center gap-3 text-sm">
            <span className="w-7 shrink-0 text-muted-foreground tabular-nums">{star}★</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted/40">
              <div
                className="h-full rounded-full bg-amber-400"
                style={{ width: `${(count / maxCount) * 100}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right tabular-nums text-foreground">{count}</span>
          </div>
        ))}
      </div>

      {negativeCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <Flag className="h-4 w-4 shrink-0" />
          <span>
            <span className="font-semibold">{negativePct}% of reviews are negative</span> (&lt;4★) —{" "}
            {negativeCount} {negativeCount === 1 ? "review" : "reviews"}
          </span>
        </div>
      )}
    </Card>
  );
}

// ── Top tags panel (What people love / What to fix first) ───────────────────

export interface TopTag {
  tag: string;
  zone: string;
  count: number;
}

export interface TopTagsPanelProps {
  title: string;
  variant: "love" | "fix";
  items: TopTag[];
}

export function TopTagsPanel({ title, variant, items }: TopTagsPanelProps) {
  const maxCount = Math.max(1, ...items.map((i) => i.count));
  const isLove = variant === "love";
  const dotCls = isLove ? "bg-green-500" : "bg-red-400";
  const barCls = isLove ? "bg-green-500" : "bg-red-400";
  const countCls = isLove ? "text-green-500" : "text-red-400";

  return (
    <Card className="px-6 py-5 gap-5">
      <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
        <span className={cn("h-2.5 w-2.5 rounded-full", dotCls)} />
        {title}
      </h2>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tagged feedback yet.</p>
      ) : (
        <ol className="flex flex-col gap-4">
          {items.map((item, i) => (
            <li key={item.tag} className="flex items-center gap-3">
              <span className="w-3 shrink-0 text-sm tabular-nums text-muted-foreground">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="truncate font-medium text-foreground">{item.tag}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">· {item.zone}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted/40">
                  <div
                    className={cn("h-full rounded-full", barCls)}
                    style={{ width: `${(item.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
              <span className={cn("w-8 shrink-0 text-right text-lg font-bold tabular-nums", countCls)}>
                {item.count}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
