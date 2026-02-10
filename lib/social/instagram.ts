/**
 * Instagram OAuth & Publishing Integration
 *
 * Implements Facebook Login (OAuth 2.0) for Instagram Business/Creator accounts
 * and Instagram Graph API for content publishing
 *
 * API Docs: https://developers.facebook.com/docs/instagram-api
 * Publishing: https://developers.facebook.com/docs/instagram-api/guides/content-publishing
 */

import { createServerClient } from "@/lib/supabase/server"
import type { SocialMediaConnection } from "@/types/ai"

// ============================================================================
// Types
// ============================================================================

export interface InstagramConfig {
  appId: string
  appSecret: string
  redirectUri: string
}

export interface InstagramAuthUrl {
  url: string
  state: string
}

export interface InstagramTokenResponse {
  access_token: string
  token_type: "bearer"
  expires_in: number // seconds (default 5184000 = 60 days)
}

export interface InstagramLongLivedTokenResponse {
  access_token: string
  token_type: "bearer"
  expires_in: number
}

export interface InstagramAccountInfo {
  id: string
  username: string
  name?: string
  profile_picture_url?: string
  followers_count?: number
  media_count?: number
}

export interface InstagramMediaRequest {
  image_url?: string
  video_url?: string
  caption: string
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL"
  children?: string[] // For carousel posts (media IDs)
}

export interface InstagramMediaResponse {
  id: string // Media container ID
}

export interface InstagramPublishResponse {
  id: string // Published media ID
}

// ============================================================================
// Instagram Client
// ============================================================================

export class InstagramClient {
  private config: InstagramConfig
  private graphUrl = "https://graph.facebook.com/v21.0"
  private authUrl = "https://www.facebook.com/v21.0/dialog/oauth"

  constructor(config: InstagramConfig) {
    this.config = config
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(storeId: string): InstagramAuthUrl {
    // Generate state parameter (includes storeId for callback)
    const state = Buffer.from(
      JSON.stringify({
        storeId,
        timestamp: Date.now(),
        random: Math.random().toString(36),
      })
    ).toString("base64url")

    // Required scopes for Instagram content publishing
    const scopes = [
      "instagram_basic",
      "instagram_content_publish",
      "pages_show_list",
      "pages_read_engagement",
    ]

    const params = new URLSearchParams({
      client_id: this.config.appId,
      redirect_uri: this.config.redirectUri,
      scope: scopes.join(","),
      response_type: "code",
      state,
    })

    return {
      url: `${this.authUrl}?${params.toString()}`,
      state,
    }
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<InstagramTokenResponse> {
    const params = new URLSearchParams({
      client_id: this.config.appId,
      client_secret: this.config.appSecret,
      redirect_uri: this.config.redirectUri,
      code,
    })

    const response = await fetch(
      `${this.graphUrl}/oauth/access_token?${params.toString()}`,
      {
        method: "GET",
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Instagram token exchange failed: ${error}`)
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(
        `Instagram OAuth error: ${data.error.message}`
      )
    }

    return data
  }

  /**
   * Exchange short-lived token for long-lived token (60 days)
   */
  async getLongLivedToken(
    shortLivedToken: string
  ): Promise<InstagramLongLivedTokenResponse> {
    const params = new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: this.config.appId,
      client_secret: this.config.appSecret,
      fb_exchange_token: shortLivedToken,
    })

    const response = await fetch(
      `${this.graphUrl}/oauth/access_token?${params.toString()}`,
      {
        method: "GET",
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to get long-lived token: ${error}`)
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(`Instagram token error: ${data.error.message}`)
    }

    return data
  }

  /**
   * Refresh long-lived access token (before 60 days expire)
   */
  async refreshLongLivedToken(
    accessToken: string
  ): Promise<InstagramLongLivedTokenResponse> {
    const params = new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: this.config.appId,
      client_secret: this.config.appSecret,
      fb_exchange_token: accessToken,
    })

    const response = await fetch(
      `${this.graphUrl}/oauth/access_token?${params.toString()}`,
      {
        method: "GET",
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to refresh token: ${error}`)
    }

    return response.json()
  }

  /**
   * Get Instagram Business Account ID from Facebook Page
   */
  async getInstagramAccountId(accessToken: string): Promise<string> {
    // First, get Facebook Pages
    const pagesResponse = await fetch(
      `${this.graphUrl}/me/accounts?access_token=${accessToken}`,
      {
        method: "GET",
      }
    )

    if (!pagesResponse.ok) {
      throw new Error("Failed to get Facebook Pages")
    }

    const pagesData = await pagesResponse.json()

    if (!pagesData.data || pagesData.data.length === 0) {
      throw new Error(
        "No Facebook Pages found. Please connect an Instagram Business account to a Facebook Page."
      )
    }

    // Get Instagram account from first page
    const pageId = pagesData.data[0].id
    const pageAccessToken = pagesData.data[0].access_token

    const igResponse = await fetch(
      `${this.graphUrl}/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`,
      {
        method: "GET",
      }
    )

    if (!igResponse.ok) {
      throw new Error("Failed to get Instagram Business Account")
    }

    const igData = await igResponse.json()

    if (!igData.instagram_business_account) {
      throw new Error(
        "No Instagram Business Account found. Please convert your Instagram account to a Business or Creator account."
      )
    }

    return igData.instagram_business_account.id
  }

  /**
   * Get Instagram account info
   */
  async getAccountInfo(
    igAccountId: string,
    accessToken: string
  ): Promise<InstagramAccountInfo> {
    const fields = [
      "id",
      "username",
      "name",
      "profile_picture_url",
      "followers_count",
      "media_count",
    ]

    const response = await fetch(
      `${this.graphUrl}/${igAccountId}?fields=${fields.join(",")}&access_token=${accessToken}`,
      {
        method: "GET",
      }
    )

    if (!response.ok) {
      throw new Error("Failed to get Instagram account info")
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(`Instagram API error: ${data.error.message}`)
    }

    return data
  }

  /**
   * Create media container (Step 1 of publishing)
   */
  async createMediaContainer(
    igAccountId: string,
    accessToken: string,
    request: InstagramMediaRequest
  ): Promise<InstagramMediaResponse> {
    const params: Record<string, string> = {
      access_token: accessToken,
      caption: request.caption,
    }

    if (request.media_type === "IMAGE" && request.image_url) {
      params.image_url = request.image_url
    } else if (request.media_type === "VIDEO" && request.video_url) {
      params.media_type = "REELS" // Videos are published as Reels
      params.video_url = request.video_url
    } else if (request.media_type === "CAROUSEL" && request.children) {
      params.media_type = "CAROUSEL"
      params.children = request.children.join(",")
    } else {
      throw new Error("Invalid media request: missing required media URL")
    }

    const formData = new URLSearchParams(params)

    const response = await fetch(
      `${this.graphUrl}/${igAccountId}/media`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to create media container: ${error}`)
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(`Instagram API error: ${data.error.message}`)
    }

    return data
  }

  /**
   * Publish media container (Step 2 of publishing)
   */
  async publishMedia(
    igAccountId: string,
    accessToken: string,
    creationId: string
  ): Promise<InstagramPublishResponse> {
    const params = new URLSearchParams({
      access_token: accessToken,
      creation_id: creationId,
    })

    const response = await fetch(
      `${this.graphUrl}/${igAccountId}/media_publish`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to publish media: ${error}`)
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(`Instagram publish error: ${data.error.message}`)
    }

    return data
  }

  /**
   * Get media info (including permalink)
   */
  async getMediaInfo(
    mediaId: string,
    accessToken: string
  ): Promise<{ id: string; permalink: string; media_type: string }> {
    const response = await fetch(
      `${this.graphUrl}/${mediaId}?fields=id,permalink,media_type&access_token=${accessToken}`,
      {
        method: "GET",
      }
    )

    if (!response.ok) {
      throw new Error("Failed to get media info")
    }

    return response.json()
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get Instagram client instance
 */
export function getInstagramClient(): InstagramClient {
  const appId = process.env.FACEBOOK_APP_ID
  const appSecret = process.env.FACEBOOK_APP_SECRET
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  if (!appId || !appSecret) {
    throw new Error(
      "Instagram credentials not found. Please set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET."
    )
  }

  return new InstagramClient({
    appId,
    appSecret,
    redirectUri: `${baseUrl}/api/social/instagram/callback`,
  })
}

/**
 * Save Instagram connection to database
 */
export async function saveInstagramConnection(
  storeId: string,
  tokenResponse: InstagramLongLivedTokenResponse,
  accountInfo: InstagramAccountInfo
): Promise<string> {
  const supabase = await createServerClient()

  const expiresAt = new Date()
  expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.expires_in)

  // Check if connection already exists
  const { data: existing } = await supabase
    .from("social_media_connections")
    .select("id")
    .eq("store_id", storeId)
    .eq("platform", "instagram")
    .eq("account_id", accountInfo.id)
    .single()

  if (existing) {
    // Update existing connection
    const { error } = await supabase
      .from("social_media_connections")
      .update({
        access_token: tokenResponse.access_token,
        token_expires_at: expiresAt.toISOString(),
        account_name: accountInfo.username,
        is_active: true,
        last_error: null,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", existing.id)

    if (error) {
      throw new Error(`Failed to update Instagram connection: ${error.message}`)
    }

    return existing.id
  } else {
    // Create new connection
    const { data, error } = await supabase
      .from("social_media_connections")
      .insert({
        store_id: storeId,
        platform: "instagram",
        account_id: accountInfo.id,
        account_name: accountInfo.username,
        access_token: tokenResponse.access_token,
        token_expires_at: expiresAt.toISOString(),
        scopes: ["instagram_basic", "instagram_content_publish"],
        is_active: true,
      } as any)
      .select("id")
      .single()

    if (error) {
      throw new Error(`Failed to save Instagram connection: ${error.message}`)
    }

    return data.id
  }
}

/**
 * Get active Instagram connection for store
 */
export async function getInstagramConnection(
  storeId: string
): Promise<SocialMediaConnection | null> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("social_media_connections")
    .select("*")
    .eq("store_id", storeId)
    .eq("platform", "instagram")
    .eq("is_active", true)
    .order("connected_at", { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return null
  }

  return {
    id: data.id,
    storeId: data.store_id,
    platform: "instagram",
    accountId: data.account_id,
    accountName: data.account_name,
    accessToken: data.access_token,
    refreshToken: data.refresh_token || undefined,
    tokenExpiresAt: new Date(data.token_expires_at),
    scopes: data.scopes || [],
    isActive: data.is_active ?? true,
    connectedAt: new Date(data.connected_at),
    lastSyncAt: data.last_sync_at ? new Date(data.last_sync_at) : undefined,
  }
}
