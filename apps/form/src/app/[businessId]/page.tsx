import { Suspense } from "react";
import ReviewForm from "@/components/ReviewForm";
import { FormSkeleton } from "@/components/FormSkeleton";
import { getFormData } from "@/lib/form-data";

// 30s ISR in production: render each business once, then serve from the CDN via
// stale-while-revalidate, keeping the DB round-trip off the QR-scan critical path.
// Must be a static literal (Next rejects an env-conditional segment config), but it
// only bites in production — `next dev` ignores route ISR and re-renders every request,
// so local config edits still show instantly. The dev-instant guarantee is enforced in
// lib/form-data.ts, which bypasses `unstable_cache` (the only layer that persists in dev)
// when NODE_ENV !== "production". No cross-deployment invalidation; freshness rides the
// 30s TTL. See docs/adr/0016.
export const revalidate = 30;

// No params are known at build (businesses are created at runtime), but declaring
// generateStaticParams is what opts a dynamic-segment route into the Full Route Cache:
// without it Next renders `/[businessId]` fully dynamic on every request (revalidate is
// ignored). With it, each business renders on first scan, is cached at the CDN, and
// revalidates per `revalidate` above. dynamicParams defaults true, so unknown ids still
// render on demand.
export function generateStaticParams() {
  return [];
}

interface PageProps {
  params: Promise<{ businessId: string }>;
}

/**
 * Async data boundary. Suspends on the (cached) lookup so the static shell can
 * flush immediately and the skeleton shows while data streams in — no blank
 * screen, even on a cache miss / cold lambda.
 */
async function FormLoader({ businessId }: { businessId: string }) {
  const data = await getFormData(businessId);

  if (!data) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6 text-center">
        <p className="text-muted-foreground text-sm">This form is no longer active.</p>
      </div>
    );
  }

  const { business, config } = data;

  return (
    <ReviewForm
      businessId={businessId}
      businessName={business.name}
      googlePlaceId={business.googlePlaceId}
      googleMapsReviewUrl={business.googleMapsReviewUrl}
      brandColor={config?.brandColor ?? "#2563EB"}
      logoUrl={config?.logoUrl ?? null}
      defaultLanguage={config?.defaultLanguage ?? "en"}
      supportedLanguages={config?.supportedLanguages ?? ["en"]}
      byLanguage={config?.byLanguage ?? {}}
    />
  );
}

export default async function ReviewFormPage({ params }: PageProps) {
  const { businessId } = await params;

  return (
    <Suspense fallback={<FormSkeleton />}>
      <FormLoader businessId={businessId} />
    </Suspense>
  );
}
