"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Plus,
  Loader2,
  CheckCircle2,
  XCircle,
  Instagram,
  Music2,
  Link as LinkIcon,
  Trash2,
  ExternalLink,
  Clock,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { SocialMediaConnection } from "@/types/ai"

interface SocialMediaPanelProps {
  storeId: string
}

export function SocialMediaPanel({ storeId }: SocialMediaPanelProps) {
  const [connections, setConnections] = useState<SocialMediaConnection[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"connections" | "publish">("connections")

  // Publishing form state
  const [selectedConnection, setSelectedConnection] = useState<string>("")
  const [caption, setCaption] = useState("")
  const [mediaUrl, setMediaUrl] = useState("")
  const [isPublishing, setIsPublishing] = useState(false)

  useEffect(() => {
    fetchConnections()
    fetchPosts()
  }, [storeId])

  const fetchConnections = async () => {
    setIsLoading(true)
    try {
      // TODO: Create endpoint to list connections
      // For now, mock empty state
      setConnections([])
    } catch (error) {
      console.error("Failed to fetch connections:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPosts = async () => {
    try {
      const response = await fetch(`/api/social/publish?storeId=${storeId}`)
      const data = await response.json()

      if (data.success) {
        setPosts(data.posts || [])
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error)
    }
  }

  const handleConnect = (platform: "tiktok" | "instagram") => {
    // Redirect to OAuth flow
    window.location.href = `/api/social/connect?platform=${platform}&storeId=${storeId}`
  }

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm("Are you sure you want to disconnect this account?")) {
      return
    }

    try {
      // TODO: Create disconnect endpoint
      alert("Disconnect functionality coming soon")
    } catch (error) {
      console.error("Failed to disconnect:", error)
    }
  }

  const handlePublish = async () => {
    if (!selectedConnection || !caption.trim() || !mediaUrl.trim()) {
      alert("Please fill in all fields")
      return
    }

    setIsPublishing(true)

    try {
      const response = await fetch("/api/social/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId: selectedConnection,
          caption,
          mediaUrls: [mediaUrl],
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert("Published successfully!")
        setCaption("")
        setMediaUrl("")
        fetchPosts()
      } else {
        alert(data.error || "Failed to publish")
      }
    } catch (error: any) {
      console.error("Publish error:", error)
      alert(error.message || "Failed to publish")
    } finally {
      setIsPublishing(false)
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "tiktok":
        return <Music2 className="w-5 h-5" />
      case "instagram":
        return <Instagram className="w-5 h-5" />
      default:
        return <LinkIcon className="w-5 h-5" />
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "tiktok":
        return "bg-black text-white"
      case "instagram":
        return "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold mb-1">Social Media</h2>
        <p className="text-sm text-muted-foreground">
          Connect your social accounts and publish content
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b">
        <button
          onClick={() => setActiveTab("connections")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            activeTab === "connections"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Connections
        </button>
        <button
          onClick={() => setActiveTab("publish")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            activeTab === "publish"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Publish
        </button>
      </div>

      {/* Connections Tab */}
      {activeTab === "connections" && (
        <div className="space-y-4">
          {/* Connect Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => handleConnect("tiktok")}
              className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed hover:border-primary hover:bg-accent transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                <Music2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium">Connect TikTok</div>
                <div className="text-xs text-muted-foreground">
                  Publish videos to TikTok
                </div>
              </div>
              <Plus className="w-5 h-5 text-muted-foreground" />
            </button>

            <button
              onClick={() => handleConnect("instagram")}
              className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed hover:border-primary hover:bg-accent transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                <Instagram className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium">Connect Instagram</div>
                <div className="text-xs text-muted-foreground">
                  Publish photos and videos
                </div>
              </div>
              <Plus className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Connected Accounts */}
          <div>
            <h3 className="text-sm font-medium mb-3">Connected Accounts</h3>
            <div className="space-y-3">
              {connections.map((connection) => (
                <motion.div
                  key={connection.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 rounded-lg border bg-card"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      getPlatformColor(connection.platform)
                    )}
                  >
                    {getPlatformIcon(connection.platform)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">@{connection.accountName}</div>
                    <div className="text-xs text-muted-foreground">
                      Connected {new Date(connection.connectedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {connection.isActive ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <button
                      onClick={() => handleDisconnect(connection.id)}
                      className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}

              {connections.length === 0 && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  <LinkIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No connected accounts yet</p>
                  <p className="text-xs mt-1">
                    Connect your social media accounts above
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Publish Tab */}
      {activeTab === "publish" && (
        <div className="space-y-4">
          {connections.length === 0 ? (
            <div className="text-center py-12 rounded-lg border-2 border-dashed">
              <LinkIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium mb-1">No connected accounts</p>
              <p className="text-sm text-muted-foreground mb-4">
                Connect a social media account to start publishing
              </p>
              <Button
                onClick={() => setActiveTab("connections")}
                variant="outline"
              >
                Go to Connections
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-lg border bg-card p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Platform
                  </label>
                  <select
                    value={selectedConnection}
                    onChange={(e) => setSelectedConnection(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border bg-background"
                  >
                    <option value="">Select a connected account...</option>
                    {connections.map((conn) => (
                      <option key={conn.id} value={conn.id}>
                        {conn.platform.toUpperCase()} - @{conn.accountName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Media URL (Image or Video)
                  </label>
                  <input
                    type="url"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="https://example.com/media.mp4"
                    className="w-full px-4 py-2 rounded-lg border bg-background"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Caption
                  </label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write your caption here..."
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border bg-background resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {caption.length} characters
                  </p>
                </div>

                <Button
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="w-full bg-gradient-to-r from-violet-500 to-purple-600"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Publish Now
                    </>
                  )}
                </Button>
              </div>

              {/* Recent Posts */}
              <div>
                <h3 className="text-sm font-medium mb-3">Recent Posts</h3>
                <div className="space-y-3">
                  {posts.slice(0, 5).map((post) => (
                    <div
                      key={post.id}
                      className="flex items-start gap-3 p-4 rounded-lg border bg-card"
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                          getPlatformColor(post.platform)
                        )}
                      >
                        {getPlatformIcon(post.platform)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-2 mb-1">
                          {post.caption}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full",
                            post.status === "published" && "bg-green-500/10 text-green-600",
                            post.status === "failed" && "bg-red-500/10 text-red-600",
                            post.status === "scheduled" && "bg-yellow-500/10 text-yellow-600"
                          )}>
                            {post.status}
                          </span>
                          {post.published_at && (
                            <span>
                              <Calendar className="w-3 h-3 inline mr-1" />
                              {new Date(post.published_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      {post.platform_url && (
                        <a
                          href={post.platform_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-accent"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  ))}

                  {posts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No posts yet</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
