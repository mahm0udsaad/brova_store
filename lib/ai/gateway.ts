import { generateText, generateObject, streamText } from "ai"
import { z, type ZodSchema } from "zod"

/**
 * Vercel AI Gateway Configuration
 * 
 * Uses Vercel's unified AI Gateway which automatically routes requests when:
 * - AI_GATEWAY_API_KEY environment variable is set
 * - Model identifier uses the format: provider/model-name
 * 
 * Documentation: https://vercel.com/docs/ai-gateway/capabilities/image-generation/ai-sdk
 */

// Model registry with Vercel AI Gateway format (provider/model-name)
// Nano Banana models support multimodal text + image generation
export const models = {
  // Multimodal model with image generation capabilities
  // Fast and efficient for orchestration and image analysis
  pro: "openai/gpt-5.2" as any,
  flash: "google/gemini-3-flash" as any,
  vision: "google/gemini-2.5-flash-image" as any,
  
  // Higher quality image generation (use if needed for better outputs)
  // pro: "google/gemini-3-pro-image",
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
