/**
 * Video Generation Pipeline
 *
 * Orchestrates video generation workflow:
 * 1. Create task in database
 * 2. Submit to Kling AI
 * 3. Poll for completion
 * 4. Download and store video
 * 5. Update database with results
 */

import { getKlingClient, type KlingVideoTask } from "./kling"
import { createServerClient } from "@/lib/supabase/server"
import type {
  VideoGenerationRequest,
  VideoGenerationTask,
  VideoTaskStatus,
} from "@/types/ai"

// ============================================================================
// Pipeline Functions
// ============================================================================

/**
 * Create a new video generation task
 */
export async function createVideoTask(
  request: VideoGenerationRequest
): Promise<VideoGenerationTask> {
  const supabase = await createServerClient()

  // Insert task into database
  const { data, error } = await supabase
    .from("video_generation_tasks")
    .insert({
      store_id: request.storeId,
      type: request.type,
      prompt: request.prompt,
      prompt_ar: request.promptAr,
      source_image: request.sourceImage,
      aspect_ratio: request.aspectRatio,
      duration: request.duration,
      style: request.style,
      text_overlay: request.addTextOverlay
        ? (request.addTextOverlay as any)
        : null,
      provider: "kling",
      model: "kling-v1.6",
      status: "pending",
    } as any)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create video task: ${error.message}`)
  }

  return {
    id: data.id,
    storeId: data.store_id,
    status: data.status as VideoTaskStatus,
    provider: "kling",
    request,
    createdAt: new Date(data.created_at),
  }
}

/**
 * Start video generation (submit to Kling AI)
 */
export async function startVideoGeneration(
  taskId: string
): Promise<{ providerJobId: string }> {
  const supabase = await createServerClient()
  const kling = getKlingClient()

  // Get task from database
  const { data: task, error: fetchError } = await supabase
    .from("video_generation_tasks")
    .select("*")
    .eq("id", taskId)
    .single()

  if (fetchError || !task) {
    throw new Error(`Task not found: ${taskId}`)
  }

  try {
    // Submit to Kling AI
    let response

    if (task.type === "text_to_video") {
      response = await kling.createTextToVideo({
        prompt: task.prompt,
        duration: task.duration,
        aspect_ratio: task.aspect_ratio as any,
        mode: "std",
      })
    } else if (task.type === "image_to_video") {
      if (!task.source_image) {
        throw new Error("source_image is required for image_to_video")
      }

      response = await kling.createImageToVideo({
        image_url: task.source_image,
        prompt: task.prompt,
        duration: task.duration,
        aspect_ratio: task.aspect_ratio as any,
        mode: "std",
      })
    } else {
      throw new Error(`Unsupported video type: ${task.type}`)
    }

    if (response.code !== 0) {
      throw new Error(`Kling API error: ${response.message}`)
    }

    const providerJobId = response.data.task_id

    // Update database with provider job ID
    const { error: updateError } = await supabase
      .from("video_generation_tasks")
      .update({
        status: "processing",
        provider_job_id: providerJobId,
        started_at: new Date().toISOString(),
      })
      .eq("id", taskId)

    if (updateError) {
      throw new Error(`Failed to update task: ${updateError.message}`)
    }

    return { providerJobId }
  } catch (error: any) {
    // Update task with error
    await supabase
      .from("video_generation_tasks")
      .update({
        status: "failed",
        error: error.message,
      })
      .eq("id", taskId)

    throw error
  }
}

/**
 * Check video generation status
 */
export async function checkVideoStatus(
  taskId: string
): Promise<VideoGenerationTask> {
  const supabase = await createServerClient()

  const { data: task, error } = await supabase
    .from("video_generation_tasks")
    .select("*")
    .eq("id", taskId)
    .single()

  if (error || !task) {
    throw new Error(`Task not found: ${taskId}`)
  }

  // If task is already in a terminal state, return it
  if (
    task.status === "completed" ||
    task.status === "failed" ||
    task.status === "expired"
  ) {
    return mapDbTaskToApiTask(task)
  }

  // If no provider job ID yet, it's still pending
  if (!task.provider_job_id) {
    return mapDbTaskToApiTask(task)
  }

  // Poll Kling AI for status
  try {
    const kling = getKlingClient()
    const response = await kling.getTask(task.provider_job_id)

    if (response.code !== 0) {
      throw new Error(`Kling API error: ${response.message}`)
    }

    const klingTask = response.data

    // Update database with progress
    const updates: any = {
      progress: klingTask.progress,
      provider_metadata: klingTask,
    }

    // Map Kling status to our status
    if (klingTask.status === "succeed") {
      updates.status = "completed"
      updates.result_url = klingTask.video_url
      updates.thumbnail_url = klingTask.thumbnail_url
      updates.completed_at = new Date().toISOString()
    } else if (klingTask.status === "failed") {
      updates.status = "failed"
      updates.error = klingTask.error?.message || "Unknown error"
    } else if (klingTask.status === "processing") {
      updates.status = "processing"
    }

    const { error: updateError } = await supabase
      .from("video_generation_tasks")
      .update(updates)
      .eq("id", taskId)

    if (updateError) {
      console.error("Failed to update task:", updateError)
    }

    // Fetch updated task
    const { data: updatedTask } = await supabase
      .from("video_generation_tasks")
      .select("*")
      .eq("id", taskId)
      .single()

    return mapDbTaskToApiTask(updatedTask || task)
  } catch (error: any) {
    console.error("Error checking video status:", error)

    // Update task with error if it's in processing state
    if (task.status === "processing") {
      await supabase
        .from("video_generation_tasks")
        .update({
          status: "failed",
          error: error.message,
        })
        .eq("id", taskId)
    }

    throw error
  }
}

/**
 * Poll video generation until completion
 */
export async function pollVideoGeneration(
  taskId: string,
  options: {
    intervalMs?: number
    timeoutMs?: number
    onProgress?: (task: VideoGenerationTask) => void
  } = {}
): Promise<VideoGenerationTask> {
  const intervalMs = options.intervalMs ?? 10000 // 10 seconds
  const timeoutMs = options.timeoutMs ?? 600000 // 10 minutes
  const startTime = Date.now()

  while (true) {
    const task = await checkVideoStatus(taskId)

    // Notify progress callback
    if (options.onProgress) {
      options.onProgress(task)
    }

    // Terminal states
    if (task.status === "completed") {
      return task
    }

    if (task.status === "failed" || task.status === "expired") {
      throw new Error(
        task.error || `Video generation ${task.status}`
      )
    }

    // Check timeout
    if (Date.now() - startTime > timeoutMs) {
      const supabase = await createServerClient()
      await supabase
        .from("video_generation_tasks")
        .update({
          status: "failed",
          error: "Generation timed out",
        })
        .eq("id", taskId)

      throw new Error("Video generation timed out")
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }
}

/**
 * Generate video end-to-end (create + start + poll)
 */
export async function generateVideo(
  request: VideoGenerationRequest,
  options?: {
    pollIntervalMs?: number
    pollTimeoutMs?: number
    onProgress?: (task: VideoGenerationTask) => void
  }
): Promise<VideoGenerationTask> {
  // Step 1: Create task in database
  const task = await createVideoTask(request)

  // Step 2: Start generation (submit to Kling AI)
  await startVideoGeneration(task.id)

  // Step 3: Poll until completion
  return pollVideoGeneration(task.id, {
    intervalMs: options?.pollIntervalMs,
    timeoutMs: options?.pollTimeoutMs,
    onProgress: options?.onProgress,
  })
}

/**
 * List video tasks for a store
 */
export async function listVideoTasks(
  storeId: string,
  options: {
    limit?: number
    offset?: number
    status?: VideoTaskStatus
  } = {}
): Promise<VideoGenerationTask[]> {
  const supabase = await createServerClient()

  let query = supabase
    .from("video_generation_tasks")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })

  if (options.status) {
    query = query.eq("status", options.status)
  }

  if (options.limit) {
    query = query.limit(options.limit)
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to list video tasks: ${error.message}`)
  }

  return (data || []).map(mapDbTaskToApiTask)
}

/**
 * Cancel a video generation task
 */
export async function cancelVideoTask(taskId: string): Promise<void> {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from("video_generation_tasks")
    .update({
      status: "failed",
      error: "Cancelled by user",
    })
    .eq("id", taskId)
    .in("status", ["pending", "processing"])

  if (error) {
    throw new Error(`Failed to cancel task: ${error.message}`)
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapDbTaskToApiTask(dbTask: any): VideoGenerationTask {
  return {
    id: dbTask.id,
    storeId: dbTask.store_id,
    status: dbTask.status as VideoTaskStatus,
    provider: "kling",
    request: {
      storeId: dbTask.store_id,
      type: dbTask.type,
      prompt: dbTask.prompt,
      promptAr: dbTask.prompt_ar,
      sourceImage: dbTask.source_image,
      aspectRatio: dbTask.aspect_ratio,
      duration: dbTask.duration,
      style: dbTask.style,
      addTextOverlay: dbTask.text_overlay
        ? (dbTask.text_overlay as any)
        : undefined,
    },
    progress: dbTask.progress,
    resultUrl: dbTask.result_url,
    thumbnailUrl: dbTask.thumbnail_url,
    error: dbTask.error,
    createdAt: new Date(dbTask.created_at),
    startedAt: dbTask.started_at ? new Date(dbTask.started_at) : undefined,
    completedAt: dbTask.completed_at ? new Date(dbTask.completed_at) : undefined,
    expiresAt: dbTask.expires_at ? new Date(dbTask.expires_at) : undefined,
  }
}
