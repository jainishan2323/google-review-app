import type { ReviewGenerateInput } from "@repo/types";
import { getLLMClient } from "./client";

/** Persona + anti-cliché rules, constant for every rating. */
const SYSTEM_PROMPT =
  `You write Google reviews the way real everyday customers do: plain, specific, and a ` +
  `little imperfect. You are NOT a marketer or copywriter, and you never sound like one.\n\n` +
  `Banned phrasing — never use: "I recently had the pleasure", "highly recommend", ` +
  `"top-notch", "exceeded my expectations", "hidden gem", "can't recommend enough", ` +
  `"a must-visit", "5 stars", or any wording that reads like advertising copy.\n\n` +
  `Style: vary sentence length, prefer concrete details over generic praise, and let the ` +
  `tone match how the customer actually felt. Output only the review text — no preamble, ` +
  `no quotation marks, no labels.`;

/** Tone guidance selected by the star rating. */
function bandInstruction(rating: number): string {
  if (rating <= 2) {
    return (
      `They were disappointed. Sound let down and honest — not furious, abusive, or ` +
      `profane. Name the specific problem and do NOT add silver linings or balance ` +
      `unless their own words include something positive.`
    );
  }
  if (rating === 3) {
    return (
      `It was just okay. Mention one good thing and one weak thing briefly, and land on ` +
      `lukewarm — clearly not enthusiastic.`
    );
  }
  return (
    `They were happy. Sound genuinely pleased and warm but grounded, like a normal ` +
    `satisfied customer rather than a promoter.`
  );
}

/** Per-attempt directive so each regeneration takes a genuinely different angle. */
const VARIATION_DIRECTIVES = [
  "",
  `Take a different angle from a typical review: open with one concrete detail instead ` +
    `of a summary, and keep it under 20 words.`,
  `Try another angle: a single punchy, conversational sentence.`,
];

function variationDirective(attempt: number): string {
  const i = Math.min(Math.max(attempt, 0), VARIATION_DIRECTIVES.length - 1);
  return VARIATION_DIRECTIVES[i] ?? "";
}

/** Ramp temperature with each regeneration to push variety. */
const TEMPERATURES = [0.6, 0.85, 1.0];

function temperatureFor(attempt: number): number {
  const i = Math.min(Math.max(attempt, 0), TEMPERATURES.length - 1);
  return TEMPERATURES[i] ?? 0.6;
}

function buildPrompt(input: ReviewGenerateInput, businessName: string): string {
  const tags = input.tags.length > 0 ? input.tags.join(", ") : "the overall experience";
  const note = input.customText ? ` Their own words: "${input.customText}".` : "";
  const directive = variationDirective(input.attempt ?? 0);

  return (
    `Write ONE first-person Google review for "${businessName}". Maximum 35 words.\n\n` +
    `This customer gave ${input.rating}/5 stars. ${bandInstruction(input.rating)}\n\n` +
    `What they specifically mentioned: ${tags}.${note}\n` +
    `Build the review around those points — do not invent details they didn't raise.\n\n` +
    (directive ? `${directive}\n\n` : ``) +
    `No markdown, no quotes, no emojis, no hashtags.`
  );
}

/** One-shot generation — resolves with the complete review text. */
export async function generateReviewText(
  input: ReviewGenerateInput,
  businessName: string
): Promise<string> {
  return getLLMClient().complete(
    buildPrompt(input, businessName),
    { maxTokens: 80, temperature: temperatureFor(input.attempt ?? 0) },
    SYSTEM_PROMPT
  );
}

/** Streaming generation — resolves with a ReadableStream of text chunks. */
export async function streamReviewText(
  input: ReviewGenerateInput,
  businessName: string
): Promise<ReadableStream<string>> {
  return getLLMClient().stream(
    buildPrompt(input, businessName),
    { maxTokens: 80, temperature: temperatureFor(input.attempt ?? 0) },
    SYSTEM_PROMPT
  );
}
