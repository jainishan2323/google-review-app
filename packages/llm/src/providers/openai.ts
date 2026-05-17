import OpenAI from "openai";
import type { LLMProvider, LLMOptions } from "./types";

export class OpenAIProvider implements LLMProvider {
  private readonly client: OpenAI;
  /** Override at call-site if needed; defaults to the cost-optimised mini model. */
  readonly defaultModel = "gpt-4o-mini";

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        '[LLM] OPENAI_API_KEY is not set. Add it to your .env.local file.'
      );
    }
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async complete(prompt: string, opts: LLMOptions): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.defaultModel,
      messages: [{ role: "user", content: prompt }],
      max_tokens: opts.maxTokens,
      temperature: opts.temperature,
      ...(opts.json ? { response_format: { type: "json_object" as const } } : {}),
    });
    return response.choices[0]?.message?.content?.trim() ?? "";
  }

  async stream(prompt: string, opts: LLMOptions): Promise<ReadableStream<string>> {
    const openaiStream = await this.client.chat.completions.create({
      model: this.defaultModel,
      messages: [{ role: "user", content: prompt }],
      max_tokens: opts.maxTokens,
      temperature: opts.temperature,
      stream: true,
    });

    return new ReadableStream<string>({
      async start(controller) {
        try {
          for await (const chunk of openaiStream) {
            const text = chunk.choices[0]?.delta?.content ?? "";
            if (text) controller.enqueue(text);
          }
        } finally {
          controller.close();
        }
      },
    });
  }
}
