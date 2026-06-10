import { Sparkles } from "lucide-react";

// Phase 1 placeholder for surfaces that depend on live Google review data
// (Reviews, Analytics). We keep the tabs in the nav so Phase 2 ("Connect
// Google") lights up an existing surface, but we deliberately do NOT fall back
// to seeded sample data — showing a real owner fabricated reviews of their own
// business is worse than an honest "coming soon".
// See docs/adr/0003-google-signin-split-identity-then-authorization.md
export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main className="p-8">
      <div className="flex flex-col items-center justify-center text-center gap-4 rounded-xl border border-dashed border-border py-24 px-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-1.5 max-w-md">
          <h1 className="text-xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          Coming soon
        </span>
      </div>
    </main>
  );
}
