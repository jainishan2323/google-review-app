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
  const tone = isNegative
    ? "empathetic, apologetic, and solution-focused"
    : "warm, genuine, and appreciative";

  const prompt = `You are the owner of "${businessName}" responding to a Google review.

Review from ${review.authorName} (${review.rating}/5 stars):
"${review.text}"

Write a professional reply that is ${tone}. 

Guidelines:
- Keep it to 2–3 sentences
- Be personal, use the reviewer's name once
- If negative: acknowledge the issue, apologise sincerely, offer to resolve offline (do not include fake phone numbers or emails)
- If positive: thank them genuinely, invite them back
- Do not be defensive or dismissive
- Do not use hollow phrases like "We strive for excellence"
- Sign off naturally as the owner`;

  return getLLMClient().complete(prompt, { maxTokens: 200, temperature: 0.6 });
}
