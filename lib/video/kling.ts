/**
 * Kling AI Video Generation Client
 *
 * Provides text-to-video and image-to-video generation using Kling AI API
 * API Docs: https://docs.klingai.com
 */

import crypto from "crypto"

// ============================================================================
// Types
// ============================================================================

export interface KlingConfig {
  accessKey: string
  secretKey: string
  baseUrl?: string
}

export interface KlingTextToVideoRequest {
  prompt: string
  negative_prompt?: string
  duration: number // seconds (5 or 10)
  aspect_ratio: "16:9" | "9:16" | "1:1"
  cfg_scale?: number // 1-10, default 5
  seed?: number
  mode?: "std" | "pro"
}

export interface KlingImageToVideoRequest {
  image_url: string
  prompt: string
  negative_prompt?: string
  duration: number // seconds (5 or 10)
  aspect_ratio?: "16:9" | "9:16" | "1:1"
  cfg_scale?: number
  seed?: number
  mode?: "std" | "pro"
}

export interface KlingVideoTask {
  task_id: string
  status: "pending" | "processing" | "succeed" | "failed"
  video_url?: string
  thumbnail_url?: string
  progress?: number
  error?: {
    code: string
    message: string
  }
  created_at: number
  updated_at: number
}

export interface KlingCreateTaskResponse {
  code: number
  message: string
  data: {
    task_id: string
  }
  request_id: string
}

export interface KlingGetTaskResponse {
  code: number
  message: string
  data: KlingVideoTask
  request_id: string
}

// ============================================================================
// Kling AI Client
// ============================================================================

export class KlingClient {
  private config: Required<KlingConfig>

  constructor(config: KlingConfig) {
    this.config = {
      accessKey: config.accessKey,
      secretKey: config.secretKey,
      baseUrl: config.baseUrl || "https://api.klingai.com",
    }

    if (!this.config.accessKey || !this.config.secretKey) {
      throw new Error("Kling AI: accessKey and secretKey are required")
    }
  }

  /**
   * Generate video from text prompt
   */
  async createTextToVideo(
    request: KlingTextToVideoRequest
  ): Promise<KlingCreateTaskResponse> {
    return this.makeRequest("/v1/videos/text2video", {
      method: "POST",
      body: JSON.stringify({
        model: "kling-v1.6",
        prompt: request.prompt,
        negative_prompt: request.negative_prompt,
        duration: request.duration,
        aspect_ratio: request.aspect_ratio,
        cfg_scale: request.cfg_scale ?? 5,
        seed: request.seed,
        mode: request.mode ?? "std",
      }),
    })
  }

  /**
   * Generate video from image + text prompt
   */
  async createImageToVideo(
    request: KlingImageToVideoRequest
  ): Promise<KlingCreateTaskResponse> {
    return this.makeRequest("/v1/videos/image2video", {
      method: "POST",
      body: JSON.stringify({
        model: "kling-v1.6",
        image_url: request.image_url,
        prompt: request.prompt,
        negative_prompt: request.negative_prompt,
        duration: request.duration,
        aspect_ratio: request.aspect_ratio,
        cfg_scale: request.cfg_scale ?? 5,
        seed: request.seed,
        mode: request.mode ?? "std",
      }),
    })
  }

  /**
   * Get task status and result
   */
  async getTask(taskId: string): Promise<KlingGetTaskResponse> {
    return this.makeRequest(`/v1/videos/tasks/${taskId}`, {
      method: "GET",
    })
  }

  /**
   * Poll task until completion or timeout
   */
  async pollTask(
    taskId: string,
    options: {
      intervalMs?: number
      timeoutMs?: number
      onProgress?: (task: KlingVideoTask) => void
    } = {}
  ): Promise<KlingVideoTask> {
    const intervalMs = options.intervalMs ?? 5000
    const timeoutMs = options.timeoutMs ?? 300000 // 5 minutes default
    const startTime = Date.now()

    while (true) {
      const response = await this.getTask(taskId)

      if (response.code !== 0) {
        throw new Error(`Kling API error: ${response.message}`)
      }

      const task = response.data

      // Notify progress
      if (options.onProgress) {
        options.onProgress(task)
      }

      // Terminal states
      if (task.status === "succeed") {
        return task
      }

      if (task.status === "failed") {
        throw new Error(
          task.error
            ? `Video generation failed: ${task.error.message}`
            : "Video generation failed"
        )
      }

      // Check timeout
      if (Date.now() - startTime > timeoutMs) {
        throw new Error("Video generation timed out")
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, intervalMs))
    }
  }

  /**
   * Make authenticated request to Kling API
   */
  private async makeRequest(
    path: string,
    options: {
      method: "GET" | "POST"
      body?: string
    }
  ): Promise<any> {
    const token = this.generateJWT()

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    }

    if (options.body) {
      headers["Content-Type"] = "application/json"
    }

    const url = `${this.config.baseUrl}${path}`

    const response = await fetch(url, {
      method: options.method,
      headers,
      body: options.body,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `Kling API request failed: ${response.status} ${response.statusText} - ${errorText}`
      )
    }

    return response.json()
  }

  /**
   * Generate JWT token for Kling API authentication (HS256)
   */
  private generateJWT(): string {
    const now = Math.floor(Date.now() / 1000)

    const header = { alg: "HS256", typ: "JWT" }
    const payload = {
      iss: this.config.accessKey,
      exp: now + 1800, // 30 minutes
      nbf: now - 5,
    }

    const encode = (obj: object) =>
      Buffer.from(JSON.stringify(obj))
        .toString("base64url")

    const headerB64 = encode(header)
    const payloadB64 = encode(payload)
    const signature = crypto
      .createHmac("sha256", this.config.secretKey)
      .update(`${headerB64}.${payloadB64}`)
      .digest("base64url")

    return `${headerB64}.${payloadB64}.${signature}`
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let klingClientInstance: KlingClient | null = null

export function getKlingClient(): KlingClient {
  if (!klingClientInstance) {
    const accessKey = process.env.KLING_ACCESS_KEY
    const secretKey = process.env.KLING_SECRET_KEY

    if (!accessKey || !secretKey) {
      throw new Error(
        "Kling AI credentials not found. Please set KLING_ACCESS_KEY and KLING_SECRET_KEY environment variables."
      )
    }

    klingClientInstance = new KlingClient({
      accessKey,
      secretKey,
    })
  }

  return klingClientInstance
}
