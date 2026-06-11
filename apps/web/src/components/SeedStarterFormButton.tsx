"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { seedStarterForm } from "@/actions/seedStarterForm";

/** Empty-state CTA: seed the starter feedback form for the current business. */
export function SeedStarterFormButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="space-y-2">
      <Button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const res = await seedStarterForm();
            if (res.success) {
              toast.success("Starter form created.");
              router.refresh();
            } else {
              setError(res.error ?? "Failed to create form.");
            }
          })
        }
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {isPending ? "Creating…" : "Create starter form"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
