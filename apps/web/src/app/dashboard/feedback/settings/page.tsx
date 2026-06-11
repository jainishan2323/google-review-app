import { prisma } from "@repo/db";
import { Separator } from "@/components/ui/separator";
import { FormConfigEditor } from "@/components/FormConfigEditor";
import { SeedStarterFormButton } from "@/components/SeedStarterFormButton";
import { requireCurrentBusiness } from "@/lib/current-business";

export const dynamic = "force-dynamic";

export default async function FeedbackSettingsPage() {
  const business = await requireCurrentBusiness();
  const existingConfig = await prisma.formConfig.findUnique({
    where: { businessId: business.id },
    include: {
      categories: {
        orderBy: { order: "asc" },
        include: { tags: { orderBy: { order: "asc" } } },
      },
    },
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

      {existingConfig ? (
        <FormConfigEditor
          businessId={business.id}
          defaultLanguage={existingConfig.defaultLanguage}
          supportedLanguages={
            existingConfig.supportedLanguages.length > 0
              ? existingConfig.supportedLanguages
              : [existingConfig.defaultLanguage]
          }
          defaultValues={{
            brandColor: existingConfig.brandColor,
            logoUrl: existingConfig.logoUrl ?? "",
            welcomeMessage: existingConfig.welcomeMessage,
            categories: existingConfig.categories.map((c) => ({
              id: c.id,
              labels: (c.labels ?? {}) as Record<string, string>,
              tags: c.tags.map((t) => ({
                id: t.id,
                labels: (t.labels ?? {}) as Record<string, string>,
                polarity: t.polarity,
                active: t.active,
              })),
            })),
          }}
        />
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            No feedback form is configured for this business yet. Create one from the starter
            template for your business type — you can edit the wording and chips afterward.
          </p>
          <SeedStarterFormButton />
        </div>
      )}
    </main>
  );
}
