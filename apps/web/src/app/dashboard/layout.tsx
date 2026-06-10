import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { requireCurrentBusiness } from "@/lib/current-business";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const business = await requireCurrentBusiness();

  const businessName = business.name;
  const googleLocationId = business.googleLocationId;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DashboardSidebar businessName={businessName} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          businessName={businessName}
          googleLocationId={googleLocationId}
        />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
