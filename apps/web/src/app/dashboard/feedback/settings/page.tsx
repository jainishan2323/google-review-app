import { prisma } from "@repo/db";
import { Separator } from "@/components/ui/separator";
import { FormConfigEditor } from "@/components/FormConfigEditor";
import { QrCodeCard } from "@/components/QrCodeCard";

// Dev: use the seeded business. Replace with session.user.businessId when auth is active.
const DEV_BUSINESS_ID = process.env.DEV_BUSINESS_ID ?? "cmp7n349t0002rhz58a4hinnt";
const FORM_BASE_URL = process.env.NEXT_PUBLIC_FORM_URL ?? "http://localhost:3001";

export default async function FeedbackSettingsPage() {
  const [business, existingConfig] = await Promise.all([
    prisma.business.findUnique({ where: { id: DEV_BUSINESS_ID }, select: { name: true } }),
    prisma.formConfig.findUnique({
      where: { businessId: DEV_BUSINESS_ID },
      include: { categories: { orderBy: { order: "asc" } } },
    }),
  ]);

  return (
    <main className="p-8 space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Feedback Settings
        </h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Customize the feedback form your customers see — {business?.name ?? "your business"}.
        </p>
      </div>

      <Separator />

      <FormConfigEditor
        businessId={DEV_BUSINESS_ID}
        defaultValues={
          existingConfig
            ? {
                brandColor: existingConfig.brandColor,
                logoUrl: existingConfig.logoUrl ?? "",
                welcomeMessage: existingConfig.welcomeMessage,
                categories: existingConfig.categories.map((c) => ({
                  name: c.name,
                  positiveChips: c.positiveChips,
                  negativeChips: c.negativeChips,
                })),
              }
            : undefined
        }
      />

      <Separator />

      <QrCodeCard formUrl={`${FORM_BASE_URL}/${DEV_BUSINESS_ID}`} />
    </main>
  );
}
