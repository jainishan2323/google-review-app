"use client";

import { useRef, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LogOut, Building2, ChevronDown, Check } from "lucide-react";
import { setActiveBusiness } from "@/actions/active-business";

type HeaderBusiness = { id: string; name: string; googleLocationId: string };

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":                   "Overview",
  "/dashboard/reviews":           "Reviews",
  "/dashboard/analytics":         "Analytics",
  "/dashboard/feedback":          "Feedback",
  "/dashboard/feedback/settings": "Settings",
  "/dashboard/settings":          "Settings",
};

export function DashboardHeader({
  businesses,
  activeBusinessId,
}: {
  businesses: HeaderBusiness[];
  activeBusinessId: string;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [bizOpen, setBizOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const bizRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
      if (bizRef.current && !bizRef.current.contains(e.target as Node)) setBizOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const active = businesses.find((b) => b.id === activeBusinessId) ?? businesses[0];
  const canSwitch = businesses.length > 1;
  const title = PAGE_TITLES[pathname] ?? "Dashboard";

  async function switchTo(id: string) {
    if (id === active?.id) {
      setBizOpen(false);
      return;
    }
    await setActiveBusiness(id);
    // Hard reload so server pages and client-fetched API data both re-resolve
    // against the new active-business cookie.
    window.location.assign("/dashboard");
  }

  // The active business, rendered as the pill's inner content (icon + two lines).
  const pillContent = (
    <>
      <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <div className="min-w-0 text-left">
        <p className="text-xs font-medium text-foreground leading-none truncate max-w-[180px]">
          {active?.name}
        </p>
        <p className="text-[10px] text-muted-foreground leading-none mt-0.5 truncate max-w-[180px]">
          {active?.googleLocationId}
        </p>
      </div>
    </>
  );

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6">
      {/* Page title */}
      <h1 className="text-sm font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-4">
        {/* Business switcher (or static badge when the owner has only one) */}
        {canSwitch ? (
          <div className="relative hidden sm:block" ref={bizRef}>
            <button
              onClick={() => setBizOpen((o) => !o)}
              aria-label="Switch business"
              className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5 transition-colors hover:bg-muted"
            >
              {pillContent}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </button>

            {bizOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-64 rounded-xl border border-border bg-background shadow-lg z-50 overflow-hidden">
                <p className="px-4 pt-3 pb-1 text-xs text-muted-foreground uppercase tracking-wide">
                  Switch business
                </p>
                {businesses.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => void switchTo(b.id)}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-muted"
                  >
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">{b.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{b.googleLocationId}</p>
                    </div>
                    {b.id === active?.id && (
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5">
            {pillContent}
          </div>
        )}

        {/* User dropdown */}
        {session?.user && (
          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted"
            >
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name ?? "User"}
                  className="h-7 w-7 rounded-full"
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                  {session.user.name?.[0] ?? "U"}
                </div>
              )}
              <span className="hidden sm:block text-sm font-medium text-foreground">
                {session.user.name}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>

            {open && (
              <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-border bg-background shadow-lg z-50 overflow-hidden">
                {/* User info */}
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium text-foreground">{session.user.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{session.user.email}</p>
                </div>

                {/* Business info */}
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Business account</p>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{active?.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{active?.googleLocationId}</p>
                    </div>
                  </div>
                </div>

                {/* Sign out */}
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex w-full items-center gap-2 px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
