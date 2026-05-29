import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export default async function WaitlistPage() {
  const entries = await prisma.waitlistEntry.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Waitlist</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {entries.length} {entries.length === 1 ? "signup" : "signups"} total
        </p>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Message</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Source</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <tr
                key={entry.id}
                className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}
              >
                <td className="px-4 py-3 font-medium text-foreground">{entry.email}</td>
                <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                  {entry.message ?? <span className="text-muted-foreground/40">—</span>}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {entry.source}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {entry.createdAt.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No signups yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
