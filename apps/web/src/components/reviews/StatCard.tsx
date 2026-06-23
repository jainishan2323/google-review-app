import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  suffix?: React.ReactNode; // small trailing unit, e.g. "/5" or "%"
  sub?: React.ReactNode; // secondary line under the value
  accent?: "default" | "amber"; // amber tints the value (e.g. awaiting reply)
  align?: "start" | "center";
  className?: string;
}

// Presentational stat widget — pure, data-via-props, so it can be embedded anywhere
// (reviews page, home). No data fetching here on purpose.
export function StatCard({
  label,
  value,
  suffix,
  sub,
  accent = "default",
  align = "start",
  className,
}: StatCardProps) {
  const centered = align === "center";
  return (
    <Card
      className={cn(
        "gap-2 px-5 py-4",
        centered && "items-center text-center",
        className
      )}
    >
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className={cn("flex items-baseline gap-1", centered && "justify-center")}>
        <span
          className={cn(
            "text-4xl font-bold tracking-tight",
            accent === "amber" ? "text-amber-500" : "text-foreground"
          )}
        >
          {value}
        </span>
        {suffix && (
          <span className="text-lg font-medium text-muted-foreground">{suffix}</span>
        )}
      </p>
      {sub && <div className="text-sm text-muted-foreground">{sub}</div>}
    </Card>
  );
}
