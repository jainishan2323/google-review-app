import { prisma } from "@repo/db";
import { Separator } from "@/components/ui/separator";
import { CardStudio } from "@/components/cards/CardStudio";
import { QrCodeCard } from "@/components/QrCodeCard";

export const dynamic = "force-dynamic";

// Dev: use the seeded business. Replace with session.user.businessId when auth is active.
const DEV_BUSINESS_ID = process.env.DEV_BUSINESS_ID ?? "cmp7n349t0002rhz58a4hinnt";
const FORM_BASE_URL =
  process.env.NEXT_PUBLIC_FORM_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://feedback.jugnoo.olbaid.de"
    : "http://localhost:3001");

// Feature flag: the full card studio (template, theme switch, NFC, "send to print")
// is gated off by default for the pilot — print output isn't production-ready yet and
// orders are fulfilled manually. When off, the page falls back to the simple branded
// QR download. See docs/adr/0002-card-print-deferred-behind-flag.md.
const CARDS_STUDIO_ENABLED = process.env.NEXT_PUBLIC_CARDS_STUDIO === "true";

export default async function CardsPage() {
  const [business, formConfig] = await Promise.all([
    prisma.business.findUnique({ where: { id: DEV_BUSINESS_ID }, select: { name: true } }),
    prisma.formConfig.findUnique({
      where: { businessId: DEV_BUSINESS_ID },
      select: { logoUrl: true },
    }),
  ]);

  return (
    <main className="p-8 space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Review Cards
        </h1>
        <p className="text-sm mt-1 text-muted-foreground">
          {CARDS_STUDIO_ENABLED
            ? `Customize your review card, print it yourself, or order physical cards for ${business?.name ?? "your business"}.`
            : `Download your QR code to print on table tents, receipts, or stickers for ${business?.name ?? "your business"}.`}
        </p>
      </div>

      <Separator />

      {CARDS_STUDIO_ENABLED ? (
        <CardStudio
          businessId={DEV_BUSINESS_ID}
          businessName={business?.name ?? "Your business"}
          formUrlBase={`${FORM_BASE_URL}/${DEV_BUSINESS_ID}`}
          defaultLogoUrl={formConfig?.logoUrl ?? ""}
        />
      ) : (
        <QrCodeCard formUrl={`${FORM_BASE_URL}/${DEV_BUSINESS_ID}?src=qr`} />
      )}
    </main>
  );
}
