/**
 * Video Generation API Endpoint
 *
 * POST /api/video/generate - Create and start video generation
 * GET /api/video/generate?taskId={id} - Check video status
 */

import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import {
  createVideoTask,
  startVideoGeneration,
  checkVideoStatus,
  listVideoTasks,
} from "@/lib/video/pipeline"
import type { VideoGenerationRequest } from "@/types/ai"
import { z } from "zod"

// ============================================================================
// Request Validation
// ============================================================================

const videoGenerationSchema = z.object({
  storeId: z.string().uuid(),
  type: z.enum(["text_to_video", "image_to_video"]),
  prompt: z.string().min(1).max(1000),
  promptAr: z.string().optional(),
  sourceImage: z.string().url().optional(),
  aspectRatio: z.enum(["16:9", "9:16", "1:1"]).default("16:9"),
  duration: z.number().min(5).max(10).default(5),
  style: z
    .enum(["cinematic", "commercial", "minimal", "dynamic", "elegant", "playful"])
    .optional(),
  addTextOverlay: z
    .object({
      text: z.string(),
      textAr: z.string().optional(),
      position: z.enum(["top", "center", "bottom"]),
      font: z.string(),
      fontSize: z.number(),
      color: z.string(),
      backgroundColor: z.string().optional(),
      animation: z.enum(["fade", "slide", "none"]).optional(),
    })
    .optional(),
})

// ============================================================================
// POST - Create and Start Video Generation
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse and validate request body
    const body = await req.json()
    const validationResult = videoGenerationSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: validationResult.error.errors,
        },
        { status: 400 }
      )
    }

    const request = validationResult.data as VideoGenerationRequest

    // Verify user owns the store
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id, organization_id")
      .eq("id", request.storeId)
      .single()

    if (storeError || !store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    // Check organization ownership
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("owner_id")
      .eq("id", store.organization_id)
      .single()

    if (orgError || !org || org.owner_id !== user.id) {
      return NextResponse.json(
        { error: "You do not have access to this store" },
        { status: 403 }
      )
    }

    // Validate image-to-video requirements
    if (request.type === "image_to_video" && !request.sourceImage) {
      return NextResponse.json(
        { error: "sourceImage is required for image_to_video" },
        { status: 400 }
      )
    }

    // Create task in database
    const task = await createVideoTask(request)

    // Start generation asynchronously (don't await)
    startVideoGeneration(task.id).catch((error) => {
      console.error("Failed to start video generation:", error)
    })

    // Return task immediately
    return NextResponse.json(
      {
        success: true,
        task: {
          id: task.id,
          status: task.status,
          storeId: task.storeId,
          createdAt: task.createdAt.toISOString(),
        },
        message: "Video generation started. Use GET /api/video/generate?taskId={id} to check status.",
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Video generation error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate video",
        message: error.message,
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET - Check Video Status or List Tasks
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const taskId = searchParams.get("taskId")
    const storeId = searchParams.get("storeId")
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = parseInt(searchParams.get("offset") || "0")

    // If taskId provided, return single task status
    if (taskId) {
      const task = await checkVideoStatus(taskId)

      // Verify user owns the task's store
      const { data: store } = await supabase
        .from("stores")
        .select("organization_id")
        .eq("id", task.storeId)
        .single()

      if (!store) {
        return NextResponse.json({ error: "Store not found" }, { status: 404 })
      }

      const { data: org } = await supabase
        .from("organizations")
        .select("owner_id")
        .eq("id", store.organization_id)
        .single()

      if (!org || org.owner_id !== user.id) {
        return NextResponse.json(
          { error: "You do not have access to this task" },
          { status: 403 }
        )
      }

      return NextResponse.json({
        success: true,
        task,
      })
    }

    // If storeId provided, list tasks for store
    if (storeId) {
      // Verify user owns the store
      const { data: store } = await supabase
        .from("stores")
        .select("organization_id")
        .eq("id", storeId)
        .single()

      if (!store) {
        return NextResponse.json({ error: "Store not found" }, { status: 404 })
      }

      const { data: org } = await supabase
        .from("organizations")
        .select("owner_id")
        .eq("id", store.organization_id)
        .single()

      if (!org || org.owner_id !== user.id) {
        return NextResponse.json(
          { error: "You do not have access to this store" },
          { status: 403 }
        )
      }

      const tasks = await listVideoTasks(storeId, { limit, offset })

      return NextResponse.json({
        success: true,
        tasks,
        pagination: {
          limit,
          offset,
          total: tasks.length,
        },
      })
    }

    return NextResponse.json(
      {
        error: "Missing required parameter: taskId or storeId",
      },
      { status: 400 }
    )
  } catch (error: any) {
    console.error("Video status check error:", error)
    return NextResponse.json(
      {
        error: "Failed to check video status",
        message: error.message,
      },
      { status: 500 }
    )
  }
}
