"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard/waitlist", label: "Waitlist", icon: "👥" },
  { href: "/dashboard/businesses", label: "Businesses", icon: "🏢" },
  { href: "/dashboard/print-orders", label: "Print Orders", icon: "🖨️" },
  { href: "/dashboard/app-feedback", label: "App Feedback", icon: "⭐" },
  { href: "/dashboard/playground", label: "Review Playground", icon: "🧪" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="space-y-1">
      {NAV_ITEMS.map(({ href, label, icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname.startsWith(href)
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <span>{icon}</span>
          {label}
        </Link>
      ))}
    </nav>
  );
}
