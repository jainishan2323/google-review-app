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

function variantLabel(hasNfc: boolean, language: string) {
  return `${hasNfc ? "QR + NFC" : "QR only"} · ${language.toUpperCase()}`;
}

export default async function PrintOrdersPage() {
  const orders = await prisma.printOrder.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      business: { select: { name: true } },
      items: { select: { id: true, hasNfc: true, language: true, quantity: true } },
    },
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
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cards</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Total</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ordered</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o, i) => {
              const fulfilled = o.status === "fulfilled";
              // Legacy (pre-ADR-0012) rows carry the variant on the flat columns;
              // new orders carry one or more line items.
              const lines =
                o.items.length > 0
                  ? o.items
                  : [{ id: o.id, hasNfc: o.hasNfc, language: o.language, quantity: o.quantity }];
              const total = lines.reduce((sum, l) => sum + l.quantity, 0);
              return (
                <tr key={o.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                  <td className="px-4 py-2.5 font-medium text-foreground">
                    {o.business?.name ?? o.businessId}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    <ul className="space-y-0.5">
                      {lines.map((l) => (
                        <li key={l.id}>
                          {variantLabel(l.hasNfc, l.language)}{" "}
                          <span className="text-foreground">×{l.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-4 py-2.5 font-medium text-foreground">{total}</td>
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
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
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
