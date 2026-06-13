"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Package, Nfc } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { injectCard } from "@/lib/inject-card";
import { createPrintOrder } from "@/actions/createPrintOrder";

const MAX_QUANTITY = 5; // paper + NFC share this pool (see docs/cards-feature.md)

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "de", label: "Deutsch" },
] as const;
type Language = (typeof LANGUAGES)[number]["value"];

/** Stable key matching the server-side filename map (card-templates.ts). */
function variantKey(hasNfc: boolean, language: Language): string {
  return `${hasNfc ? "qr_nfc" : "qr_only"}_${language}`;
}

interface Props {
  businessId: string;
  businessName: string;
  /** Raw Card Template SVGs keyed by variant (e.g. "qr_only_en"); missing = not yet delivered. */
  templates: Record<string, string>;
  /** Generated QR as a standalone `<svg>` string, encoding the business form URL. */
  qrSvg: string;
  /** Logo from FormConfig, used as the default. */
  defaultLogoUrl: string;
  /** Business's configured form language — pre-selects the matching card language. */
  defaultLanguage: Language;
}

export function CardStudio({
  businessId,
  businessName,
  templates,
  qrSvg,
  defaultLogoUrl,
  defaultLanguage,
}: Props) {
  const [logoUrl, setLogoUrl] = useState(defaultLogoUrl);
  const [language, setLanguage] = useState<Language>(defaultLanguage);
  const [hasNfc, setHasNfc] = useState(false);
  const [quantity, setQuantity] = useState(2);
  const [isOrdering, startOrder] = useTransition();

  // injectCard uses DOMParser (browser-only). Gate on a post-mount flag so the
  // hydration render matches the server (both show the skeleton), then swap in
  // the composed SVG — avoids a hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const rawTemplate = templates[variantKey(hasNfc, language)];

  const composedSvg = useMemo(() => {
    if (!mounted || !rawTemplate) return null;
    return injectCard(rawTemplate, { qrSvg, logoUrl: logoUrl.trim() || null });
  }, [mounted, rawTemplate, qrSvg, logoUrl]);

  function handleOrder() {
    startOrder(async () => {
      const res = await createPrintOrder({
        businessId,
        quantity,
        hasNfc,
        language,
        logoUrl: logoUrl.trim(),
      });
      if (res.ok) {
        toast.success(
          `Print order placed — ${quantity} ${hasNfc ? "NFC" : "QR"} card${quantity > 1 ? "s" : ""}. We'll be in touch to arrange delivery.`
        );
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_minmax(320px,420px)]">
      {/* ── Preview (the real print artwork, QR + logo injected) ──── */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Preview</p>
        <div className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl shadow-sm ring-1 ring-border">
          {composedSvg ? (
            <div
              className="[&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: composedSvg }}
            />
          ) : rawTemplate ? (
            // Pre-hydration (SSR) — brief square skeleton until the client injects.
            <div className="aspect-square w-full animate-pulse bg-muted" />
          ) : (
            <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 bg-muted/40 p-6 text-center">
              <p className="text-sm font-medium text-foreground">Template coming soon</p>
              <p className="text-xs text-muted-foreground">
                The {LANGUAGES.find((l) => l.value === language)?.label}{" "}
                {hasNfc ? "QR + NFC" : "QR-only"} card artwork isn&apos;t available yet.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Controls ────────────────────────────────────────────── */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">Customize your card</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Language */}
          <div className="space-y-2">
            <Label>Language</Label>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLanguage(opt.value)}
                  className={cn(
                    "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                    language === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Logo */}
          <div className="space-y-2">
            <Label htmlFor="card-logo">Logo URL</Label>
            <Input
              id="card-logo"
              type="url"
              inputMode="url"
              placeholder="https://…/logo.png"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Defaults to your form logo. Leave blank to show only the Jugnoo mark.
            </p>
          </div>

          {/* NFC toggle */}
          <div className="space-y-2">
            <Label>Card type</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setHasNfc(false)}
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                  !hasNfc
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                QR only
              </button>
              <button
                type="button"
                onClick={() => setHasNfc(true)}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                  hasNfc
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <Nfc className="size-4" />
                QR + NFC
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {hasNfc
                ? "NFC cards are made to order — they can't be self-printed."
                : "QR-only cards carry just the scan code."}
            </p>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label>Quantity to order</Label>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: MAX_QUANTITY }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQuantity(n)}
                  className={cn(
                    "h-10 w-10 rounded-lg border text-sm font-medium transition-colors",
                    quantity === n
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Up to {MAX_QUANTITY} cards per order — free during the pilot.
            </p>
          </div>

          {/* Action */}
          <div className="border-t pt-5">
            <Button
              type="button"
              onClick={handleOrder}
              disabled={isOrdering}
              className="w-full gap-2"
            >
              {isOrdering ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Package className="size-4" />
              )}
              Send to print {quantity > 0 && `(${quantity})`}
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              We print &amp; ship your cards and reach out to arrange delivery.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
