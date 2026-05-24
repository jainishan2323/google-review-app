"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface WaitlistFormProps {
  fullWidth?: boolean;
  showMessage?: boolean;
  source?: string;
}

export function WaitlistForm({ fullWidth = false, showMessage = false, source = "landing" }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, message, source }),
      });
      setSubmitted(true);
      toast.success("You're on the list! We'll be in touch shortly.");
    } catch {
      toast.error("Something went wrong. Try again?");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-sm text-primary",
          fullWidth && "justify-center"
        )}
      >
        <Check className="size-4" />
        <span>You&apos;re on the list — we&apos;ll be in touch.</span>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-3", fullWidth && "w-full")}
    >
      {showMessage && (
        <textarea
          placeholder="What are you most excited to try? (optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      )}
      <div
        className={cn(
          "flex gap-2",
          fullWidth ? "flex-col sm:flex-row" : "flex-row"
        )}
      >
        <Input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={cn("h-9", fullWidth && "flex-1")}
        />
        <Button type="submit" size="lg" disabled={loading} className={cn(fullWidth && "sm:shrink-0")}>
          {loading ? "Joining…" : "Join Waitlist"}
        </Button>
      </div>
    </form>
  );
}
