import { prisma } from "@repo/db";
import { OnboardBusinessForm } from "@/components/onboard-business-form";
import { ReseedFormButton } from "@/components/reseed-form-button";
import { CopyBusinessId } from "@/components/copy-business-id";

export const dynamic = "force-dynamic";

const RATING_EMOJI: Record<number, string> = { 1: "😞", 2: "😐", 3: "🙂", 4: "😃", 5: "🤩" };

export default async function BusinessesPage() {
  const businesses = await prisma.business.findMany({
    select: {
      id: true,
      name: true,
      createdAt: true,
      // Presence of a FormConfig = the business has a feedback form seeded.
      formConfig: { select: { id: true } },
      // `owner.name` is only filled in once the owner has actually signed in,
      // so it doubles as a "has logged in yet?" signal.
      owner: { select: { email: true, name: true } },
    },
    orderBy: { name: "asc" },
  });

  const feedbackBySource = await prisma.anonymousFeedback.groupBy({
    by: ["businessId", "source"],
    _count: { id: true },
  });

  const feedbackByRating = await prisma.anonymousFeedback.groupBy({
    by: ["businessId", "rating"],
    _count: { id: true },
    orderBy: { rating: "asc" },
  });

  const stats = businesses.map((b) => {
    const sourceGroups = feedbackBySource.filter((g) => g.businessId === b.id);
    const total = sourceGroups.reduce((sum, g) => sum + g._count.id, 0);
    const privateCount = sourceGroups.find((g) => g.source === "private")?._count.id ?? 0;
    const googleCount = sourceGroups.find((g) => g.source === "google_redirect")?._count.id ?? 0;

    const ratingGroups = feedbackByRating.filter((g) => g.businessId === b.id);
    const sumRating = ratingGroups.reduce((sum, g) => sum + g.rating * g._count.id, 0);
    const avgRating = total > 0 ? sumRating / total : null;

    const ratingDist = ratingGroups.reduce(
      (acc, g) => ({ ...acc, [g.rating]: g._count.id }),
      {} as Record<number, number>
    );

    return { ...b, total, privateCount, googleCount, avgRating, ratingDist };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Businesses</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {businesses.length} onboarded {businesses.length === 1 ? "business" : "businesses"}
        </p>
      </div>

      <OnboardBusinessForm />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((b) => (
          <div key={b.id} className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div>
              <p className="font-semibold text-foreground">{b.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{b.owner.email}</p>
              <CopyBusinessId businessId={b.id} />
              <div className="mt-1.5 flex items-center gap-2">
                <span
                  className={
                    b.owner.name
                      ? "rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700"
                      : "rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700"
                  }
                >
                  {b.owner.name ? "Signed in" : "Awaiting first sign-in"}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Since {b.createdAt.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-bold text-foreground">{b.total}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{b.privateCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Private</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{b.googleCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">→ Google</p>
              </div>
            </div>

            {b.avgRating !== null && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Avg rating</span>
                  <span className="font-medium text-foreground">{b.avgRating.toFixed(1)} / 5</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((r) => {
                    const count = b.ratingDist[r] ?? 0;
                    const pct = b.total > 0 ? (count / b.total) * 100 : 0;
                    return (
                      <div key={r} className="flex-1 space-y-1">
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-center text-xs leading-none">{RATING_EMOJI[r]}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {b.total === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">No feedback yet</p>
            )}

            {!b.formConfig && (
              <div className="border-t border-border pt-3">
                <p className="mb-1.5 text-[11px] text-amber-700">No feedback form yet.</p>
                <ReseedFormButton businessId={b.id} />
              </div>
            )}
          </div>
        ))}

        {businesses.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center py-12">
            No businesses connected yet.
          </p>
        )}
      </div>
    </div>
  );
}
