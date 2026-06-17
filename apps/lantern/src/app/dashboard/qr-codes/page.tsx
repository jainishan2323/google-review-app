import { prisma, type Prisma } from "@repo/db";
import { cn } from "@/lib/utils";
import { buildQrSvg } from "@/lib/qr-svg";
import { AssignTokensForm } from "@/components/assign-tokens-form";
import { QrPreviewButton } from "@/components/qr-preview-button";
import { mintBatch, unassignToken, retireToken, restoreToken } from "@/actions/qrCodes";

// Base URL the QR encodes — same resolver the form app serves at /q/{token}.
const FORM_BASE_URL = (
  process.env.NEXT_PUBLIC_FORM_URL ?? "https://feedback.jugnoo.olbaid.de"
).replace(/\/$/, "");

// Token-card management home (ADR 0015): mint stock, assign on-site, retire,
// download each token's QR as SVG. The token→business mapping is resolved by the
// form app at /q/{token}.
export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  unassigned: "bg-amber-500/15 text-amber-600",
  assigned: "bg-green-500/15 text-green-600",
  retired: "bg-muted text-muted-foreground",
};

function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

interface PageProps {
  searchParams: Promise<{ status?: string; business?: string }>;
}

export default async function QrCodesPage({ searchParams }: PageProps) {
  const { status, business } = await searchParams;

  const where: Prisma.QrCodeWhereInput = {};
  if (status === "unassigned" || status === "assigned" || status === "retired") {
    where.status = status;
  }
  if (business) where.businessId = business;

  const [tokens, businesses, counts] = await Promise.all([
    prisma.qrCode.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: { business: { select: { name: true } } },
      take: 500,
    }),
    prisma.business.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.qrCode.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const countOf = (s: string) => counts.find((c) => c.status === s)?._count._all ?? 0;
  const total = counts.reduce((sum, c) => sum + c._count._all, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">QR Codes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Token cards: mint generic stock, assign to businesses on-site, retire. Each card&apos;s
          QR resolves through <span className="font-mono">/q/&#123;token&#125;</span>.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total", value: total },
          { label: "Unassigned", value: countOf("unassigned") },
          { label: "Assigned", value: countOf("assigned") },
          { label: "Retired", value: countOf("retired") },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-3xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Mint */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="font-semibold text-foreground">Mint batch</h2>
          <form action={mintBatch} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Quantity</label>
              <input
                type="number"
                name="qty"
                min={1}
                max={500}
                defaultValue={20}
                required
                className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Batch label</label>
              <input
                type="text"
                name="batchLabel"
                placeholder="jun-stock"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Mint
            </button>
          </form>
          <p className="text-xs text-muted-foreground">
            Mints N unassigned tokens. Download each token&apos;s QR (Download SVG) and print
            manually for now — branded batch sheets are Phase 2.
          </p>
        </div>

        {/* Assign */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="font-semibold text-foreground">Assign cards</h2>
          <AssignTokensForm businesses={businesses} />
        </div>
      </div>

      {/* Filters */}
      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <select
            name="status"
            defaultValue={status ?? ""}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="unassigned">Unassigned</option>
            <option value="assigned">Assigned</option>
            <option value="retired">Retired</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Business</label>
          <select
            name="business"
            defaultValue={business ?? ""}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Filter
        </button>
      </form>

      {/* Tokens table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Code</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Business</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Batch</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Assigned</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((t, i) => (
              <tr key={t.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                <td className="px-4 py-2.5 font-mono font-medium text-foreground">{t.token}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      STATUS_STYLES[t.status] ?? "bg-muted text-muted-foreground",
                    )}
                  >
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{t.business?.name ?? "—"}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{t.batchLabel ?? "—"}</td>
                <td className="px-4 py-2.5 text-muted-foreground text-xs">
                  {t.assignedAt ? formatDate(t.assignedAt) : "—"}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-2">
                    <QrPreviewButton
                      token={t.token}
                      url={`${FORM_BASE_URL}/q/${t.token}`}
                      qrSvg={buildQrSvg(`${FORM_BASE_URL}/q/${t.token}`).replace(
                        "<svg ",
                        '<svg width="100%" height="100%" ',
                      )}
                    />
                    {t.status === "assigned" && (
                      <RowAction action={unassignToken} id={t.id} label="Unassign" />
                    )}
                    {t.status !== "retired" ? (
                      <RowAction action={retireToken} id={t.id} label="Retire" />
                    ) : (
                      <RowAction action={restoreToken} id={t.id} label="Restore" />
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {tokens.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No tokens yet. Mint a batch above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RowAction({
  action,
  id,
  label,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  label: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
      >
        {label}
      </button>
    </form>
  );
}
