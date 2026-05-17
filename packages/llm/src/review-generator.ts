import type { ReviewGenerateInput } from "@repo/types";
import { getLLMClient } from "./client";

function buildPrompt(input: ReviewGenerateInput, businessName: string): string {
  const tags = input.tags.length > 0 ? input.tags.join(", ") : "general experience";
  const note = input.customText ? ` Note: ${input.customText}.` : "";
  return (
    `Write ONE natural first-person Google review. Max 35 words. ` +
    `No markdown, no quotes, no emojis, no hashtags. ` +
    `Business: "${businessName}". Rating: ${input.rating}/5. Tags: ${tags}.${note}`
  );
}

/** One-shot generation — resolves with the complete review text. */
export async function generateReviewText(
  input: ReviewGenerateInput,
  businessName: string
): Promise<string> {
  return getLLMClient().complete(buildPrompt(input, businessName), {
    maxTokens: 80,
    temperature: 0.5,
  });
}

/** Streaming generation — resolves with a ReadableStream of text chunks. */
export async function streamReviewText(
  input: ReviewGenerateInput,
  businessName: string
): Promise<ReadableStream<string>> {
  return getLLMClient().stream(buildPrompt(input, businessName), {
    maxTokens: 80,
    temperature: 0.5,
  });
}

