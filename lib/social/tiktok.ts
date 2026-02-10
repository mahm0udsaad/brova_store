/**
 * TikTok OAuth & Publishing Integration
 *
 * Implements TikTok Login Kit (OAuth 2.0) for account connection
 * and Content Posting API for video publishing
 *
 * API Docs: https://developers.tiktok.com/doc/login-kit-web
 * Content API: https://developers.tiktok.com/doc/content-posting-api-get-started
 */

import { createServerClient } from "@/lib/supabase/server"
import type { SocialMediaConnection, PostContent } from "@/types/ai"

// ============================================================================
// Types
// ============================================================================

export interface TikTokConfig {
  clientKey: string
  clientSecret: string
  redirectUri: string
}

export interface TikTokAuthUrl {
  url: string
  state: string
  codeVerifier: string
}

export interface TikTokTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number // seconds
  token_type: "Bearer"
  scope: string
  open_id: string
}

export interface TikTokUserInfo {
  open_id: string
  union_id: string
  avatar_url: string
  display_name: string
}

export interface TikTokVideoUploadRequest {
  video_url: string
  caption: string
  privacy_level?: "PUBLIC_TO_EVERYONE" | "MUTUAL_FOLLOW_FRIENDS" | "SELF_ONLY"
  disable_comment?: boolean
  disable_duet?: boolean
  disable_stitch?: boolean
}

export interface TikTokVideoUploadResponse {
  publish_id: string
  status: "PROCESSING" | "SUCCESS" | "FAILED"
}

// ============================================================================
// TikTok Client
// ============================================================================

export class TikTokClient {
  private config: TikTokConfig
  private baseUrl = "https://open.tiktokapis.com"
  private authUrl = "https://www.tiktok.com/v2/auth/authorize"
  private tokenUrl = "https://open.tiktokapis.com/v2/oauth/token/"

  constructor(config: TikTokConfig) {
    this.config = config
  }

  /**
   * Generate OAuth authorization URL
   */
  async getAuthorizationUrl(storeId: string): Promise<TikTokAuthUrl> {
    // Generate PKCE code verifier and challenge
    const codeVerifier = this.generateCodeVerifier()
    const codeChallenge = await this.generateCodeChallenge(codeVerifier)

    // Generate state parameter (includes storeId for callback)
    const state = Buffer.from(
      JSON.stringify({
        storeId,
        timestamp: Date.now(),
        random: Math.random().toString(36),
      })
    ).toString("base64url")

    // Required scopes for content posting
    const scopes = [
      "user.info.basic",
      "video.upload",
      "video.publish",
    ]

    const params = new URLSearchParams({
      client_key: this.config.clientKey,
      scope: scopes.join(","),
      response_type: "code",
      redirect_uri: this.config.redirectUri,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    })

    return {
      url: `${this.authUrl}?${params.toString()}`,
      state,
      codeVerifier,
    }
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    code: string,
    codeVerifier: string
  ): Promise<TikTokTokenResponse> {
    const response = await fetch(this.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_key: this.config.clientKey,
        client_secret: this.config.clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: this.config.redirectUri,
        code_verifier: codeVerifier,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`TikTok token exchange failed: ${error}`)
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(`TikTok OAuth error: ${data.error} - ${data.error_description}`)
    }

    return data.data
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<TikTokTokenResponse> {
    const response = await fetch(this.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_key: this.config.clientKey,
        client_secret: this.config.clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`TikTok token refresh failed: ${error}`)
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(`TikTok refresh error: ${data.error}`)
    }

    return data.data
  }

  /**
   * Get user info
   */
  async getUserInfo(accessToken: string): Promise<TikTokUserInfo> {
    const response = await fetch(`${this.baseUrl}/v2/user/info/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get TikTok user info: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(`TikTok API error: ${data.error.message}`)
    }

    return data.data.user
  }

  /**
   * Upload and publish video
   */
  async publishVideo(
    accessToken: string,
    request: TikTokVideoUploadRequest
  ): Promise<TikTokVideoUploadResponse> {
    // Step 1: Initialize video upload
    const initResponse = await fetch(`${this.baseUrl}/v2/post/publish/video/init/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        post_info: {
          title: request.caption.substring(0, 150), // TikTok title limit
          privacy_level: request.privacy_level || "PUBLIC_TO_EVERYONE",
          disable_comment: request.disable_comment ?? false,
          disable_duet: request.disable_duet ?? false,
          disable_stitch: request.disable_stitch ?? false,
        },
        source_info: {
          source: "PULL_FROM_URL",
          video_url: request.video_url,
        },
      }),
    })

    if (!initResponse.ok) {
      const error = await initResponse.text()
      throw new Error(`TikTok video upload init failed: ${error}`)
    }

    const data = await initResponse.json()

    if (data.error) {
      throw new Error(`TikTok upload error: ${data.error.message}`)
    }

    return {
      publish_id: data.data.publish_id,
      status: "PROCESSING",
    }
  }

  /**
   * Check video publish status
   */
  async getPublishStatus(
    accessToken: string,
    publishId: string
  ): Promise<{ status: string; fail_reason?: string; video_id?: string }> {
    const response = await fetch(
      `${this.baseUrl}/v2/post/publish/status/fetch/?publish_id=${publishId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to check TikTok publish status: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(`TikTok API error: ${data.error.message}`)
    }

    return data.data
  }

  /**
   * Generate PKCE code verifier
   */
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Buffer.from(array).toString("base64url")
  }

  /**
   * Generate PKCE code challenge from verifier
   */
  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(verifier)
    const hash = await crypto.subtle.digest("SHA-256", data)
    return Buffer.from(hash).toString("base64url")
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get TikTok client instance
 */
export function getTikTokClient(): TikTokClient {
  const clientKey = process.env.TIKTOK_CLIENT_KEY
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  if (!clientKey || !clientSecret) {
    throw new Error(
      "TikTok credentials not found. Please set TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET."
    )
  }

  return new TikTokClient({
    clientKey,
    clientSecret,
    redirectUri: `${baseUrl}/api/social/tiktok/callback`,
  })
}

/**
 * Save TikTok connection to database
 */
export async function saveTikTokConnection(
  storeId: string,
  tokenResponse: TikTokTokenResponse,
  userInfo: TikTokUserInfo
): Promise<string> {
  const supabase = await createServerClient()

  const expiresAt = new Date()
  expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.expires_in)

  // Check if connection already exists
  const { data: existing } = await supabase
    .from("social_media_connections")
    .select("id")
    .eq("store_id", storeId)
    .eq("platform", "tiktok")
    .eq("account_id", userInfo.open_id)
    .single()

  if (existing) {
    // Update existing connection
    const { error } = await supabase
      .from("social_media_connections")
      .update({
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        token_expires_at: expiresAt.toISOString(),
        account_name: userInfo.display_name,
        scopes: tokenResponse.scope.split(","),
        is_active: true,
        last_error: null,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", existing.id)

    if (error) {
      throw new Error(`Failed to update TikTok connection: ${error.message}`)
    }

    return existing.id
  } else {
    // Create new connection
    const { data, error } = await supabase
      .from("social_media_connections")
      .insert({
        store_id: storeId,
        platform: "tiktok",
        account_id: userInfo.open_id,
        account_name: userInfo.display_name,
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        token_expires_at: expiresAt.toISOString(),
        scopes: tokenResponse.scope.split(","),
        is_active: true,
      } as any)
      .select("id")
      .single()

    if (error) {
      throw new Error(`Failed to save TikTok connection: ${error.message}`)
    }

    return data.id
  }
}

/**
 * Get active TikTok connection for store
 */
export async function getTikTokConnection(
  storeId: string
): Promise<SocialMediaConnection | null> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("social_media_connections")
    .select("*")
    .eq("store_id", storeId)
    .eq("platform", "tiktok")
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
    platform: "tiktok",
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
