"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentBusiness } from "@/lib/current-business";
import { isLiveLinked } from "@/lib/google-token";
import { syncBusinessReviews } from "@/lib/sync-reviews";

export interface SyncActionResult {
  ok: boolean;
  synced?: number;
  removed?: number;
  error?: string;
}

// User-driven "Sync reviews" button. Pulls fresh reviews from Google into Postgres for
// the active business, then revalidates the reviews page so the new rows render.
export async function syncReviewsAction(): Promise<SyncActionResult> {
  const business = await requireCurrentBusiness();
  if (!isLiveLinked(business.googleLocationId)) {
    return { ok: false, error: "not_connected" };
  }

  try {
    const result = await syncBusinessReviews(business);
    revalidatePath("/dashboard/reviews");
    return { ok: true, synced: result.synced, removed: result.removed };
  } catch (err) {
    console.error("Manual review sync failed", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "sync_failed",
    };
  }
}
