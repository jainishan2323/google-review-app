import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { requireBusinessContext } from "@/lib/current-business";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { active, businesses } = await requireBusinessContext();

  return (
    <div className="flex h-screen bg-background text-foreground">
      <DashboardSidebar businessName={active.name} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader businesses={businesses} activeBusinessId={active.id} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
