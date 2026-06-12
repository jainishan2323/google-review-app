/**
 * The set of models the app can generate against, as data.
 *
 * This is the single place to "connect a new model": add a descriptor here, and
 * — if it needs a provider we don't have yet — add an `LLMProvider` class under
 * `./providers/` and route it in `getLLMClient()`. Feature code and the Lantern
 * review playground read this list rather than hard-coding model strings.
 *
 * `provider` selects the LLMProvider implementation; `modelId` is the exact
 * model string passed to that provider's SDK (threaded via `LLMOptions.model`).
 */
export interface ModelDescriptor {
  /** Stable selection key, unique across providers (e.g. "openai:gpt-4o-mini"). */
  id: string;
  /** Human label for dropdowns. */
  label: string;
  /** Which LLMProvider serves this model (matches getLLMClient's switch). */
  provider: string;
  /** Exact model string handed to the provider SDK. */
  modelId: string;
}

export const MODEL_REGISTRY: ModelDescriptor[] = [
  {
    id: "openai:gpt-4o-mini",
    label: "GPT-4o mini",
    provider: "openai",
    modelId: "gpt-4o-mini",
  },
  // Add more OpenAI models, or other providers, here. e.g.:
  // { id: "openai:gpt-4o", label: "GPT-4o", provider: "openai", modelId: "gpt-4o" },
  // { id: "anthropic:claude", label: "Claude", provider: "anthropic", modelId: "claude-..." },
];

/** The model used when a caller doesn't specify one (keeps existing behaviour). */
export const DEFAULT_MODEL_ID = "openai:gpt-4o-mini";

export function getModel(id: string): ModelDescriptor | undefined {
  return MODEL_REGISTRY.find((m) => m.id === id);
}
