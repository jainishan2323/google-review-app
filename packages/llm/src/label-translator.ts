import { getLLMClient } from "./client";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  de: "German",
};

function languageName(code: string): string {
  return LANGUAGE_NAMES[code] ?? code;
}

/**
 * Translate a batch of short taxonomy labels from one language to another in a
 * single LLM call. Labels are UI chips (1–3 words), so the prompt asks for terse,
 * idiomatic equivalents rather than literal translations.
 *
 * Resolves to an array aligned 1:1 with `texts`. On ANY failure (LLM error,
 * malformed JSON, length mismatch) it falls back to returning the source texts
 * unchanged — a never-blank guarantee for the caller.
 */
export async function translateLabels(
  texts: string[],
  fromLanguage: string,
  toLanguage: string
): Promise<string[]> {
  if (texts.length === 0) return [];
  if (fromLanguage === toLanguage) return [...texts];

  const systemPrompt =
    `You translate short UI labels (feedback "chips" for a local business — 1 to 3 words each) ` +
    `from ${languageName(fromLanguage)} to ${languageName(toLanguage)}. ` +
    `Produce terse, natural, idiomatic equivalents a native speaker would tap on a form — ` +
    `NOT literal word-for-word translations. Preserve order and count exactly. ` +
    `Respond ONLY with a valid JSON object, no prose, no markdown.`;

  const userMessage =
    `Translate these ${texts.length} labels to ${languageName(toLanguage)}:\n` +
    texts.map((t, i) => `  [${i + 1}] ${t}`).join("\n") +
    `\n\nRequired output schema:\n{ "translations": ["string", ...] }\n` +
    `The "translations" array must have exactly ${texts.length} items, in the same order.`;

  try {
    const raw = await getLLMClient().complete(
      userMessage,
      { maxTokens: 1000, temperature: 0.2, json: true },
      systemPrompt
    );
    const parsed = JSON.parse(raw) as { translations?: unknown };
    const out = parsed.translations;
    if (
      Array.isArray(out) &&
      out.length === texts.length &&
      out.every((t) => typeof t === "string" && t.trim().length > 0)
    ) {
      return out.map((t) => (t as string).trim());
    }
  } catch {
    // fall through to source-text fallback
  }
  return [...texts];
}
