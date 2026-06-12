"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { BUSINESS_TYPE_OPTIONS } from "@repo/db";
import { onboardBusiness, type OnboardState } from "@/actions/businesses";

const initialState: OnboardState = { ok: false };

function Field({
  label,
  name,
  placeholder,
  hint,
  type = "text",
}: {
  label: string;
  name: string;
  placeholder: string;
  hint?: string;
  type?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-foreground">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
      {hint && <span className="block text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function OnboardBusinessForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(onboardBusiness, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  // Close + reset once the server action reports success — the new business
  // card appears via the action's revalidatePath.
  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setOpen(false);
    }
  }, [state.ok]);

  // Esc to close while the modal is open.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Onboard business
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Onboard a business"
        >
          <form
            ref={formRef}
            action={formAction}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-foreground">Onboard a business</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Creates the business and its owner. The owner is linked automatically
                  when they first sign in with this Google email.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="shrink-0 text-lg leading-none text-muted-foreground transition-colors hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {/* All fields stacked one per row */}
            <div className="space-y-4">
              <Field
                label="Owner email"
                name="ownerEmail"
                type="email"
                placeholder="owner@restaurant.com"
                hint="Their Google sign-in email — must match exactly."
              />
              <Field
                label="Business name"
                name="name"
                placeholder="aahaa Indisches Restaurant"
              />
              <label className="block space-y-1">
                <span className="text-xs font-medium text-foreground">Business type</span>
                <select
                  name="businessType"
                  defaultValue={BUSINESS_TYPE_OPTIONS[0]?.value}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  {BUSINESS_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <span className="block text-[11px] text-muted-foreground">
                  Seeds the starter feedback form (categories &amp; chips) for this vertical.
                </span>
              </label>
              <Field
                label="Google Place ID"
                name="googlePlaceId"
                placeholder="ChIJw6F9_XlRqEcRSsXtXHA8Ju0"
                hint="From Google Maps — drives the review redirect."
              />
              <Field
                label="Google Location ID"
                name="googleLocationId"
                placeholder="placeholder-location-001"
                hint="Placeholder for now; replaced by the real value in Phase 2."
              />
            </div>

            {state.error && (
              <p className="text-xs font-medium text-red-600">{state.error}</p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Onboarding…" : "Onboard business"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
