import OpenAI from "openai";
import type { ReviewFormData } from "@repo/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateReviewText(
  formData: ReviewFormData,
  businessName: string
): Promise<string> {
  const lines: string[] = [`- Star rating: ${formData.rating}/5`];

  if (formData.whatDidYouEnjoy) {
    lines.push(`- What they enjoyed: ${formData.whatDidYouEnjoy}`);
  }
  if (formData.howWasService) {
    lines.push(`- Service quality: ${formData.howWasService}`);
  }
  if (formData.additionalComments) {
    lines.push(`- Additional notes: ${formData.additionalComments}`);
  }

  const prompt = `You are helping a genuine customer write a Google review for "${businessName}".

Based on the following feedback, write a natural, authentic-sounding review in first person:
${lines.join("\n")}

Guidelines:
- Write 2–4 sentences
- Sound like a real person, not a marketing pitch
- Match the tone to the star rating (enthusiastic for 5★, measured for 3★, honest for 1–2★)
- Do not fabricate specific details not mentioned in the feedback
- Do not start with "I" as the very first word`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 250,
    temperature: 0.75,
  });

  return response.choices[0]?.message?.content?.trim() ?? "";
}
