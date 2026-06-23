"use client";

import { useEffect, useState } from "react";

interface LocalDateTimeProps {
  // ISO string (serializable across the server→client boundary).
  iso: string;
  withTime?: boolean;
  className?: string;
}

// Renders a timestamp in the viewer's own locale + timezone. Server-rendered times
// would be in the server's zone (UTC on Vercel), which is visibly wrong once a clock
// time is shown — so we format on the client after mount. Before mount we render a
// stable date-only fallback (day rarely flips across a TZ offset) to avoid layout shift.
export function LocalDateTime({ iso, withTime = false, className }: LocalDateTimeProps) {
  const date = new Date(iso);

  const dateOnly = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const [label, setLabel] = useState(dateOnly);

  useEffect(() => {
    setLabel(
      date.toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iso, withTime]);

  return (
    <span className={className} suppressHydrationWarning>
      {label}
    </span>
  );
}
