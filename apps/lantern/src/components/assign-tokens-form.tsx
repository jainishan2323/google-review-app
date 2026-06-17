"use client";

import { useActionState } from "react";
import { assignTokens, type AssignState } from "@/actions/qrCodes";

const INITIAL: AssignState = { ok: false };

/**
 * Stage-1 bulk assignment (ADR 0015): pick a business, paste/type 1–N codes,
 * assign all at once. Reports how many matched and which codes didn't (typo /
 * unknown / retired) so a mistyped code isn't silently dropped.
 */
export function AssignTokensForm({ businesses }: { businesses: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(assignTokens, INITIAL);

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Business</label>
        <select
          name="businessId"
          required
          defaultValue=""
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Select business…
          </option>
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Codes (space, comma or newline separated)
        </label>
        <textarea
          name="codes"
          rows={2}
          placeholder="K7M2P X9F4Q"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm uppercase"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Assigning…" : "Assign"}
      </button>

      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.ok && (
        <p className="text-xs text-muted-foreground">
          Assigned <span className="font-medium text-green-600">{state.assigned}</span> code
          {state.assigned === 1 ? "" : "s"}.
          {state.unmatched && state.unmatched.length > 0 && (
            <>
              {" "}
              Not matched (unknown or retired):{" "}
              <span className="font-mono text-amber-600">{state.unmatched.join(", ")}</span>
            </>
          )}
        </p>
      )}
    </form>
  );
}
