import { prisma } from "@repo/db";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const EMOJI: Record<number, string> = { 1: "😞", 2: "😐", 3: "🙂", 4: "😃", 5: "🤩" };

type SearchParams = Promise<{ businessId?: string }>;

export default async function AppFeedbackPage({ searchParams }: { searchParams: SearchParams }) {
  const { businessId } = await searchParams;

  const businesses = await prisma.business.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const where = businessId ? { businessId } : {};

  const [total, aggResult, byRating, recent] = await Promise.all([
    prisma.appFeedback.count({ where }),
    prisma.appFeedback.aggregate({ where, _avg: { rating: true } }),
    prisma.appFeedback.groupBy({
      by: ["rating"],
      where,
      _count: { id: true },
      orderBy: { rating: "asc" },
    }),
    prisma.appFeedback.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, createdAt: true, rating: true, businessId: true },
    }),
  ]);

  const avgRating = aggResult._avg.rating;
  const distMap = byRating.reduce(
    (acc, g) => ({ ...acc, [g.rating]: g._count.id }),
    {} as Record<number, number>
  );

  const businessNameMap = Object.fromEntries(businesses.map((b) => [b.id, b.name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">App Feedback</h1>
        <p className="text-sm text-muted-foreground mt-1">
          How users rate their experience with the Jugnoo form
        </p>
      </div>

      {/* Business filter */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard/app-feedback"
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            !businessId
              ? "border-primary bg-primary/15 text-primary"
              : "border-border text-muted-foreground hover:text-foreground"
          )}
        >
          All businesses
        </Link>
        {businesses.map((b) => (
          <Link
            key={b.id}
            href={`/dashboard/app-feedback?businessId=${b.id}`}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              businessId === b.id
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {b.name}
          </Link>
        ))}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-3xl font-bold text-foreground">{total}</p>
          <p className="text-xs text-muted-foreground mt-1">Ratings collected</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-3xl font-bold text-foreground">
            {avgRating !== null ? avgRating.toFixed(1) : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Average rating</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 col-span-2 sm:col-span-1">
          <p className="text-3xl font-bold text-foreground">
            {avgRating !== null ? EMOJI[Math.round(avgRating)] : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Overall sentiment</p>
        </div>
      </div>

      {/* Rating distribution */}
      {total > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <p className="text-sm font-medium text-foreground">Rating distribution</p>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((r) => {
              const count = distMap[r] ?? 0;
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={r} className="flex items-center gap-3">
                  <span className="w-6 text-base">{EMOJI[r]}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent entries */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Recent (last 50)</p>
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rating</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Business</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((entry, i) => (
                <tr key={entry.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                  <td className="px-4 py-2.5 text-lg">
                    {EMOJI[entry.rating]}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">
                    {entry.businessId ? (businessNameMap[entry.businessId] ?? entry.businessId) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {entry.createdAt.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                    No app feedback collected yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
