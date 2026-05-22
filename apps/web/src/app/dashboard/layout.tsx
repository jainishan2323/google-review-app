import { prisma } from "@repo/db";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

const DEV_BUSINESS_ID = process.env.DEV_BUSINESS_ID ?? "cmpabfbxs001np8qjvk5l6s14";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const business = await prisma.business.findUnique({
    where: { id: DEV_BUSINESS_ID },
    select: { name: true, googleLocationId: true },
  });

  const businessName = business?.name ?? "Your Business";
  const googleLocationId = business?.googleLocationId ?? "";

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
