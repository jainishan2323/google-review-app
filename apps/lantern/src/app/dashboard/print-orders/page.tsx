import { prisma } from "@repo/db";
import { cn } from "@/lib/utils";
import { markPrintOrderFulfilled } from "@/actions/printOrders";

export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function PrintOrdersPage() {
  const orders = await prisma.printOrder.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { business: { select: { name: true } } },
  });

  const pending = orders.filter((o) => o.status === "pending").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Print Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Physical review cards businesses have requested. Mark fulfilled once printed &amp; shipped.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-3xl font-bold text-foreground">{pending}</p>
          <p className="text-xs text-muted-foreground mt-1">Pending</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-3xl font-bold text-foreground">{orders.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Total orders</p>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Business</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Language</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Qty</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ordered</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o, i) => {
              const fulfilled = o.status === "fulfilled";
              return (
                <tr key={o.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                  <td className="px-4 py-2.5 font-medium text-foreground">
                    {o.business?.name ?? o.businessId}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {o.hasNfc ? "QR + NFC" : "QR only"}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground uppercase">{o.language}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{o.quantity}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">
                    {formatDate(o.createdAt)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        fulfilled
                          ? "bg-green-500/15 text-green-600"
                          : "bg-amber-500/15 text-amber-600"
                      )}
                    >
                      {fulfilled ? "Fulfilled" : "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {fulfilled ? (
                      <span className="text-xs text-muted-foreground">
                        {o.fulfilledAt ? formatDate(o.fulfilledAt) : "—"}
                      </span>
                    ) : (
                      <form action={markPrintOrderFulfilled}>
                        <input type="hidden" name="id" value={o.id} />
                        <button
                          type="submit"
                          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                        >
                          Mark fulfilled
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No print orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
