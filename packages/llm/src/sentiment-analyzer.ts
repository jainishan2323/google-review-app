import { getLLMClient } from "./client";
import type { SentimentAnalysis } from "@repo/types";

interface ReviewInput {
  text: string;
  rating: number;
}

export async function analyzeReviews(
  reviews: ReviewInput[]
): Promise<SentimentAnalysis> {
  const reviewTexts = reviews
    .filter((r) => r.text && r.text.trim().length > 0)
    .map((r) => `[${r.rating}★] ${r.text}`)
    .join("\n");

  if (!reviewTexts) {
    return {
      positiveThemes: [],
      areasForImprovement: [],
      overallSentiment: "neutral",
      summary: "Not enough review text to analyze.",
    };
  }

  const prompt = `Analyze the following Google reviews and provide structured insights.

Reviews:
${reviewTexts}

Respond ONLY with a valid JSON object using these exact fields:
{
  "positiveThemes": ["string", ...],        // 3–5 things customers love most
  "areasForImprovement": ["string", ...],   // 2–3 recurring pain points
  "overallSentiment": "positive" | "neutral" | "negative",
  "summary": "string"                        // 2–3 sentence executive summary
}`;

  const content = await getLLMClient().complete(prompt, {
    maxTokens: 600,
    temperature: 0.3,
    json: true,
  });
  return JSON.parse(content) as SentimentAnalysis;
}
