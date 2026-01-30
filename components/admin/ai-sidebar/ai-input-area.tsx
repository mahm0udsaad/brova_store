"use client"

import { useState, useRef, KeyboardEvent } from "react"
import { Paperclip, Send, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface AIInputAreaProps {
  onSend: (content: string, images?: string[]) => void
  disabled?: boolean
}

export function AIInputArea({ onSend, disabled }: AIInputAreaProps) {
  const [input, setInput] = useState("")
  const [images, setImages] = useState<string[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = () => {
    if (!input.trim() && images.length === 0) return
    if (disabled) return

    onSend(input.trim(), images.length > 0 ? images : undefined)
    setInput("")
    setImages([])

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter((file) => file.type.startsWith("image/"))

    // Convert to data URLs
    imageFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages((prev) => [...prev, event.target!.result as string])
        }
      }
      reader.readAsDataURL(file)
    })

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = "auto"
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 p-4">
      {/* Image previews */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {images.map((img, idx) => (
            <div key={idx} className="relative group">
              <img
                src={img}
                alt={`Upload ${idx + 1}`}
                className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
              />
              <button
                onClick={() => removeImage(idx)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className={cn(
            "p-2 rounded-lg transition-colors flex-shrink-0",
            disabled
              ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
              : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          )}
          title="Attach images"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Ask me anything... (Shift+Enter for new line)"
            className={cn(
              "w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            rows={1}
            style={{ minHeight: "48px", maxHeight: "200px" }}
          />

          <button
            onClick={handleSubmit}
            disabled={disabled || (!input.trim() && images.length === 0)}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all",
              disabled || (!input.trim() && images.length === 0)
                ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                : "text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950"
            )}
            title="Send (Enter)"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  )
}
