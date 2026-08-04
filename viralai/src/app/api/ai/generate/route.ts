import { NextResponse } from "next/server";
import { callAI as placeholderCallAI } from "@/lib/ai/placeholders";
import type { AIRequestOptions } from "@/lib/ai/types";

/**
 * OpenAI API route — ready for integration.
 * Set OPENAI_API_KEY in environment variables to enable live generation.
 *
 * Example OpenAI integration:
 * ```
 * const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
 * const completion = await openai.chat.completions.create({
 *   model: "gpt-4o-mini",
 *   messages: [{ role: "user", content: buildPrompt(type, options) }],
 * });
 * ```
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { type, ...options } = body as { type: string } & AIRequestOptions;

  if (!process.env.OPENAI_API_KEY) {
    const result = await placeholderCallAI(type, options);
    return NextResponse.json(result);
  }

  // TODO: Replace with OpenAI API call when key is configured
  const result = await placeholderCallAI(type, options);
  return NextResponse.json(result);
}
