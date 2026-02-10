"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Video,
  Upload,
  Image as ImageIcon,
  Type,
  Loader2,
  CheckCircle2,
  XCircle,
  Play,
  Download,
  Clock,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { VideoGenerationTask } from "@/types/ai"

interface VideoGenerationPanelProps {
  storeId: string
}

export function VideoGenerationPanel({ storeId }: VideoGenerationPanelProps) {
  const [generationType, setGenerationType] = useState<"text" | "image">("text")
  const [prompt, setPrompt] = useState("")
  const [promptAr, setPromptAr] = useState("")
  const [sourceImage, setSourceImage] = useState("")
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9")
  const [duration, setDuration] = useState(5)
  const [isGenerating, setIsGenerating] = useState(false)
  const [tasks, setTasks] = useState<VideoGenerationTask[]>([])
  const [activeTask, setActiveTask] = useState<string | null>(null)

  // Fetch existing tasks
  useEffect(() => {
    fetchTasks()
  }, [storeId])

  const fetchTasks = async () => {
    try {
      const response = await fetch(
        `/api/video/generate?storeId=${storeId}&limit=10`
      )
      const data = await response.json()

      if (data.success) {
        setTasks(data.tasks || [])
      }
    } catch (error) {
      console.error("Failed to fetch video tasks:", error)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert("Please enter a prompt")
      return
    }

    if (generationType === "image" && !sourceImage.trim()) {
      alert("Please enter a source image URL")
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch("/api/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          type: generationType === "text" ? "text_to_video" : "image_to_video",
          prompt,
          promptAr: promptAr || undefined,
          sourceImage: generationType === "image" ? sourceImage : undefined,
          aspectRatio,
          duration,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setActiveTask(data.task.id)
        setPrompt("")
        setPromptAr("")
        setSourceImage("")

        // Start polling for this task
        pollTaskStatus(data.task.id)
      } else {
        alert(data.error || "Failed to generate video")
      }
    } catch (error: any) {
      console.error("Video generation error:", error)
      alert(error.message || "Failed to generate video")
    } finally {
      setIsGenerating(false)
    }
  }

  const pollTaskStatus = async (taskId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/video/generate?taskId=${taskId}`)
        const data = await response.json()

        if (data.success) {
          const task = data.task

          // Update tasks list
          setTasks((prev) => {
            const index = prev.findIndex((t) => t.id === taskId)
            if (index >= 0) {
              const newTasks = [...prev]
              newTasks[index] = task
              return newTasks
            }
            return [task, ...prev]
          })

          // Stop polling if completed or failed
          if (task.status === "completed" || task.status === "failed") {
            clearInterval(pollInterval)
            if (activeTask === taskId) {
              setActiveTask(null)
            }
          }
        }
      } catch (error) {
        console.error("Failed to poll task status:", error)
      }
    }, 10000) // Poll every 10 seconds

    // Clean up after 10 minutes
    setTimeout(() => clearInterval(pollInterval), 600000)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case "failed":
      case "expired":
        return <XCircle className="w-5 h-5 text-red-500" />
      case "processing":
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-600 dark:text-green-400"
      case "failed":
      case "expired":
        return "bg-red-500/10 text-red-600 dark:text-red-400"
      case "processing":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400"
      default:
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold mb-1">Video Generation</h2>
        <p className="text-sm text-muted-foreground">
          Create product videos using AI (powered by Kling AI)
        </p>
      </div>

      {/* Generation Form */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setGenerationType("text")}
            className={cn(
              "flex-1 py-3 px-4 rounded-lg border-2 transition-all",
              generationType === "text"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <Type className="w-5 h-5 mx-auto mb-1" />
            <div className="text-sm font-medium">Text to Video</div>
          </button>
          <button
            onClick={() => setGenerationType("image")}
            className={cn(
              "flex-1 py-3 px-4 rounded-lg border-2 transition-all",
              generationType === "image"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <ImageIcon className="w-5 h-5 mx-auto mb-1" />
            <div className="text-sm font-medium">Image to Video</div>
          </button>
        </div>

        {generationType === "image" && (
          <div>
            <label className="text-sm font-medium mb-2 block">
              Source Image URL
            </label>
            <input
              type="url"
              value={sourceImage}
              onChange={(e) => setSourceImage(e.target.value)}
              placeholder="https://example.com/product-image.jpg"
              className="w-full px-4 py-2 rounded-lg border bg-background"
            />
          </div>
        )}

        <div>
          <label className="text-sm font-medium mb-2 block">
            Prompt (English)
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the video you want to create..."
            rows={3}
            className="w-full px-4 py-2 rounded-lg border bg-background resize-none"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Prompt (Arabic) - Optional
          </label>
          <textarea
            value={promptAr}
            onChange={(e) => setPromptAr(e.target.value)}
            placeholder="وصف الفيديو بالعربية..."
            rows={2}
            className="w-full px-4 py-2 rounded-lg border bg-background resize-none"
            dir="rtl"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Aspect Ratio
            </label>
            <select
              value={aspectRatio}
              onChange={(e) =>
                setAspectRatio(e.target.value as "16:9" | "9:16" | "1:1")
              }
              className="w-full px-4 py-2 rounded-lg border bg-background"
            >
              <option value="16:9">16:9 (Landscape)</option>
              <option value="9:16">9:16 (Portrait)</option>
              <option value="1:1">1:1 (Square)</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-lg border bg-background"
            >
              <option value={5}>5 seconds</option>
              <option value={10}>10 seconds</option>
            </select>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-violet-500 to-purple-600"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Video
            </>
          )}
        </Button>
      </div>

      {/* Tasks List */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Recent Videos</h3>
        <div className="space-y-3">
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border bg-card p-4"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">{getStatusIcon(task.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-1 rounded-full",
                        getStatusColor(task.status)
                      )}
                    >
                      {task.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(task.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm line-clamp-2">{task.request.prompt}</p>
                  {task.progress !== undefined && task.status === "processing" && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                {task.status === "completed" && task.resultUrl && (
                  <div className="flex gap-2">
                    <a
                      href={task.resultUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg border hover:bg-accent"
                    >
                      <Play className="w-4 h-4" />
                    </a>
                    <a
                      href={task.resultUrl}
                      download
                      className="p-2 rounded-lg border hover:bg-accent"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {tasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No videos generated yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
