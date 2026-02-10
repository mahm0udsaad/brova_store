/**
 * Social Media Publishing API
 *
 * POST /api/social/publish - Create and publish content to social media
 * GET /api/social/publish?postId={id} - Check publish status
 */

import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getConnectionWithRefresh } from "@/lib/social/token-manager"
import { getTikTokClient } from "@/lib/social/tiktok"
import { getInstagramClient } from "@/lib/social/instagram"
import { z } from "zod"

// ============================================================================
// Request Validation
// ============================================================================

const publishRequestSchema = z.object({
  connectionId: z.string().uuid(),
  caption: z.string().min(1).max(2200),
  captionAr: z.string().optional(),
  mediaUrls: z.array(z.string().url()).min(1).max(1), // Single media for now
  hashtags: z.array(z.string()).optional(),
  ctaText: z.string().optional(),
  ctaUrl: z.string().url().optional(),
  scheduledAt: z.string().datetime().optional(),
})

// ============================================================================
// POST - Publish Content
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

    // Parse and validate request
    const body = await req.json()
    const validationResult = publishRequestSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: validationResult.error.errors,
        },
        { status: 400 }
      )
    }

    const request = validationResult.data

    // Get connection with auto-refresh
    const connection = await getConnectionWithRefresh(request.connectionId)

    // Verify user owns the connection's store
    const { data: store } = await supabase
      .from("stores")
      .select("organization_id")
      .eq("id", connection.storeId)
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
        { error: "You do not have access to this connection" },
        { status: 403 }
      )
    }

    // Check if scheduled for future
    const scheduledAt = request.scheduledAt
      ? new Date(request.scheduledAt)
      : null

    if (scheduledAt && scheduledAt > new Date()) {
      // Create draft post for scheduled publishing
      const { data: post, error: insertError } = await supabase
        .from("social_media_posts")
        .insert({
          store_id: connection.storeId,
          connection_id: connection.id,
          platform: connection.platform,
          caption: request.caption,
          caption_ar: request.captionAr || null,
          media_urls: request.mediaUrls,
          hashtags: request.hashtags || null,
          cta_text: request.ctaText || null,
          cta_url: request.ctaUrl || null,
          status: "scheduled",
          scheduled_at: scheduledAt.toISOString(),
        } as any)
        .select()
        .single()

      if (insertError) {
        throw new Error(`Failed to create scheduled post: ${insertError.message}`)
      }

      return NextResponse.json({
        success: true,
        post: {
          id: post.id,
          status: "scheduled",
          scheduledAt: post.scheduled_at,
        },
        message: "Post scheduled successfully",
      })
    }

    // Publish immediately
    const mediaUrl = request.mediaUrls[0]
    const caption = request.caption
    let platformPostId: string | undefined
    let platformUrl: string | undefined

    try {
      if (connection.platform === "tiktok") {
        const client = getTikTokClient()
        const result = await client.publishVideo(connection.accessToken, {
          video_url: mediaUrl,
          caption,
          privacy_level: "PUBLIC_TO_EVERYONE",
        })
        platformPostId = result.publish_id
      } else if (connection.platform === "instagram") {
        const client = getInstagramClient()

        // Determine media type from URL
        const isVideo =
          mediaUrl.endsWith(".mp4") ||
          mediaUrl.endsWith(".mov") ||
          mediaUrl.includes("video")

        // Create media container
        const container = await client.createMediaContainer(
          connection.accountId,
          connection.accessToken,
          {
            image_url: isVideo ? undefined : mediaUrl,
            video_url: isVideo ? mediaUrl : undefined,
            caption,
            media_type: isVideo ? "VIDEO" : "IMAGE",
          }
        )

        // Wait a bit for Instagram to process the media
        await new Promise((resolve) => setTimeout(resolve, 3000))

        // Publish media
        const published = await client.publishMedia(
          connection.accountId,
          connection.accessToken,
          container.id
        )

        platformPostId = published.id

        // Get permalink
        const mediaInfo = await client.getMediaInfo(
          published.id,
          connection.accessToken
        )
        platformUrl = mediaInfo.permalink
      }

      // Create post record in database
      const { data: post, error: insertError } = await supabase
        .from("social_media_posts")
        .insert({
          store_id: connection.storeId,
          connection_id: connection.id,
          platform: connection.platform,
          caption: request.caption,
          caption_ar: request.captionAr || null,
          media_urls: request.mediaUrls,
          hashtags: request.hashtags || null,
          cta_text: request.ctaText || null,
          cta_url: request.ctaUrl || null,
          status: "published",
          platform_post_id: platformPostId,
          platform_url: platformUrl,
          published_at: new Date().toISOString(),
        } as any)
        .select()
        .single()

      if (insertError) {
        console.error("Failed to save post record:", insertError)
      }

      return NextResponse.json({
        success: true,
        post: {
          id: post?.id,
          status: "published",
          platformPostId,
          platformUrl,
          publishedAt: post?.published_at,
        },
        message: "Content published successfully",
      })
    } catch (publishError: any) {
      console.error("Publishing error:", publishError)

      // Create failed post record
      await supabase.from("social_media_posts").insert({
        store_id: connection.storeId,
        connection_id: connection.id,
        platform: connection.platform,
        caption: request.caption,
        caption_ar: request.captionAr || null,
        media_urls: request.mediaUrls,
        hashtags: request.hashtags || null,
        status: "failed",
        error: publishError.message,
      } as any)

      throw publishError
    }
  } catch (error: any) {
    console.error("Publish API error:", error)
    return NextResponse.json(
      {
        error: "Failed to publish content",
        message: error.message,
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET - Check Publish Status
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const postId = searchParams.get("postId")
    const storeId = searchParams.get("storeId")

    // Authenticate user
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get post by ID or list posts for store
    if (postId) {
      const { data: post, error } = await supabase
        .from("social_media_posts")
        .select("*")
        .eq("id", postId)
        .single()

      if (error || !post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 })
      }

      // Verify ownership
      const { data: store } = await supabase
        .from("stores")
        .select("organization_id")
        .eq("id", post.store_id)
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
          { error: "You do not have access to this post" },
          { status: 403 }
        )
      }

      return NextResponse.json({
        success: true,
        post,
      })
    }

    if (storeId) {
      // Verify ownership
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

      // List posts
      const { data: posts, error } = await supabase
        .from("social_media_posts")
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) {
        throw new Error(`Failed to fetch posts: ${error.message}`)
      }

      return NextResponse.json({
        success: true,
        posts: posts || [],
      })
    }

    return NextResponse.json(
      { error: "Missing postId or storeId parameter" },
      { status: 400 }
    )
  } catch (error: any) {
    console.error("Get publish status error:", error)
    return NextResponse.json(
      {
        error: "Failed to get publish status",
        message: error.message,
      },
      { status: 500 }
    )
  }
}
