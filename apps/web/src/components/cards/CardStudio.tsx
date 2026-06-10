"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Printer, Package, Nfc } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CardTemplate, type CardTheme } from "@/components/cards/CardTemplate";
import { createPrintOrder } from "@/actions/createPrintOrder";

const MAX_QUANTITY = 5; // paper + NFC share this pool (see docs/cards-feature.md)

// Print only the card: hide everything else, center it at the physical 9×9 cm size.
const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #jugnoo-print-area, #jugnoo-print-area * { visibility: visible !important; }
  #jugnoo-print-area { position: fixed; inset: 0; margin: 0; display: flex; align-items: center; justify-content: center; }
  #jugnoo-print-card { width: 90mm; height: 90mm; }
}
`;

const THEME_OPTIONS: { value: CardTheme; label: string }[] = [
  { value: "green-black", label: "Green / Black" },
  { value: "black-green", label: "Black / Green" },
];

interface Props {
  businessId: string;
  businessName: string;
  /** Base form URL with no query string, e.g. https://feedback.jugnoo.olbaid.de/{id} */
  formUrlBase: string;
  /** Logo from FormConfig, used as the default. */
  defaultLogoUrl: string;
}

export function CardStudio({ businessId, businessName, formUrlBase, defaultLogoUrl }: Props) {
  const [logoUrl, setLogoUrl] = useState(defaultLogoUrl);
  const [theme, setTheme] = useState<CardTheme>("green-black");
  const [hasNfc, setHasNfc] = useState(false);
  const [quantity, setQuantity] = useState(2);
  const [isOrdering, startOrder] = useTransition();

  // The QR is always scanned, so it always carries ?src=qr. The NFC tag (encoded
  // during fulfilment) carries ?src=nfc — it is physical, not rendered here.
  const qrUrl = `${formUrlBase}?src=qr`;

  // NFC cards can't be self-printed — the tag must be physically encoded (ADR/spec).
  const canSelfPrint = !hasNfc;

  function handlePrint() {
    if (!canSelfPrint) return;
    window.print();
  }

  function handleOrder() {
    startOrder(async () => {
      const res = await createPrintOrder({
        businessId,
        quantity,
        hasNfc,
        theme,
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
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      {/* ── Preview (also the print target) ─────────────────────── */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Preview</p>
        <div id="jugnoo-print-area">
          <div id="jugnoo-print-card" className="mx-auto w-full max-w-xl shadow-sm ring-1 ring-border rounded-2xl">
            <CardTemplate
              qrUrl={qrUrl}
              logoUrl={logoUrl.trim() || null}
              businessName={businessName}
              hasNfc={hasNfc}
              theme={theme}
            />
          </div>
        </div>
      </div>

      {/* ── Controls ────────────────────────────────────────────── */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">Customize your card</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme */}
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="grid grid-cols-2 gap-2">
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTheme(opt.value)}
                  className={cn(
                    "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                    theme === opt.value
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
              Defaults to your form logo. Leave blank to show your business name instead.
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
                : "QR-only cards can be printed yourself or ordered."}
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

          {/* Actions */}
          <div className="space-y-3 border-t pt-5">
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

            <Button
              type="button"
              variant="outline"
              onClick={handlePrint}
              disabled={!canSelfPrint}
              className="w-full gap-2"
            >
              <Printer className="size-4" />
              {canSelfPrint ? "Print it yourself" : "Print yourself (QR-only)"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
