"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Star,
  BarChart2,
  MessageSquare,
  Settings,
  LogOut,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/reviews", label: "Reviews", icon: Star },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/dashboard/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/dashboard/feedback/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 flex flex-col border-r border-sidebar-border bg-sidebar">
        {/* Logo */}
        <div className="px-6 py-5">
          <span className="text-lg font-bold tracking-tight text-sidebar-foreground">
            ⭐ ReviewApp
          </span>``
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground opacity-70 hover:opacity-100 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <Separator className="bg-sidebar-border" />

        <div className="px-4 py-4 space-y-3">
          {session?.user && (
            <div className="flex items-center gap-3 px-2">
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name ?? "User"}
                  className="h-7 w-7 rounded-full"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate">
                  {session.user.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {session.user.email}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-auto bg-background">
        {children}
      </div>
    </div>
  );
}
