"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

// Shown when someone signs in with a Google email we haven't pre-provisioned a
// business for. Onboarding is operator-driven (a business is created ahead of
// time with the owner's email recorded), so a signed-in-but-unlinked owner is
// an edge case, not an error — never auto-create a business here.
// See docs/adr/0004-owner-business-linking-by-verified-email.md
export default function NoBusinessPage() {
  const { data: session } = useSession();

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">No dashboard yet</h1>
          <p className="text-sm text-gray-500">
            We don&apos;t have an account set up for
            {session?.user?.email ? (
              <>
                {" "}
                <span className="font-medium text-gray-700">{session.user.email}</span>
              </>
            ) : (
              " this email"
            )}{" "}
            yet. If you&apos;re expecting access, get in touch and we&apos;ll get
            you set up.
          </p>
        </div>

        <a
          href="mailto:jugnoo@olbaid.de"
          className="inline-block text-sm font-medium text-primary hover:underline"
        >
          Contact Jugnoo
        </a>

        <div className="flex flex-col items-center gap-2">
          <Button
            size="sm"
            onClick={() =>
              signIn("google", { callbackUrl: "/dashboard" }, { prompt: "select_account" })
            }
          >
            Try a different account
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Sign out
          </Button>
        </div>
      </div>
    </main>
  );
}
