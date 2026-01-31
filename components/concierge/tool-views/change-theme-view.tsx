"use client"

import { CheckCircle, Loader2, Palette, AlertCircle } from "lucide-react"

export function ChangeThemeView({ invocation }: { invocation: any }) {
  if (invocation.state === "input-available" || invocation.state === "input-streaming") {
    return (
      <div dir="rtl" className="bg-[#16213e] rounded-xl p-4 border border-indigo-500/20">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-indigo-400" />
          <span className="text-indigo-300 font-medium">جارِ تحديث المظهر...</span>
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400 ms-auto" />
        </div>
      </div>
    )
  }

  if (invocation.state === "output-available") {
    const { status, message_ar, theme } = invocation.output
    const isSuccess = status === "changed"

    return (
      <div dir="rtl" className="bg-[#16213e] rounded-xl p-4 border border-indigo-500/20">
        <div className="flex items-center gap-2">
          {isSuccess ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400" />
          )}
          <span className={isSuccess ? "text-green-300" : "text-red-300"}>
            {message_ar}
          </span>
        </div>
        {isSuccess && theme?.primaryColor && (
          <div className="mt-2 flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full border border-white/20"
              style={{ backgroundColor: theme.primaryColor }}
            />
            {theme.secondaryColor && (
              <div
                className="w-6 h-6 rounded-full border border-white/20"
                style={{ backgroundColor: theme.secondaryColor }}
              />
            )}
          </div>
        )}
      </div>
    )
  }

  return null
}
