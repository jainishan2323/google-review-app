import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { getActiveBusiness } from "@/lib/active-business";

// Per-session (live business depends on the signed-in user), so render dynamically.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const business = await getActiveBusiness();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DashboardSidebar businessName={business.businessName} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          businessName={business.businessName}
          googleLocationId={business.googleLocationId}
          isSampleData={business.isSampleData}
        />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
