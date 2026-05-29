import { AdminNav } from "@/components/admin-nav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh">
      <aside className="w-56 shrink-0 border-r border-border p-6">
        <p className="mb-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Jugnoo Lantern
        </p>
        <AdminNav />
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
