import type { LLMProvider } from "./providers/types";
import { OpenAIProvider } from "./providers/openai";

/**
 * Returns an LLM provider.
 *
 * With no argument it returns the env-configured default (LLM_PROVIDER, falling
 * back to "openai") — the normal path for feature code. Pass an explicit provider
 * name to target a specific one regardless of env; the review playground uses this
 * to run a single request against any model in the registry. Either way, feature
 * code should never import a provider SDK directly.
 *
 *   LLM_PROVIDER=openai   (default)
 *   LLM_PROVIDER=ollama   (add OllamaProvider to ./providers/ollama.ts)
 */
export function getLLMClient(providerName?: string): LLMProvider {
  const provider = providerName ?? process.env.LLM_PROVIDER ?? "openai";
  switch (provider) {
    case "openai":
      return new OpenAIProvider();
    default:
      throw new Error(
        `[LLM] Unknown provider: "${provider}". Set LLM_PROVIDER to a supported value (e.g. "openai").`
      );
  }
}
