import { prisma } from "@repo/db";
import { Separator } from "@/components/ui/separator";
import { CardStudio } from "@/components/cards/CardStudio";
import { QrCodeCard } from "@/components/QrCodeCard";
import { requireCurrentBusiness } from "@/lib/current-business";

export const dynamic = "force-dynamic";

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
  const business = await requireCurrentBusiness();
  const formConfig = await prisma.formConfig.findUnique({
    where: { businessId: business.id },
    select: { logoUrl: true },
  });

  return (
    <main className="p-8 space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Review Cards
        </h1>
        <p className="text-sm mt-1 text-muted-foreground">
          {CARDS_STUDIO_ENABLED
            ? `Customize your review card, print it yourself, or order physical cards for ${business.name}.`
            : `Download your QR code to print on table tents, receipts, or stickers for ${business.name}.`}
        </p>
      </div>

      <Separator />

      {CARDS_STUDIO_ENABLED ? (
        <CardStudio
          businessId={business.id}
          businessName={business.name}
          formUrlBase={`${FORM_BASE_URL}/${business.id}`}
          defaultLogoUrl={formConfig?.logoUrl ?? ""}
        />
      ) : (
        <QrCodeCard formUrl={`${FORM_BASE_URL}/${business.id}?src=qr`} />
      )}
    </main>
  );
}
