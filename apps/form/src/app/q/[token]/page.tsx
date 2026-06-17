import { redirect } from "next/navigation";
import { prisma, normaliseToken } from "@repo/db";

// Token resolver for counter-card QR codes (ADR 0015). The QR encodes /q/{token};
// we resolve the token to its assigned business and redirect to that business's
// form, carrying ?src=qr&token= for client-side/GA analytics (NOT persisted).
//
// Must always be dynamic — the token→business mapping changes on reassign/retire,
// so a cached resolution could serve a stale or wrong business.
export const revalidate = 0;

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function ResolveTokenPage({ params }: PageProps) {
  const { token: raw } = await params;
  const token = normaliseToken(raw);

  const qr = await prisma.qrCode.findUnique({ where: { token } });

  // Assigned → hand off to the business form. Relative + same-origin (this route
  // lives in the form app). The token rides the URL for GA only.
  if (qr?.status === "assigned" && qr.businessId) {
    redirect(`/${qr.businessId}?src=qr&token=${token}`);
  }

  // Retired → its own neutral message.
  if (qr?.status === "retired") {
    return <NeutralPage token={token} retired />;
  }

  // Unassigned OR unknown token → identical page. Unknown is NOT a distinct 404,
  // so the resolver can't be probed to discover which codes exist (ADR 0015).
  return <NeutralPage token={token} />;
}

function NeutralPage({ token, retired = false }: { token: string; retired?: boolean }) {
  // TODO(copy): owner-supplied wording — placeholders for now (ADR 0015).
  const heading = retired ? "This card is no longer active" : "This card isn't active yet";
  const body = retired
    ? "It used to point to a business but has since been retired."
    : "If you just received it, check back soon.";

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-lg font-semibold text-foreground">{heading}</h1>
      <p className="max-w-xs text-sm text-muted-foreground">{body}</p>
      <p className="text-xs text-muted-foreground/70">
        Card <span className="font-mono font-medium">{token}</span>
      </p>
    </div>
  );
}
