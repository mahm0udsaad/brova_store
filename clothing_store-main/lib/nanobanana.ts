import { createClient } from "@/lib/supabase/server";

// NanoBanana API configuration
const NANOBANANA_API_URL = "https://api.nanobananaapi.ai/api/v1/nanobanana";
const NANOBANANA_API_KEY = process.env.NANO_BANANA_API_KEY || "";

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

// Retry delay with exponential backoff
export function calculateRetryDelay(attempt: number): number {
  return INITIAL_RETRY_DELAY * Math.pow(2, attempt);
}

// Sleep utility
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Validate image file
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(", ")}`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
    };
  }

  return { valid: true };
}

// Upload image to Supabase Storage and get Public URL
export async function uploadImageToSupabase(file: File, folder: string = "try-on"): Promise<string> {
  const supabase = await createClient();
  const fileName = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;

  const bucketName = "try-on"; // Ensure this bucket exists in Supabase project and is public

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("Supabase upload error:", uploadError);
    throw new Error(`Failed to upload image to storage: ${uploadError.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucketName)
    .getPublicUrl(fileName);

  return publicUrl;
}

// Poll NanoBanana API for task completion
export async function pollTaskCompletion(taskId: string): Promise<string> {
  const maxPollAttempts = 60; // Poll for up to 60 attempts (60 seconds with 1s interval)
  const pollInterval = 1000; // 1 second

  for (let attempt = 0; attempt < maxPollAttempts; attempt++) {
    await sleep(pollInterval);

    const statusResponse = await fetch(
      `${NANOBANANA_API_URL}/record-info?taskId=${taskId}`,
      {
        headers: {
          Authorization: `Bearer ${NANOBANANA_API_KEY}`,
        },
      }
    );

    if (!statusResponse.ok) {
      throw new Error(`Failed to check task status: ${statusResponse.statusText}`);
    }

    const statusData = await statusResponse.json();
    const { successFlag, response, errorMessage } = statusData.data || {};

    // successFlag: 0 = GENERATING, 1 = SUCCESS, 2 = CREATE_TASK_FAILED, 3 = GENERATE_FAILED
    if (successFlag === 1) {
      // Success - return the result image URL
      const resultImageUrl = response?.resultImageUrl || response?.originImageUrl;
      if (!resultImageUrl) {
        throw new Error("No result image URL in response");
      }
      console.log(`NanoBanana task completed: ${resultImageUrl}`);
      return resultImageUrl;
    } else if (successFlag === 2 || successFlag === 3) {
      // Failed
      throw new Error(`Image generation failed: ${errorMessage || "Unknown error"}`);
    }

    // Still generating (successFlag === 0), continue polling
    console.log(`Polling attempt ${attempt + 1}/${maxPollAttempts}...`);
  }

  throw new Error("Timeout waiting for image generation");
}

// Call NanoBanana API to generate image
export async function generateWithNanoBanana(
  prompt: string,
  imageUrls: string[],
  imageSize: string = "3:4"
): Promise<string> {
  if (!NANOBANANA_API_KEY) {
    throw new Error("NanoBanana API key not configured");
  }

  // Generate image using NanoBanana API
  const requestBody = {
    prompt,
    type: "IMAGETOIAMGE", // Corrected enum value
    imageUrls,
    numImages: 1,
    image_size: imageSize,
  };

  console.log("NanoBanana Request Payload:", JSON.stringify(requestBody, null, 2));

  const generateResponse = await fetch(`${NANOBANANA_API_URL}/generate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NANOBANANA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!generateResponse.ok) {
    const errorData = await generateResponse.json().catch(() => ({}));
    console.error("NanoBanana API Error Response:", {
      status: generateResponse.status,
      statusText: generateResponse.statusText,
      data: errorData
    });
    throw new Error(
      `NanoBanana API error: ${generateResponse.status} ${errorData.msg || generateResponse.statusText}`
    );
  }

  const generateData = await generateResponse.json();
  
  // Check for logical error in 200 OK response
  if (generateData.code && generateData.code !== 200) {
    throw new Error(
      `NanoBanana API error (logic): ${generateData.code} ${generateData.msg || "Unknown error"}`
    );
  }

  const taskId = generateData.data?.taskId;

  if (!taskId) {
    console.error("NanoBanana API response missing taskId:", JSON.stringify(generateData, null, 2));
    throw new Error("No taskId returned from NanoBanana API");
  }

  console.log(`NanoBanana task created: ${taskId}`);

  // Poll for completion
  return await pollTaskCompletion(taskId);
}

// Generate with retry logic
export async function generateWithRetry(
  prompt: string,
  imageUrls: string[],
  imageSize: string = "3:4"
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const resultImageUrl = await generateWithNanoBanana(prompt, imageUrls, imageSize);
      return resultImageUrl;
    } catch (error: any) {
      lastError = error;
      console.error(`Attempt ${attempt + 1} failed:`, error);

      // Check if we should retry
      const isRetryable =
        error?.message?.includes("503") || // Service unavailable
        error?.message?.includes("429") || // Rate limit
        error?.message?.includes("500") || // Internal server error
        error?.code === "ECONNRESET" ||
        error?.code === "ETIMEDOUT";

      if (isRetryable && attempt < MAX_RETRIES - 1) {
        const delay = calculateRetryDelay(attempt);
        console.log(`Retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }

      // If not retryable or final attempt, throw
      if (attempt === MAX_RETRIES - 1) {
        throw lastError;
      }
    }
  }

  throw lastError || new Error("Failed to generate result");
}

// Resolve relative URL to absolute URL
export function resolveProductUrl(url: string): string {
  if (url.startsWith("/")) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.brova.shop";
    return `${baseUrl}${url}`;
  }
  return url;
}
