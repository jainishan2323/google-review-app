"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface WaitlistFormProps {
  fullWidth?: boolean;
}

export function WaitlistForm({ fullWidth = false }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    toast.success("You're on the list! We'll be in touch shortly.");
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
      className={cn(
        "flex gap-2",
        fullWidth ? "w-full flex-col sm:flex-row" : "flex-row"
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
      <Button type="submit" size="lg" className={cn(fullWidth && "sm:shrink-0")}>
        Join Waitlist
      </Button>
    </form>
  );
}
