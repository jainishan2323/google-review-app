"use client";

import QRCode from "react-qr-code";
import { Nfc } from "lucide-react";
import { cn } from "@/lib/utils";

// Placeholder brand green — swap for the real hex when provided. Single source of
// truth: both themes use this same green, only the arrangement differs.
const BRAND_GREEN = "#7CB518";
const BRAND_BLACK = "#0A0A0A";

export type CardTheme = "green-black" | "black-green";

interface ThemeColors {
  base: string; // outer/background colour
  panel: string; // rounded panel colour
  headlineA: string; // "Loved it?"
  headlineB: string; // "Say it louder."
  baseText: string; // subtext + step labels on the base
  numberBg: string; // step number circle
  numberFg: string; // step number digit
  panelText: string; // text inside the panel
}

const THEMES: Record<CardTheme, ThemeColors> = {
  // Green background, black panel (the default / mockup arrangement).
  "green-black": {
    base: BRAND_GREEN,
    panel: BRAND_BLACK,
    headlineA: "#000000",
    headlineB: "#FFFFFF",
    baseText: "#0A0A0A",
    numberBg: "#0A0A0A",
    numberFg: BRAND_GREEN,
    panelText: "#FFFFFF",
  },
  // Inverted: black background, green panel.
  "black-green": {
    base: BRAND_BLACK,
    panel: BRAND_GREEN,
    headlineA: "#FFFFFF",
    headlineB: BRAND_GREEN,
    baseText: "#FFFFFF",
    numberBg: BRAND_GREEN,
    numberFg: "#0A0A0A",
    panelText: "#0A0A0A",
  },
};

const STEPS = [
  <>Tap phone or scan</>,
  <>
    AI drafts a review <span className="font-bold">— edit anything</span>
  </>,
  <>Post it on Google, or leave feedback privately to us.</>,
];

interface Props {
  /** Full URL the QR encodes — already includes `?src=qr`. */
  qrUrl: string;
  /** Business logo; optional, shown small if present. */
  logoUrl: string | null;
  businessName: string;
  /** When true, shows the "Tap phone / NFC" block under the QR. */
  hasNfc: boolean;
  theme: CardTheme;
  className?: string;
}

/**
 * Card Template (see docs/cards-feature.md). Square (printed at 9×9 cm). Fixed
 * copy; the only personalised input is the logo. `theme` swaps the base/panel
 * colours; `hasNfc` toggles the tap block. Design is approximate — to be refined.
 */
export function CardTemplate({ qrUrl, logoUrl, businessName, hasNfc, theme, className }: Props) {
  const t = THEMES[theme];

  return (
    <div
      className={cn("aspect-square w-full p-3", className)}
      style={{ backgroundColor: t.base }}
    >
      <div
        className="flex h-full w-full gap-4 rounded-md border p-5"
        style={{ borderColor: t.baseText }}
      >
        {/* ── Left: message + steps ─────────────────────────────── */}
        <div className="flex flex-1 flex-col justify-between py-1">
          <div className="space-y-3">
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={businessName} className="h-7 w-auto object-contain" />
            )}
            <h2 className="text-[2.6rem] font-extrabold leading-[0.92] tracking-tight">
              <span className="block" style={{ color: t.headlineA }}>
                Loved it?
              </span>
              <span className="block" style={{ color: t.headlineB }}>
                Say it louder.
              </span>
            </h2>
            <p
              className="max-w-[20ch] text-base font-semibold leading-snug"
              style={{ color: t.baseText }}
            >
              Your honest feedback takes only 30 seconds.
            </p>
          </div>

          <ol className="space-y-3">
            {STEPS.map((label, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ backgroundColor: t.numberBg, color: t.numberFg }}
                >
                  {i + 1}
                </span>
                <span
                  className="text-sm font-medium leading-tight"
                  style={{ color: t.baseText }}
                >
                  {label}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* ── Right: rounded QR / NFC panel ─────────────────────── */}
        <div
          className="flex w-[38%] flex-col items-center justify-between rounded-3xl px-4 py-6"
          style={{ backgroundColor: t.panel, color: t.panelText }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest">Scan code</p>

          <div className="rounded-lg bg-white p-2">
            <QRCode value={qrUrl} size={120} bgColor="#ffffff" fgColor="#000000" level="M" />
          </div>

          {hasNfc ? (
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-[10px] font-bold uppercase leading-tight tracking-wider">
                Tap phone.
                <br />
                Hold near card
              </p>
              <Nfc className="size-8" strokeWidth={1.5} />
            </div>
          ) : (
            <span />
          )}

          <p className="text-[9px] font-semibold uppercase tracking-wider opacity-80">
            Powered by <span className="font-extrabold normal-case">Jugnoo</span>
          </p>
        </div>
      </div>
    </div>
  );
}
