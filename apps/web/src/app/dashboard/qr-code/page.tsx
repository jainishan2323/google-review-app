import { prisma } from "@repo/db";
import { Separator } from "@/components/ui/separator";
import { QrCodeCard } from "@/components/QrCodeCard";

// Dev: use the seeded business. Replace with session.user.businessId when auth is active.
const DEV_BUSINESS_ID = process.env.DEV_BUSINESS_ID ?? "cmp7n349t0002rhz58a4hinnt";
const FORM_BASE_URL =
  process.env.NEXT_PUBLIC_FORM_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://feedback.jugnoo.olbaid.de"
    : "http://localhost:3001");

export default async function QrCodePage() {
  const business = await prisma.business.findUnique({
    where: { id: DEV_BUSINESS_ID },
    select: { name: true },
  });

  return (
    <main className="p-8 space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          QR Code
        </h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Customize and print the QR code customers scan to leave a review for{" "}
          {business?.name ?? "your business"}.
        </p>
      </div>

      <Separator />

      <QrCodeCard formUrl={`${FORM_BASE_URL}/${DEV_BUSINESS_ID}`} />
    </main>
  );
}
