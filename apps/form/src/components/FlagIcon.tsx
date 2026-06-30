import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Inline SVG flags for the language switcher. Chosen over emoji flags (🇬🇧/🇩🇪), which
 * don't render on Windows / many Linux setups and degrade to the bare "GB"/"DE" letters.
 * SVG renders identically everywhere. One entry per supported language; returns null for
 * a language without a flag (the switcher still shows its 2-letter code).
 *
 * Both flags are drawn at a shared box size via `xMidYMid slice` so a row of mixed flag
 * ratios (UK 2:1, DE 5:3) stays visually consistent.
 */
export function FlagIcon({ locale, className }: { locale: string; className?: string }) {
  const flag = FLAGS[locale];
  if (!flag) return null;
  return (
    <span
      className={cn("inline-block overflow-hidden rounded-[2px] ring-1 ring-black/10", className)}
      aria-hidden
    >
      {flag}
    </span>
  );
}

const svgProps = {
  width: "100%",
  height: "100%",
  preserveAspectRatio: "xMidYMid slice",
} as const;

const FLAGS: Record<string, ReactNode> = {
  de: (
    <svg viewBox="0 0 5 3" {...svgProps}>
      <rect width="5" height="3" fill="#000000" />
      <rect width="5" height="2" y="1" fill="#DD0000" />
      <rect width="5" height="1" y="2" fill="#FFCE00" />
    </svg>
  ),
  en: (
    // Union Jack (English shown as the UK flag — the convention in the German market).
    <svg viewBox="0 0 60 30" {...svgProps}>
      <clipPath id="uk-counterchange">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#ffffff" strokeWidth="6" />
      <path
        d="M0,0 L60,30 M60,0 L0,30"
        clipPath="url(#uk-counterchange)"
        stroke="#C8102E"
        strokeWidth="4"
      />
      <path d="M30,0 v30 M0,15 h60" stroke="#ffffff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  ),
};
