import { prisma } from "@repo/db";
import { Separator } from "@/components/ui/separator";
import { CardStudio } from "@/components/cards/CardStudio";
import { ComingSoon } from "@/components/ComingSoon";
import { requireCurrentBusiness } from "@/lib/current-business";
import { loadCardTemplates } from "@/lib/card-templates";
import { buildQrSvg } from "@/lib/qr-svg";

export const dynamic = "force-dynamic";

const FORM_BASE_URL =
  process.env.NEXT_PUBLIC_FORM_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://feedback.jugnoo.de"
    : "http://localhost:3001");

// Feature flag: the full card studio (template, theme switch, NFC, "send to print")
// is gated off by default for the pilot — print output isn't production-ready yet and
// orders are fulfilled manually. See docs/adr/0002-card-print-deferred-behind-flag.md.
const CARDS_STUDIO_ENABLED = process.env.NEXT_PUBLIC_CARDS_STUDIO === "true";

// The Print shop (ordering branded / NFC cards) is parked as "coming soon" for the
// pilot regardless of the studio flag above — we show an honest placeholder, same as
// Reviews/Analytics did pre-Google. The full CardStudio path below is preserved
// intact and re-lights the moment this is flipped on.
const PRINT_SHOP_ENABLED = process.env.NEXT_PUBLIC_PRINT_SHOP === "true";

export default async function CardsPage() {
  if (!PRINT_SHOP_ENABLED) {
    return (
      <ComingSoon
        title="Print shop"
        description="Branded review cards — table tents, stickers, and tap-to-review NFC — designed, printed, and shipped to your door. We're putting the finishing touches on it. In the meantime, download your QR code from QR settings to print your own."
      />
    );
  }

  const business = await requireCurrentBusiness();
  const formConfig = await prisma.formConfig.findUnique({
    where: { businessId: business.id },
    select: { logoUrl: true, defaultLanguage: true },
  });

  // QR is identical across all variants — it encodes the business form URL only.
  const qrSvg = CARDS_STUDIO_ENABLED
    ? buildQrSvg(`${FORM_BASE_URL}/${business.id}?src=qr`)
    : "";
  const templates = CARDS_STUDIO_ENABLED ? await loadCardTemplates() : {};
  const defaultLanguage = formConfig?.defaultLanguage === "de" ? "de" : "en";

  // One active (unfulfilled) order at a time (ADR 0012). When one exists the
  // studio shows an "under processing" summary instead of the builder.
  const activeOrder = CARDS_STUDIO_ENABLED
    ? await prisma.printOrder.findFirst({
        where: { businessId: business.id, status: "pending" },
        orderBy: { createdAt: "desc" },
        select: {
          createdAt: true,
          // Legacy (pre-ADR-0012) rows carry the variant on these flat columns.
          quantity: true,
          hasNfc: true,
          language: true,
          items: { select: { hasNfc: true, language: true, quantity: true } },
        },
      })
    : null;

  return (
    <main className="mx-auto p-8 space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Print shop
        </h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Customize your review card, print it yourself, or order physical cards for {business.name}.
        </p>
      </div>

      <Separator />

      <CardStudio
        businessId={business.id}
        businessName={business.name}
        templates={templates}
        availableVariants={Object.keys(templates)}
        qrSvg={qrSvg}
        formUrl={`${FORM_BASE_URL}/${business.id}?src=qr`}
        defaultLogoUrl={formConfig?.logoUrl ?? ""}
        defaultLanguage={defaultLanguage}
        activeOrder={
          activeOrder
            ? {
                createdAt: activeOrder.createdAt.toISOString(),
                // New orders carry line items; legacy rows fall back to the flat columns.
                items: (activeOrder.items.length > 0
                  ? activeOrder.items
                  : [
                      {
                        hasNfc: activeOrder.hasNfc,
                        language: activeOrder.language,
                        quantity: activeOrder.quantity,
                      },
                    ]
                ).map((i) => ({
                  hasNfc: i.hasNfc,
                  language: i.language === "de" ? "de" : "en",
                  quantity: i.quantity,
                })),
              }
            : null
        }
      />
    </main>
  );
}
