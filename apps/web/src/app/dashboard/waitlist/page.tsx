import { prisma } from "@repo/db";

export default async function WaitlistPage() {
  const entries = await prisma.waitlistEntry.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Pilot Waitlist</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {entries.length} {entries.length === 1 ? "signup" : "signups"} so far
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No signups yet.</p>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Message</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Signed up</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr key={entry.id} className={i < entries.length - 1 ? "border-b border-border" : ""}>
                  <td className="px-4 py-3 font-medium">{entry.email}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs">
                    {entry.message ?? <span className="text-muted-foreground/40 italic">none</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {entry.createdAt.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
