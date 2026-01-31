"use client"

import { Loader2, ImageIcon, CheckCircle } from "lucide-react"

export function GenerateImageView({ invocation }: { invocation: any }) {
  if (invocation.state === "input-available" || invocation.state === "input-streaming") {
    return (
      <div dir="rtl" className="bg-[#16213e] rounded-xl p-4 border border-indigo-500/20">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-indigo-400" />
          <span className="text-indigo-300 font-medium">جارِ إنشاء الصورة...</span>
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400 ms-auto" />
        </div>
      </div>
    )
  }

  if (invocation.state === "output-available") {
    return (
      <div dir="rtl" className="bg-[#16213e] rounded-xl p-4 border border-indigo-500/20">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-green-300">{invocation.output.message_ar}</span>
        </div>
      </div>
    )
  }

  return null
}
