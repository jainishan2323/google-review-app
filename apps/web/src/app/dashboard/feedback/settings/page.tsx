import { prisma } from "@repo/db";
import { Separator } from "@/components/ui/separator";
import { FormConfigEditor } from "@/components/FormConfigEditor";
import { requireCurrentBusiness } from "@/lib/current-business";

export const dynamic = "force-dynamic";

export default async function FeedbackSettingsPage() {
  const business = await requireCurrentBusiness();
  const existingConfig = await prisma.formConfig.findUnique({
    where: { businessId: business.id },
    include: { categories: { orderBy: { order: "asc" } } },
  });

  return (
    <main className="p-8 space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Feedback Settings
        </h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Customize the feedback form your customers see — {business.name}.
        </p>
      </div>

      <Separator />

      <FormConfigEditor
        businessId={business.id}
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
    </main>
  );
}
