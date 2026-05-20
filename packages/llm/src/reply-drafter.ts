import { getLLMClient } from "./client";

interface ReviewInput {
  rating: number;
  text: string;
  authorName: string;
}

export async function draftReply(
  review: ReviewInput,
  businessName: string
): Promise<string> {
  const isNegative = review.rating <= 2;

  const prompt = `You are the owner of "${businessName}" responding to a Google review.

Review from ${review.authorName} (${review.rating}/5 stars):
"${review.text}"

Write a short, sincere reply in 2–3 sentences.

Rules:
- Use the reviewer's name once
- If negative (1–2 stars): acknowledge the specific issue they mentioned and apologise sincerely. Nothing else.
- If mixed (3 stars): acknowledge both what went well and what didn't, briefly
- If positive (4–5 stars): thank them genuinely for the specific things they praised
- No offers, no discounts, no "please come back", no "we'll do better next time" promises
- No hollow phrases like "We strive for excellence" or "Your feedback is valuable"
- Do not be defensive
- Sign off naturally as the owner`;

  return getLLMClient().complete(prompt, { maxTokens: 200, temperature: 0.6 });
}
