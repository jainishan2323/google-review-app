"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Package, Nfc, Plus, Minus, Trash2, Clock, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { injectCard } from "@/lib/inject-card";
import { downloadPrintSheet } from "@/lib/print-sheet";
import { createPrintOrder } from "@/actions/createPrintOrder";
import { QrCodeCard } from "@/components/QrCodeCard";

const MAX_PER_ITEM = 6; // cap per variant line item (ADR 0012)

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "de", label: "Deutsch" },
] as const;
type Language = (typeof LANGUAGES)[number]["value"];

interface CartItem {
  hasNfc: boolean;
  language: Language;
  quantity: number;
}

/** Stable key matching the server-side filename map (card-templates.ts). */
function variantKey(hasNfc: boolean, language: Language): string {
  return `${hasNfc ? "qr_nfc" : "qr_only"}_${language}`;
}

function variantLabel(hasNfc: boolean, language: Language): string {
  const lang = LANGUAGES.find((l) => l.value === language)?.label ?? language;
  return `${hasNfc ? "QR + NFC" : "QR only"} · ${lang}`;
}

interface ActiveOrder {
  createdAt: string;
  items: CartItem[];
}

interface Props {
  businessId: string;
  businessName: string;
  /** Raw Card Template SVGs keyed by variant (e.g. "qr_only_en"); missing = not yet delivered. */
  templates: Record<string, string>;
  /** Variant keys whose template SVG exists — only these may be added to the cart. */
  availableVariants: string[];
  /** Generated QR as a standalone `<svg>` string, encoding the business form URL. */
  qrSvg: string;
  /** The business form URL the QR encodes — used by the standalone QR download. */
  formUrl: string;
  /** Logo from FormConfig, used as the default. */
  defaultLogoUrl: string;
  /** Business's configured form language — pre-selects the matching card language. */
  defaultLanguage: Language;
  /** The business's one in-flight order, if any — locks the studio while processing. */
  activeOrder: ActiveOrder | null;
}

export function CardStudio({
  businessId,
  templates,
  availableVariants,
  qrSvg,
  formUrl,
  defaultLogoUrl,
  defaultLanguage,
  activeOrder,
}: Props) {
  const router = useRouter();
  // The logo is the business's configured FormConfig logo; the toggle just
  // decides whether to print it (on by default when one is configured).
  const hasConfiguredLogo = defaultLogoUrl.trim().length > 0;
  const [useLogo, setUseLogo] = useState(hasConfiguredLogo);
  const logoUrl = useLogo ? defaultLogoUrl.trim() : "";
  const [language, setLanguage] = useState<Language>(defaultLanguage);
  const [hasNfc, setHasNfc] = useState(false);
  const [draftQty, setDraftQty] = useState(2);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOrdering, startOrder] = useTransition();
  const [isPrinting, setIsPrinting] = useState(false);

  // injectCard uses DOMParser (browser-only). Gate on a post-mount flag so the
  // hydration render matches the server (both show the skeleton), then swap in
  // the composed SVG — avoids a hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const currentKey = variantKey(hasNfc, language);
  const variantAvailable = availableVariants.includes(currentKey);
  const rawTemplate = templates[currentKey];

  const composedSvg = useMemo(() => {
    if (!mounted || !rawTemplate) return null;
    return injectCard(rawTemplate, { qrSvg, logoUrl: logoUrl.trim() || null });
  }, [mounted, rawTemplate, qrSvg, logoUrl]);

  const totalCards = cart.reduce((sum, i) => sum + i.quantity, 0);

  function addToCart() {
    if (!variantAvailable) return;
    setCart((prev) => {
      const existing = prev.find((i) => variantKey(i.hasNfc, i.language) === currentKey);
      if (existing) {
        const next = Math.min(existing.quantity + draftQty, MAX_PER_ITEM);
        if (next === existing.quantity) {
          toast.info(`Already at the max of ${MAX_PER_ITEM} for ${variantLabel(hasNfc, language)}.`);
        }
        return prev.map((i) =>
          variantKey(i.hasNfc, i.language) === currentKey ? { ...i, quantity: next } : i
        );
      }
      return [...prev, { hasNfc, language, quantity: draftQty }];
    });
  }

  function setItemQty(key: string, quantity: number) {
    setCart((prev) =>
      prev.map((i) =>
        variantKey(i.hasNfc, i.language) === key
          ? { ...i, quantity: Math.min(Math.max(quantity, 1), MAX_PER_ITEM) }
          : i
      )
    );
  }

  function removeItem(key: string) {
    setCart((prev) => prev.filter((i) => variantKey(i.hasNfc, i.language) !== key));
  }

  async function handlePrintSheet() {
    // Self-print is QR-only and needs an existing template (ADR 0013).
    if (hasNfc || !rawTemplate) return;
    setIsPrinting(true);
    try {
      await downloadPrintSheet({
        rawTemplate,
        qrSvg,
        fileName: `jugnoo-review-cards-${language}.pdf`,
      });
    } catch {
      toast.error("Couldn't generate the print sheet. Please try again.");
    } finally {
      setIsPrinting(false);
    }
  }

  function handleOrder() {
    if (cart.length === 0) return;
    startOrder(async () => {
      const res = await createPrintOrder({
        businessId,
        logoUrl: logoUrl.trim(),
        items: cart,
      });
      if (res.ok) {
        toast.success("Order sent to print — we'll be in touch to arrange delivery.");
        setCart([]);
        router.refresh(); // re-renders the page into the "under processing" state
      } else {
        toast.error(res.error);
      }
    });
  }

  // An order is in flight (ADR 0012): keep the studio visible (preview + controls)
  // but block re-ordering — surface a notification and disable "Send to print".
  const locked = !!activeOrder;
  const orderedOn = activeOrder
    ? new Date(activeOrder.createdAt).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";
  const orderedTotal = activeOrder?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  return (
    <div className="w-full space-y-8">
      {locked && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
          <Clock className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <div className="space-y-2 text-sm">
            <p className="font-medium text-foreground">Your order is being processed</p>
            <p className="text-muted-foreground">
              We&apos;re preparing the {orderedTotal} card{orderedTotal > 1 ? "s" : ""} you ordered
              on {orderedOn} and will reach out to arrange delivery. You can place a new order once
              this one ships — to change it before then, just reply to us.
            </p>
            <ul className="flex flex-wrap gap-2 pt-1">
              {activeOrder!.items.map((i) => (
                <li
                  key={variantKey(i.hasNfc, i.language)}
                  className="flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-background px-2.5 py-1 text-xs font-medium text-foreground"
                >
                  {i.hasNfc && <Nfc className="size-3.5" />}
                  {variantLabel(i.hasNfc, i.language)} ×{i.quantity}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ── Preview + controls, side by side ──────────────────────── */}
      <div className="grid gap-8 lg:grid-cols-[1fr_minmax(320px,420px)]">
        {/* Preview (the real print artwork, QR + logo injected) */}
        <div className="w-full self-start overflow-hidden rounded-2xl shadow-sm ring-1 ring-border">
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
                The {variantLabel(hasNfc, language)} card artwork isn&apos;t available yet.
              </p>
            </div>
          )}
        </div>

      {/* ── Controls + cart ───────────────────────────────────────── */}
      <div className="space-y-6">
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
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="card-logo">Show my logo</Label>
                <Switch
                  checked={useLogo}
                  onCheckedChange={setUseLogo}
                  disabled={!hasConfiguredLogo}
                  aria-label="Show my logo on the card"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {hasConfiguredLogo
                  ? "Uses your business logo on every card. Turn off to show only the Jugnoo mark."
                  : "Add a logo in your form settings to print it on your cards."}
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

            {/* Quantity for this variant */}
            <div className="space-y-2">
              <Label>Quantity</Label>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: MAX_PER_ITEM }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setDraftQty(n)}
                    className={cn(
                      "h-10 w-10 rounded-lg border text-sm font-medium transition-colors",
                      draftQty === n
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Add to cart */}
            <div className="space-y-2">
              <Button
                type="button"
                variant="secondary"
                onClick={addToCart}
                disabled={!variantAvailable}
                className="w-full gap-2"
              >
                <Plus className="size-4" />
                Add to order
              </Button>
              {!variantAvailable && (
                <p className="text-xs text-muted-foreground">
                  {variantLabel(hasNfc, language)} cards are coming soon — you can&apos;t order them
                  yet.
                </p>
              )}
            </div>

            {/* Print it yourself — QR-only self-serve sheet (ADR 0013) */}
            <div className="space-y-1.5 border-t pt-5">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrintSheet}
                disabled={hasNfc || !rawTemplate || isPrinting}
                className="w-full gap-2"
              >
                {isPrinting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Printer className="size-4" />
                )}
                Print it yourself (PDF)
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                {hasNfc
                  ? "NFC cards can't be self-printed — order them instead."
                  : "A4 sheet of 6 QR cards to cut out. Self-printed cards show the Jugnoo mark only — order cards to include your logo."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ── Cart ───────────────────────────────────────────────── */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">
              Your order {totalCards > 0 && `(${totalCards})`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Pick a card above and add it to your order. You can mix QR-only and NFC cards in
                different languages.
              </p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {cart.map((item) => {
                  const key = variantKey(item.hasNfc, item.language);
                  return (
                    <li key={key} className="flex items-center gap-3 px-3 py-2.5">
                      <span className="flex flex-1 items-center gap-1.5 text-sm font-medium text-foreground">
                        {item.hasNfc && <Nfc className="size-4 shrink-0" />}
                        {variantLabel(item.hasNfc, item.language)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => setItemQty(key, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="flex size-7 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm tabular-nums">{item.quantity}</span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => setItemQty(key, item.quantity + 1)}
                          disabled={item.quantity >= MAX_PER_ITEM}
                          className="flex size-7 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        aria-label="Remove"
                        onClick={() => removeItem(key)}
                        className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="border-t pt-4">
              <Button
                type="button"
                onClick={handleOrder}
                disabled={isOrdering || cart.length === 0 || locked}
                className="w-full gap-2"
              >
                {isOrdering ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Package className="size-4" />
                )}
                Send to print {totalCards > 0 && `(${totalCards})`}
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                {locked
                  ? "Ordering is paused while your current order is being processed."
                  : "We print & ship your cards and reach out to arrange delivery."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>

      {/* ── Standalone QR download (SVG / PNG), centered below ─────── */}
      <div className="h-px w-full bg-border" role="separator" />
      <div className="mx-auto w-full max-w-md">
        <QrCodeCard formUrl={formUrl} />
      </div>
    </div>
  );
}
