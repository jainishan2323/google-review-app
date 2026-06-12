import { listPlaygroundBusinesses, listPlaygroundModels } from "@/actions/playground";
import { PlaygroundClient } from "@/components/playground-client";

export const dynamic = "force-dynamic";

export default async function PlaygroundPage() {
  const [businesses, models] = await Promise.all([
    listPlaygroundBusinesses(),
    listPlaygroundModels(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Review Playground</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Run the live review generator across a matrix of scenarios × models. The prompt is
          preview-only — it lives in code (review-generator.ts); tune it there and see the effect
          here.
        </p>
      </div>
      <PlaygroundClient businesses={businesses} models={models} />
    </div>
  );
}
