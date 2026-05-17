export interface LLMOptions {
  maxTokens: number;
  temperature: number;
  /** Request structured JSON output. Provider-specific behaviour — best-effort for non-OpenAI providers. */
  json?: boolean;
}

/**
 * Swap the AI provider by implementing this interface and updating getLLMClient().
 * No feature code should import a provider SDK directly.
 */
export interface LLMProvider {
  /** One-shot completion — returns the full text when done. */
  complete(prompt: string, opts: LLMOptions): Promise<string>;
  /** Streaming completion — returns a ReadableStream of text chunks. */
  stream(prompt: string, opts: LLMOptions): Promise<ReadableStream<string>>;
}
