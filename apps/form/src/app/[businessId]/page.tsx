import { Suspense } from "react";
import ReviewForm from "@/components/ReviewForm";
import { FormSkeleton } from "@/components/FormSkeleton";
import { getFormData } from "@/lib/form-data";

// ISR: render each business on first hit, then serve from the CDN for 5 min
// (stale-while-revalidate). Keeps the DB round-trip off the critical path for
// virtually all QR scans. Staleness of a few minutes after a config edit is OK.
export const revalidate = 300;

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
      welcomeMessage={
        config?.welcomeMessage ?? "Thanks for visiting! We'd love your feedback."
      }
      categories={
        config?.categories.length
          ? config.categories
          : [
              {
                name: "General",
                positiveChips: ["Great Service", "Friendly Staff"],
                negativeChips: ["Long Wait", "Poor Communication"],
              },
            ]
      }
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
