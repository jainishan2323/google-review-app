import type { LLMProvider } from "./providers/types";
import { OpenAIProvider } from "./providers/openai";

/**
 * Returns the configured LLM provider.
 *
 * Swap providers by setting the LLM_PROVIDER env var:
 *   LLM_PROVIDER=openai   (default)
 *   LLM_PROVIDER=ollama   (add OllamaProvider to ./providers/ollama.ts)
 *
 * Feature code should call getLLMClient() — never import a provider SDK directly.
 */
export function getLLMClient(): LLMProvider {
  const provider = process.env.LLM_PROVIDER ?? "openai";
  switch (provider) {
    case "openai":
      return new OpenAIProvider();
    default:
      throw new Error(
        `[LLM] Unknown provider: "${provider}". Set LLM_PROVIDER to a supported value (e.g. "openai").`
      );
  }
}
