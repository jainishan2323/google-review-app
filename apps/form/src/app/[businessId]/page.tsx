import { prisma } from "@repo/db";
import ReviewForm from "@/components/ReviewForm";

interface PageProps {
  params: Promise<{ businessId: string }>;
}

export default async function ReviewFormPage({ params }: PageProps) {
  const { businessId } = await params;

  const [business, config] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true, googlePlaceId: true, googleMapsReviewUrl: true },
    }),
    prisma.formConfig.findUnique({ where: { businessId } }),
  ]);

  if (!business) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6 text-center">
        <p className="text-muted-foreground text-sm">This form is no longer active.</p>
      </div>
    );
  }

  return (
    <ReviewForm
      businessId={businessId}
      businessName={business.name}
      googlePlaceId={business.googlePlaceId ?? null}
      googleMapsReviewUrl={business.googleMapsReviewUrl ?? null}
      brandColor={config?.brandColor ?? "#2563EB"}
      logoUrl={config?.logoUrl ?? null}
      welcomeMessage={
        config?.welcomeMessage ?? "Thanks for visiting! We'd love your feedback."
      }
      positiveChips={
        config?.positiveChips ?? [
          "Great Service",
          "Clean Environment",
          "Friendly Staff",
          "Highly Recommend",
        ]
      }
      negativeChips={
        config?.negativeChips ?? [
          "Long Wait",
          "Poor Communication",
          "Needs Improvement",
          "Unprofessional",
        ]
      }
    />
  );
}
