"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Mic,
  MicOff,
  Loader2,
  Volume2,
  MessageSquare,
  Send,
  History,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ── Types ──────────────────────────────────────────────────────────────────────

type VoiceState = "idle" | "listening" | "processing" | "speaking"

interface ActionCard {
  id: string
  type: "success" | "info" | "warning" | "error"
  title: string
  description: string
}

interface CommandEntry {
  id: string
  timestamp: Date
  userMessage: string
  assistantMessage: string
  actions: ActionCard[]
}

// ── Component ──────────────────────────────────────────────────────────────────

export function VoiceAssistantClient({ storeId }: { storeId: string }) {

  // ── State ────────────────────────────────────────────────────────────────────
  const [voiceState, setVoiceState] = useState<VoiceState>("idle")
  const [transcription, setTranscription] = useState("")
  const [aiResponse, setAiResponse] = useState("")
  const [displayedResponse, setDisplayedResponse] = useState("")
  const [actions, setActions] = useState<ActionCard[]>([])
  const [textInput, setTextInput] = useState("")
  const [commandHistory, setCommandHistory] = useState<CommandEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  // ── Refs ─────────────────────────────────────────────────────────────────────
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)

  // ── Cleanup on unmount ───────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopRecording()
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current)
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause()
        audioElementRef.current = null
      }
    }
  }, [])

  // ── Play TTS audio from base64 ─────────────────────────────────────────────
  const playAudio = useCallback((base64Audio: string, contentType: string) => {
    try {
      // Stop any currently playing audio
      if (audioElementRef.current) {
        audioElementRef.current.pause()
      }

      const audioSrc = `data:${contentType};base64,${base64Audio}`
      const audio = new Audio(audioSrc)
      audioElementRef.current = audio

      audio.onended = () => {
        setVoiceState("idle")
        audioElementRef.current = null
      }

      audio.onerror = () => {
        console.error("Audio playback failed")
        setVoiceState("idle")
        audioElementRef.current = null
      }

      setVoiceState("speaking")
      audio.play().catch(() => {
        // Autoplay blocked — fall back to idle
        setVoiceState("idle")
      })
    } catch {
      setVoiceState("idle")
    }
  }, [])

  // ── Typing animation for AI response ────────────────────────────────────────
  useEffect(() => {
    if (!aiResponse) {
      setDisplayedResponse("")
      return
    }

    let index = 0
    setDisplayedResponse("")

    typingIntervalRef.current = setInterval(() => {
      if (index < aiResponse.length) {
        setDisplayedResponse(aiResponse.slice(0, index + 1))
        index++
      } else {
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current)
          typingIntervalRef.current = null
        }
      }
    }, 20)

    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current)
        typingIntervalRef.current = null
      }
    }
  }, [aiResponse])

  // ── Audio Recording ──────────────────────────────────────────────────────────

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      setPermissionDenied(false)

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      })

      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        })
        handleAudioSubmit(audioBlob)
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(250) // collect data every 250ms
      setVoiceState("listening")
      setTranscription("")
      setAiResponse("")
      setActions([])
    } catch (err) {
      console.error("Microphone access error:", err)
      if (
        err instanceof DOMException &&
        (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")
      ) {
        setPermissionDenied(true)
        setError("Microphone permission denied. Please allow access in your browser settings.")
      } else {
        setError("Could not access microphone. Please check your device settings.")
      }
      setVoiceState("idle")
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop()
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  const toggleRecording = useCallback(() => {
    if (voiceState === "listening") {
      stopRecording()
      setVoiceState("processing")
    } else if (voiceState === "idle") {
      startRecording()
    }
  }, [voiceState, startRecording, stopRecording])

  // ── Submit audio to API ──────────────────────────────────────────────────────

  const handleAudioSubmit = useCallback(
    async (audioBlob: Blob) => {
      setVoiceState("processing")
      setTranscription("Transcribing...")

      try {
        const formData = new FormData()
        formData.append("audio", audioBlob, "recording.webm")
        formData.append("storeId", storeId)

        const response = await fetch("/api/voice/dashboard", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(
            errorData.error || `Request failed with status ${response.status}`
          )
        }

        const data = await response.json()

        setTranscription(data.transcription || "")
        setAiResponse(data.response || "")

        // Parse actions from API response
        const parsedActions: ActionCard[] = (data.actions || []).map(
          (action: any, idx: number) => ({
            id: `action-${Date.now()}-${idx}`,
            type: action.type || "info",
            title: action.title || "Action completed",
            description: action.description || "",
          })
        )
        setActions(parsedActions)

        // Add to history
        const entry: CommandEntry = {
          id: `cmd-${Date.now()}`,
          timestamp: new Date(),
          userMessage: data.transcription || "",
          assistantMessage: data.response || "",
          actions: parsedActions,
        }
        setCommandHistory((prev) => [entry, ...prev].slice(0, 50))

        // Play TTS audio if available, otherwise just show text
        if (data.audio && data.audioContentType) {
          playAudio(data.audio, data.audioContentType)
        } else {
          setVoiceState("speaking")
          setTimeout(() => setVoiceState("idle"), 3000)
        }
      } catch (err) {
        console.error("Voice API error:", err)
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again."
        )
        setVoiceState("idle")
      }
    },
    [storeId, playAudio]
  )

  // ── Submit text command ──────────────────────────────────────────────────────

  const handleTextSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()
      const message = textInput.trim()
      if (!message) return

      setTextInput("")
      setVoiceState("processing")
      setTranscription(message)
      setAiResponse("")
      setActions([])
      setError(null)

      try {
        const formData = new FormData()
        // Send as text message rather than audio
        formData.append("text", message)
        formData.append("storeId", storeId)

        const response = await fetch("/api/voice/dashboard", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(
            errorData.error || `Request failed with status ${response.status}`
          )
        }

        const data = await response.json()

        setTranscription(message)
        setAiResponse(data.response || "")

        const parsedActions: ActionCard[] = (data.actions || []).map(
          (action: any, idx: number) => ({
            id: `action-${Date.now()}-${idx}`,
            type: action.type || "info",
            title: action.title || "Action completed",
            description: action.description || "",
          })
        )
        setActions(parsedActions)

        const entry: CommandEntry = {
          id: `cmd-${Date.now()}`,
          timestamp: new Date(),
          userMessage: message,
          assistantMessage: data.response || "",
          actions: parsedActions,
        }
        setCommandHistory((prev) => [entry, ...prev].slice(0, 50))

        // Play TTS audio if available, otherwise just show text
        if (data.audio && data.audioContentType) {
          playAudio(data.audio, data.audioContentType)
        } else {
          setVoiceState("speaking")
          setTimeout(() => setVoiceState("idle"), 3000)
        }
      } catch (err) {
        console.error("Text command error:", err)
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again."
        )
        setVoiceState("idle")
      }
    },
    [textInput, storeId, playAudio]
  )

  // ── Action card icon helper ──────────────────────────────────────────────────

  const getActionIcon = (type: ActionCard["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case "error":
        return <X className="h-5 w-5 text-red-500" />
      default:
        return <Sparkles className="h-5 w-5 text-blue-500" />
    }
  }

  const getActionBorder = (type: ActionCard["type"]) => {
    switch (type) {
      case "success":
        return "border-green-500/30 bg-green-500/5"
      case "warning":
        return "border-yellow-500/30 bg-yellow-500/5"
      case "error":
        return "border-red-500/30 bg-red-500/5"
      default:
        return "border-blue-500/30 bg-blue-500/5"
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Voice Assistant</h1>
          <p className="text-sm text-muted-foreground">
            Manage your store with voice commands or type below
          </p>
        </div>

        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4"
            >
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-500">{error}</p>
                {permissionDenied && (
                  <p className="text-xs text-red-400 mt-1">
                    You can also use the text input below as an alternative.
                  </p>
                )}
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-300"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Microphone Button */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            {/* Pulsing ring when listening */}
            <AnimatePresence>
              {voiceState === "listening" && (
                <>
                  <motion.div
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 1.8, opacity: 0 }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                    className="absolute inset-0 rounded-full bg-red-500/30"
                  />
                  <motion.div
                    initial={{ scale: 1, opacity: 0.4 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeOut",
                      delay: 0.3,
                    }}
                    className="absolute inset-0 rounded-full bg-red-500/20"
                  />
                </>
              )}
            </AnimatePresence>

            {/* Processing spinner ring */}
            {voiceState === "processing" && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-2 rounded-full border-2 border-transparent border-t-violet-500 border-r-violet-500/50"
              />
            )}

            {/* Speaking indicator ring */}
            {voiceState === "speaking" && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -inset-2 rounded-full border-2 border-violet-500/40"
              />
            )}

            <button
              onClick={toggleRecording}
              disabled={voiceState === "processing" || voiceState === "speaking"}
              className={cn(
                "relative flex h-24 w-24 items-center justify-center rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-ring/50",
                voiceState === "idle" &&
                  "bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg hover:shadow-xl hover:scale-105",
                voiceState === "listening" &&
                  "bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30 scale-110",
                voiceState === "processing" &&
                  "bg-gradient-to-br from-violet-500/60 to-purple-600/60 cursor-wait",
                voiceState === "speaking" &&
                  "bg-gradient-to-br from-violet-500 to-purple-600 cursor-default"
              )}
            >
              {voiceState === "idle" && (
                <Mic className="h-10 w-10 text-white" />
              )}
              {voiceState === "listening" && (
                <MicOff className="h-10 w-10 text-white" />
              )}
              {voiceState === "processing" && (
                <Loader2 className="h-10 w-10 text-white animate-spin" />
              )}
              {voiceState === "speaking" && (
                <Volume2 className="h-10 w-10 text-white" />
              )}
            </button>
          </div>

          {/* State label */}
          <p className="text-sm font-medium text-muted-foreground">
            {voiceState === "idle" && "Tap to start speaking"}
            {voiceState === "listening" && "Listening... Tap to stop"}
            {voiceState === "processing" && "Processing your command..."}
            {voiceState === "speaking" && "Assistant is responding"}
          </p>
        </div>

        {/* Transcription Display */}
        <AnimatePresence mode="wait">
          {transcription && (
            <motion.div
              key="transcription"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-xl border bg-card p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    You said
                  </p>
                  <p className="text-sm leading-relaxed">{transcription}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Response Area */}
        <AnimatePresence mode="wait">
          {displayedResponse && (
            <motion.div
              key="response"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-xl border bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-fuchsia-500/5 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-violet-500 mb-1">
                    Assistant
                  </p>
                  <p className="text-sm leading-relaxed">
                    {displayedResponse}
                    {displayedResponse.length < aiResponse.length && (
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        className="inline-block w-0.5 h-4 bg-violet-500 ml-0.5 align-middle"
                      />
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Cards */}
        <AnimatePresence>
          {actions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions performed
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {actions.map((action, idx) => (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-4",
                      getActionBorder(action.type)
                    )}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getActionIcon(action.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{action.title}</p>
                      {action.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {action.description}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Text Fallback Input */}
        <div className="rounded-xl border bg-card p-4">
          <form onSubmit={handleTextSubmit} className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type a command instead..."
              disabled={voiceState === "processing"}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
            <Button
              type="submit"
              size="icon-sm"
              variant="ghost"
              disabled={!textInput.trim() || voiceState === "processing"}
              className="flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>

        {/* Command History Toggle */}
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            <History className="h-4 w-4" />
            <span>Command History ({commandHistory.length})</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 ml-auto transition-transform",
                showHistory && "rotate-180"
              )}
            />
          </button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 space-y-3">
                  {commandHistory.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      <History className="h-8 w-8 mx-auto mb-3 opacity-40" />
                      <p>No commands yet</p>
                      <p className="text-xs mt-1">
                        Use the microphone or type a command to get started
                      </p>
                    </div>
                  ) : (
                    commandHistory.map((entry) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="rounded-xl border bg-card p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {entry.timestamp.toLocaleTimeString()}
                          </span>
                          {entry.actions.length > 0 && (
                            <span className="text-xs font-medium text-violet-500">
                              {entry.actions.length} action
                              {entry.actions.length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>

                        {/* User message */}
                        <div className="flex items-start gap-2">
                          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                            <MessageSquare className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <p className="text-sm">{entry.userMessage}</p>
                        </div>

                        {/* Assistant message */}
                        <div className="flex items-start gap-2">
                          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
                            <Sparkles className="h-3 w-3 text-white" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {entry.assistantMessage}
                          </p>
                        </div>

                        {/* Action summaries */}
                        {entry.actions.length > 0 && (
                          <div className="flex flex-wrap gap-2 pl-8">
                            {entry.actions.map((action) => (
                              <span
                                key={action.id}
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                                  action.type === "success" &&
                                    "bg-green-500/10 text-green-600",
                                  action.type === "info" &&
                                    "bg-blue-500/10 text-blue-600",
                                  action.type === "warning" &&
                                    "bg-yellow-500/10 text-yellow-600",
                                  action.type === "error" &&
                                    "bg-red-500/10 text-red-600"
                                )}
                              >
                                {action.title}
                              </span>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
