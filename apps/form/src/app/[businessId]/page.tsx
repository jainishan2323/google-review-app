"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface PageProps {
  params: { businessId: string };
}

type Step = "form" | "generated" | "done";

interface FormState {
  whatDidYouEnjoy: string;
  howWasService: string;
  additionalComments: string;
}

export default function ReviewFormPage({ params }: PageProps) {
  const [step, setStep] = useState<Step>("form");
  const [rating, setRating] = useState(0);
  const [formState, setFormState] = useState<FormState>({
    whatDidYouEnjoy: "",
    howWasService: "",
    additionalComments: "",
  });
  const [generatedText, setGeneratedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  function updateField(field: keyof FormState, value: string) {
    setFormState((prev) => ({ ...prev, [field]: value }));
  }

  async function handleGenerate() {
    if (rating === 0) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formState, rating, businessId: params.businessId }),
      });
      if (!res.ok) throw new Error("Failed to generate review");
      const data = await res.json();
      setGeneratedText(data.text);
      setStep("generated");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAnonymousSubmit() {
    await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formState, rating, businessId: params.businessId }),
    });
    setStep("done");
  }

  function handlePostToGoogle() {
    navigator.clipboard.writeText(generatedText).catch(() => {
      // Clipboard not available — user can manually copy
    });
    // googleMapsReviewUrl should come from the business record fetched server-side
    // For now we open a generic maps URL; replace with actual business URL
    window.open("https://maps.google.com", "_blank", "noopener,noreferrer");
    setStep("done");
  }

  if (step === "done") {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <div className="mb-4 text-5xl">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900">Thank you!</h1>
          <p className="mt-2 text-gray-500">
            Your feedback means a lot to us.
          </p>
        </div>
      </main>
    );
  }

  if (step === "generated") {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Your Review is Ready
          </h1>
          <p className="text-sm text-gray-500">
            Feel free to edit it before posting.
          </p>
          <Textarea
            className="min-h-[150px]"
            value={generatedText}
            onChange={(e) => setGeneratedText(e.target.value)}
          />
          <Button onClick={handlePostToGoogle} className="w-full" size="lg">
            Copy &amp; Open Google to Post
          </Button>
          <button
            onClick={() => setStep("form")}
            className="w-full text-sm text-gray-400 underline"
          >
            ← Go back and edit my answers
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">
          How was your experience?
        </h1>

        {/* Star rating */}
        <div>
          <Label className="mb-2 block">Your Rating</Label>
          <div className="flex gap-1" role="group" aria-label="Star rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                aria-label={`${star} star${star !== 1 ? "s" : ""}`}
                className={`text-4xl transition-colors ${
                  star <= rating ? "text-yellow-400" : "text-gray-300"
                } hover:text-yellow-300`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="enjoyed">What did you enjoy most?</Label>
            <Textarea
              id="enjoyed"
              placeholder="The food, atmosphere, staff…"
              value={formState.whatDidYouEnjoy}
              onChange={(e) => updateField("whatDidYouEnjoy", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="service">How was the service?</Label>
            <Textarea
              id="service"
              placeholder="Fast, friendly, professional…"
              value={formState.howWasService}
              onChange={(e) => updateField("howWasService", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="additional">Anything else to add?</Label>
            <Textarea
              id="additional"
              placeholder="Any other thoughts…"
              value={formState.additionalComments}
              onChange={(e) => updateField("additionalComments", e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button
          onClick={handleGenerate}
          disabled={isLoading || rating === 0}
          className="w-full"
          size="lg"
        >
          {isLoading ? "Generating…" : "Generate My Review"}
        </Button>

        <p className="text-center text-xs text-gray-400">
          Prefer not to post publicly?{" "}
          <button
            onClick={handleAnonymousSubmit}
            className="underline hover:text-gray-600"
          >
            Send anonymous feedback instead
          </button>
        </p>
      </div>
    </main>
  );
}
