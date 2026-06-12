# Model selection is a code registry with a per-call override, not just LLM_PROVIDER

**Status:** accepted

Until now the LLM layer chose a provider from the `LLM_PROVIDER` env var
(`getLLMClient()` in `packages/llm/src/client.ts`) and each provider hard-coded its
model (`OpenAIProvider.defaultModel = "gpt-4o-mini"`). That is fine for the one path
production runs, but it cannot express "run *this one request* against a *different*
model" — which the new Lantern **review playground** needs to compare models on the
same scenario, and which we'll want as we connect additional models. We extend the
seam rather than overload the env var.

## Decisions

- **A code-defined model registry is the source of truth for "which models exist."**
  `packages/llm/src/models.ts` exports `MODEL_REGISTRY: ModelDescriptor[]`, where a
  descriptor is `{ id, label, provider, modelId }` — `provider` selects the
  `LLMProvider` implementation, `modelId` is the exact SDK model string. UI (the
  playground dropdown) and any future multi-model feature read this list instead of
  hard-coding model strings. **Connecting a new model = adding one entry** (plus a new
  provider class + API key if it needs a provider we don't have yet). In code, not the
  DB: there is one Operator and models change rarely, so a typed list + deploy beats a
  table + admin CRUD — same reasoning as the Taxonomy Templates (ADR-0006).
- **Model is a per-call option, threaded through `LLMOptions.model`.** Providers use
  `opts.model ?? this.defaultModel`, so omitting it preserves today's behaviour exactly.
  `generateReviewText` / `streamReviewText` take an optional `ModelDescriptor`; the form
  path passes nothing and keeps the env default, the playground passes a descriptor.
- **`getLLMClient(provider?)` accepts an explicit provider name.** With no argument it
  still resolves the env default (`LLM_PROVIDER`), so feature code is unchanged; passing
  a name targets a specific provider regardless of env. This is what lets one Run hit
  several providers at once. The "never import a provider SDK in feature code" rule
  (CLAUDE.md) is intact — selection still goes through the registry + `getLLMClient`.
- **The prompt is not part of this seam.** Model is selectable; the prompt stays in code
  (ADR-0007). The playground previews the assembled prompt via the new exported
  `buildReviewPrompt`, but never edits it.

## Consequences

- **CLAUDE.md's "swap the provider via `LLM_PROVIDER`" is now the *default*-selection
  story, not the only one.** A reader who only knows the env var will miss that any
  registry model can be selected per call. The env var still sets the default for the
  forms; the registry + override is the addition.
- **Adding a provider is now two coordinated edits** — a `ModelDescriptor` entry and a
  matching `case` in `getLLMClient` (plus the provider class + key). A registry entry
  whose `provider` has no `case` will throw at call time, not build time; that is the
  one sharp edge to watch when wiring the next model.
- **No per-model cost/limit handling yet.** The registry carries identity only. Token
  caps and temperature still come from each call site (e.g. the generator's
  `maxTokens: 80`); if models diverge enough to need per-model knobs, the descriptor is
  where they'd go.
