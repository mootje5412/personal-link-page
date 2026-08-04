import type { AIRequestOptions, AIResponse } from "./types";
import { callAI as placeholderCallAI } from "./placeholders";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const USE_OPENAI = Boolean(OPENAI_API_KEY);

/**
 * Main AI client — routes to OpenAI when configured, otherwise uses placeholders.
 * Set OPENAI_API_KEY in .env.local to enable live generation.
 */
export async function callAI<T>(
  type: string,
  options: AIRequestOptions
): Promise<AIResponse<T>> {
  if (USE_OPENAI) {
    return callOpenAI<T>(type, options);
  }
  return placeholderCallAI<T>(type, options);
}

async function callOpenAI<T>(
  type: string,
  options: AIRequestOptions
): Promise<AIResponse<T>> {
  const response = await fetch("/api/ai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, ...options }),
  });

  if (!response.ok) {
    throw new Error("AI generation failed");
  }

  return response.json();
}

export { USE_OPENAI };
