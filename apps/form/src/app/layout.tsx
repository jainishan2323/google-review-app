import type { Metadata, Viewport } from "next";
import { Nunito_Sans } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { cn } from "@/lib/utils";

// display:swap shows a metric-adjusted fallback immediately (next/font keeps
// adjustFontFallback on by default), so the welcome text paints with the rest of
// the first screen instead of popping in after the web font downloads.
const nunitoSans = Nunito_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "Leave a Review",
  description: "Share your experience",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // We ship our own en/de switcher (ADR 0021), so browser auto-translation is both
    // redundant and harmful — it would re-translate the AI draft the customer pastes into
    // Google, and fights our own resolution. Opt out of it page-wide: `translate="no"` +
    // `notranslate` (the HTML5 standard, honoured by Chrome/Safari/Firefox) and the Google
    // meta that suppresses Chrome's translate prompt. There's no reliable way to *detect*
    // translation at runtime, so we prevent it instead.
    <html lang="en" translate="no" className={cn("font-sans notranslate", nunitoSans.variable)}>
      <head>
        <meta name="google" content="notranslate" />
        {/* Warm the connection to Google's review host — the handoff target for 4-5★. */}
        <link rel="preconnect" href="https://search.google.com" />
      </head>
      <body className="bg-background">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
