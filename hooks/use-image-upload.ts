"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

interface UploadProgress {
  fileName: string
  progress: number
  status: 'uploading' | 'done' | 'error'
  url?: string
  error?: string
}

interface UseImageUploadOptions {
  storeId: string
  productId: string
  maxFiles?: number
  maxSizeMB?: number
  allowedTypes?: string[]
}

const DEFAULT_ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

export function useImageUpload(options: UseImageUploadOptions) {
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const [uploading, setUploading] = useState(false)

  const maxFiles = options.maxFiles ?? 10
  const maxSize = (options.maxSizeMB ?? 10) * 1024 * 1024
  const allowedTypes = options.allowedTypes ?? DEFAULT_ALLOWED

  const uploadFiles = useCallback(async (files: File[]): Promise<string[]> => {
    // Validate
    const validFiles = files.slice(0, maxFiles).filter(f => {
      if (!allowedTypes.includes(f.type)) return false
      if (f.size > maxSize) return false
      return true
    })

    if (validFiles.length === 0) return []

    setUploading(true)
    const initialProgress: UploadProgress[] = validFiles.map(f => ({
      fileName: f.name,
      progress: 0,
      status: 'uploading',
    }))
    setUploads(initialProgress)

    const supabase = createClient()
    const urls: string[] = []

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i]
      const ext = file.name.split('.').pop() || 'jpg'
      const uuid = crypto.randomUUID()
      const path = `${options.storeId}/${options.productId}/img-${uuid}.${ext}`

      try {
        const { error } = await supabase.storage
          .from('products')
          .upload(path, file, { contentType: file.type, upsert: false })

        if (error) throw error

        const { data: urlData } = supabase.storage
          .from('products')
          .getPublicUrl(path)

        const url = urlData.publicUrl
        urls.push(url)

        setUploads(prev => prev.map((p, idx) =>
          idx === i ? { ...p, progress: 100, status: 'done', url } : p
        ))
      } catch (err) {
        setUploads(prev => prev.map((p, idx) =>
          idx === i ? { ...p, status: 'error', error: (err as Error).message } : p
        ))
      }
    }

    setUploading(false)
    return urls
  }, [options.storeId, options.productId, maxFiles, maxSize, allowedTypes])

  const clearUploads = useCallback(() => setUploads([]), [])

  return {
    uploads,
    uploading,
    uploadFiles,
    clearUploads,
  }
}
