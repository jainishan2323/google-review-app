"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-card p-10 text-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Jugnoo Admin</h1>
          <p className="text-sm text-muted-foreground">Internal operator panel</p>
        </div>
        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard/waitlist" })}
          className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:opacity-80"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
