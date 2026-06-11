import { prisma } from "@repo/db";
import { Separator } from "@/components/ui/separator";
import { FormConfigEditor } from "@/components/FormConfigEditor";
import { SeedStarterFormButton } from "@/components/SeedStarterFormButton";
import { requireCurrentBusiness } from "@/lib/current-business";

export const dynamic = "force-dynamic";

export default async function FeedbackSettingsPage() {
  const business = await requireCurrentBusiness();
  const [existingConfig, reviews, feedback] = await Promise.all([
    prisma.formConfig.findUnique({
      where: { businessId: business.id },
      include: {
        categories: {
          orderBy: { order: "asc" },
          // The editor manages active chips only; deactivated ones are left untouched.
          include: { tags: { where: { active: true }, orderBy: { order: "asc" } } },
        },
      },
    }),
    prisma.review.findMany({ where: { businessId: business.id }, select: { tags: true, negativeTags: true } }),
    prisma.anonymousFeedback.findMany({ where: { businessId: business.id }, select: { tags: true, negativeTags: true } }),
  ]);

  // A chip is permanently deletable only if it's < 7 days old AND no feedback references it.
  const referenced = new Set<string>();
  for (const r of [...reviews, ...feedback]) {
    for (const id of r.tags) referenced.add(id);
    for (const id of r.negativeTags) referenced.add(id);
  }
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const isDeletable = (id: string, createdAt: Date) =>
    Date.now() - createdAt.getTime() < WEEK_MS && !referenced.has(id);

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
            welcomeMessage: (existingConfig.welcomeMessage ?? {}) as Record<string, string>,
            categories: existingConfig.categories.map((c) => ({
              id: c.id,
              labels: (c.labels ?? {}) as Record<string, string>,
              tags: c.tags.map((t) => ({
                id: t.id,
                labels: (t.labels ?? {}) as Record<string, string>,
                polarity: t.polarity,
                active: t.active,
                order: t.order,
                deletable: isDeletable(t.id, t.createdAt),
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
