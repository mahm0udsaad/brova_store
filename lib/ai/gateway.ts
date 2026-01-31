import { generateText, generateObject, streamText } from "ai"
import { createGateway } from "@ai-sdk/gateway"
import { type ZodSchema } from "zod"

const gw = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY ?? "",
})

export const models = {
  pro: gw("openai/gpt-5.2"),
  flash: gw("google/gemini-3-flash"),
  vision: gw("google/gemini-2.5-flash-image"),
}

// Type for generation options
type GenerateOptions = Parameters<typeof generateText>[0]

// Delay utility
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Unified generation with retry
export async function generateWithRetry(
  options: GenerateOptions,
  retries = 3
): Promise<Awaited<ReturnType<typeof generateText>>> {
  for (let i = 0; i < retries; i++) {
    try {
      return await generateText(options)
    } catch (error) {
      console.error(`Generation attempt ${i + 1} failed:`, error)
      if (i === retries - 1) throw error
      await delay(1000 * Math.pow(2, i)) // Exponential backoff
    }
  }
  throw new Error("All retry attempts failed")
}

// Structured output with Zod validation
export async function generateStructured<T>(
  schema: ZodSchema<T>,
  options: Omit<GenerateOptions, "schema">
): Promise<T> {
  const result = await generateObject({ ...options, schema, output: "object" })
  return result.object
}

// Stream text with error handling
export async function streamWithRetry(
  options: Parameters<typeof streamText>[0],
  retries = 2
): Promise<Awaited<ReturnType<typeof streamText>>> {
  for (let i = 0; i < retries; i++) {
    try {
      return await streamText(options)
    } catch (error) {
      console.error(`Stream attempt ${i + 1} failed:`, error)
      if (i === retries - 1) throw error
      await delay(500 * Math.pow(2, i))
    }
  }
  throw new Error("All stream attempts failed")
}
