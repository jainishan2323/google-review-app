"use client";

import { useActionState, useEffect, useRef } from "react";
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
  const [state, formAction, pending] = useActionState(onboardBusiness, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-xl border border-border bg-card p-5 space-y-4"
    >
      <div>
        <p className="font-semibold text-foreground">Onboard a business</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Creates the business and its owner. The owner is linked automatically
          when they first sign in with this Google email.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
      {state.ok && (
        <p className="text-xs font-medium text-green-600">
          Onboarded {state.createdName}. They can sign in now.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Onboarding…" : "Onboard business"}
      </button>
    </form>
  );
}
