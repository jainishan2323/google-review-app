import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AnalysisProvider } from "@/components/analysis/AnalysisProvider";
import { AnalysisProgressWidget } from "@/components/analysis/AnalysisProgressWidget";
import { requireBusinessContext } from "@/lib/current-business";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { active, businesses } = await requireBusinessContext();

  return (
    <AnalysisProvider>
      <div className="flex h-screen bg-background text-foreground">
        <DashboardSidebar businessName={active.name} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader businesses={businesses} activeBusinessId={active.id} />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Persistent analysis-run progress — follows the owner across tabs (ADR-0019). */}
      <AnalysisProgressWidget />
    </AnalysisProvider>
  );
}
