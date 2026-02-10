/**
 * Social Media Token Manager
 *
 * Manages token refresh for expiring social media connections
 * Runs as a background service to keep tokens fresh
 */

import { createServerClient } from "@/lib/supabase/server"
import { getTikTokClient } from "./tiktok"
import { getInstagramClient } from "./instagram"
import type { SocialMediaConnection } from "@/types/ai"

// ============================================================================
// Token Refresh Functions
// ============================================================================

/**
 * Refresh TikTok access token
 */
async function refreshTikTokToken(
  connection: SocialMediaConnection
): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
  if (!connection.refreshToken) {
    throw new Error("No refresh token available for TikTok connection")
  }

  const client = getTikTokClient()
  const tokenResponse = await client.refreshAccessToken(connection.refreshToken)

  const expiresAt = new Date()
  expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.expires_in)

  return {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token,
    expiresAt,
  }
}

/**
 * Refresh Instagram access token
 */
async function refreshInstagramToken(
  connection: SocialMediaConnection
): Promise<{ accessToken: string; expiresAt: Date }> {
  const client = getInstagramClient()
  const tokenResponse = await client.refreshLongLivedToken(connection.accessToken)

  const expiresAt = new Date()
  expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.expires_in)

  return {
    accessToken: tokenResponse.access_token,
    expiresAt,
  }
}

/**
 * Refresh token for a connection
 */
export async function refreshConnectionToken(
  connectionId: string
): Promise<void> {
  const supabase = await createServerClient()

  // Get connection
  const { data: connection, error } = await supabase
    .from("social_media_connections")
    .select("*")
    .eq("id", connectionId)
    .single()

  if (error || !connection) {
    throw new Error(`Connection not found: ${connectionId}`)
  }

  const connData: SocialMediaConnection = {
    id: connection.id,
    storeId: connection.store_id,
    platform: connection.platform as any,
    accountId: connection.account_id,
    accountName: connection.account_name,
    accessToken: connection.access_token,
    refreshToken: connection.refresh_token || undefined,
    tokenExpiresAt: new Date(connection.token_expires_at),
    scopes: connection.scopes || [],
    isActive: connection.is_active ?? true,
    connectedAt: new Date(connection.connected_at),
    lastSyncAt: connection.last_sync_at
      ? new Date(connection.last_sync_at)
      : undefined,
  }

  try {
    let newToken: {
      accessToken: string
      refreshToken?: string
      expiresAt: Date
    }

    // Refresh based on platform
    switch (connData.platform) {
      case "tiktok":
        newToken = await refreshTikTokToken(connData)
        break

      case "instagram":
        newToken = await refreshInstagramToken(connData)
        break

      default:
        throw new Error(`Unsupported platform: ${connData.platform}`)
    }

    // Update database
    const updateData: any = {
      access_token: newToken.accessToken,
      token_expires_at: newToken.expiresAt.toISOString(),
      last_error: null,
      updated_at: new Date().toISOString(),
    }

    if (newToken.refreshToken) {
      updateData.refresh_token = newToken.refreshToken
    }

    const { error: updateError } = await supabase
      .from("social_media_connections")
      .update(updateData)
      .eq("id", connectionId)

    if (updateError) {
      throw new Error(`Failed to update connection: ${updateError.message}`)
    }

    console.log(`Token refreshed for connection ${connectionId}`)
  } catch (error: any) {
    console.error(`Failed to refresh token for ${connectionId}:`, error)

    // Update last_error in database
    await supabase
      .from("social_media_connections")
      .update({
        last_error: error.message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", connectionId)

    throw error
  }
}

/**
 * Check if token needs refresh (expires within 7 days)
 */
export function tokenNeedsRefresh(expiresAt: Date): boolean {
  const now = new Date()
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  return expiresAt <= sevenDaysFromNow
}

/**
 * Get connection with auto-refresh
 */
export async function getConnectionWithRefresh(
  connectionId: string
): Promise<SocialMediaConnection> {
  const supabase = await createServerClient()

  const { data: connection, error } = await supabase
    .from("social_media_connections")
    .select("*")
    .eq("id", connectionId)
    .single()

  if (error || !connection) {
    throw new Error(`Connection not found: ${connectionId}`)
  }

  const connData: SocialMediaConnection = {
    id: connection.id,
    storeId: connection.store_id,
    platform: connection.platform as any,
    accountId: connection.account_id,
    accountName: connection.account_name,
    accessToken: connection.access_token,
    refreshToken: connection.refresh_token || undefined,
    tokenExpiresAt: new Date(connection.token_expires_at),
    scopes: connection.scopes || [],
    isActive: connection.is_active ?? true,
    connectedAt: new Date(connection.connected_at),
    lastSyncAt: connection.last_sync_at
      ? new Date(connection.last_sync_at)
      : undefined,
  }

  // Check if token needs refresh
  if (tokenNeedsRefresh(connData.tokenExpiresAt)) {
    console.log(`Token for ${connectionId} needs refresh, refreshing...`)
    await refreshConnectionToken(connectionId)

    // Fetch updated connection
    const { data: updatedConnection } = await supabase
      .from("social_media_connections")
      .select("*")
      .eq("id", connectionId)
      .single()

    if (updatedConnection) {
      return {
        ...connData,
        accessToken: updatedConnection.access_token,
        refreshToken: updatedConnection.refresh_token || undefined,
        tokenExpiresAt: new Date(updatedConnection.token_expires_at),
      }
    }
  }

  return connData
}

/**
 * Refresh all expiring tokens (background job)
 */
export async function refreshExpiringTokens(): Promise<{
  refreshed: number
  failed: number
}> {
  const supabase = await createServerClient()

  // Get all connections expiring within 7 days
  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

  const { data: connections, error } = await supabase
    .from("social_media_connections")
    .select("id, platform, token_expires_at")
    .eq("is_active", true)
    .lt("token_expires_at", sevenDaysFromNow.toISOString())

  if (error) {
    console.error("Failed to fetch expiring connections:", error)
    return { refreshed: 0, failed: 0 }
  }

  if (!connections || connections.length === 0) {
    console.log("No tokens need refresh")
    return { refreshed: 0, failed: 0 }
  }

  console.log(`Found ${connections.length} tokens to refresh`)

  let refreshed = 0
  let failed = 0

  for (const connection of connections) {
    try {
      await refreshConnectionToken(connection.id)
      refreshed++
    } catch (error) {
      console.error(`Failed to refresh ${connection.id}:`, error)
      failed++
    }
  }

  console.log(`Token refresh complete: ${refreshed} refreshed, ${failed} failed`)

  return { refreshed, failed }
}

/**
 * Deactivate connection (on permanent failure)
 */
export async function deactivateConnection(
  connectionId: string,
  reason: string
): Promise<void> {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from("social_media_connections")
    .update({
      is_active: false,
      last_error: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", connectionId)

  if (error) {
    throw new Error(`Failed to deactivate connection: ${error.message}`)
  }

  console.log(`Connection ${connectionId} deactivated: ${reason}`)
}

/**
 * List all connections for a store
 */
export async function listStoreConnections(
  storeId: string
): Promise<SocialMediaConnection[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("social_media_connections")
    .select("*")
    .eq("store_id", storeId)
    .order("connected_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to list connections: ${error.message}`)
  }

  return (data || []).map((connection) => ({
    id: connection.id,
    storeId: connection.store_id,
    platform: connection.platform as any,
    accountId: connection.account_id,
    accountName: connection.account_name,
    accessToken: connection.access_token,
    refreshToken: connection.refresh_token || undefined,
    tokenExpiresAt: new Date(connection.token_expires_at),
    scopes: connection.scopes || [],
    isActive: connection.is_active ?? true,
    connectedAt: new Date(connection.connected_at),
    lastSyncAt: connection.last_sync_at
      ? new Date(connection.last_sync_at)
      : undefined,
  }))
}

/**
 * Disconnect (delete) a social media connection
 */
export async function disconnectConnection(connectionId: string): Promise<void> {
  const supabase = await createServerClient()

  // First deactivate any pending posts
  await supabase
    .from("social_media_posts")
    .update({
      status: "failed",
      error: "Connection disconnected",
      updated_at: new Date().toISOString(),
    })
    .eq("connection_id", connectionId)
    .in("status", ["draft", "scheduled", "publishing"])

  // Delete connection
  const { error } = await supabase
    .from("social_media_connections")
    .delete()
    .eq("id", connectionId)

  if (error) {
    throw new Error(`Failed to disconnect: ${error.message}`)
  }

  console.log(`Connection ${connectionId} disconnected`)
}
