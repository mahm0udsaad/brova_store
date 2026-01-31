"use client"

import { CheckCircle, Loader2, Pencil } from "lucide-react"

export function EditComponentView({ invocation }: { invocation: any }) {
  if (invocation.state === "input-available" || invocation.state === "input-streaming") {
    return (
      <div dir="rtl" className="bg-[#16213e] rounded-xl p-4 border border-indigo-500/20">
        <div className="flex items-center gap-2">
          <Pencil className="w-5 h-5 text-indigo-400" />
          <span className="text-indigo-300 font-medium">جارِ تعديل المكون...</span>
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400 ms-auto" />
        </div>
      </div>
    )
  }

  if (invocation.state === "output-available") {
    const { status, message_ar, updatedFields } = invocation.output
    const isSuccess = status === "updated"

    return (
      <div dir="rtl" className="bg-[#16213e] rounded-xl p-4 border border-indigo-500/20">
        <div className="flex items-center gap-2">
          {isSuccess ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <Pencil className="w-5 h-5 text-red-400" />
          )}
          <span className={isSuccess ? "text-green-300" : "text-red-300"}>
            {message_ar}
          </span>
        </div>
        {isSuccess && updatedFields && (
          <p className="text-xs text-gray-500 mt-1">
            الحقول المحدثة: {updatedFields.join("، ")}
          </p>
        )}
      </div>
    )
  }

  return null
}
