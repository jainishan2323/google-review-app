"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sign in to your review dashboard
          </p>
        </div>

        <Button
          onClick={() =>
            signIn("google", { callbackUrl: "/dashboard" }, { prompt: "select_account" })
          }
          className="w-full"
          size="lg"
        >
          Continue with Google
        </Button>

        <p className="text-center text-xs text-gray-400">
          We only use Google to confirm your name and email — nothing more.
        </p>
      </div>
    </main>
  );
}
